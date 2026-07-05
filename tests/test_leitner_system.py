from __future__ import annotations

import json
import gc
import os
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from http import HTTPStatus
from http.server import ThreadingHTTPServer
from pathlib import Path

import app


class QuietHandler(app.AppHandler):
    def log_message(self, format: str, *args: object) -> None:
        return


class LeitnerSystemApiTest(unittest.TestCase):
    """Covers the Leitner study mode end to end, and asserts it never touches
    the existing study mode's tables/counters (study_rounds, reviews,
    cards.correct_count/wrong_count)."""

    def setUp(self) -> None:
        tmp_root = Path(os.environ.get("BUNPO_LOOP_TEST_TMP") or tempfile.gettempdir()) / "bunpo-loop-tests"
        tmp_root.mkdir(parents=True, exist_ok=True)
        self.tmp = tempfile.TemporaryDirectory(dir=tmp_root)
        self.old_db_path = app.DB_PATH
        self.old_data_dir = app.DATA_DIR
        self.old_app_user = app.APP_USER
        self.old_app_password = app.APP_PASSWORD
        self.old_default_seed_data_dir = app.DEFAULT_SEED_DATA_DIR
        app.DATA_DIR = Path(self.tmp.name)
        app.DB_PATH = app.DATA_DIR / "test.sqlite3"
        app.APP_USER = None
        app.APP_PASSWORD = None
        app.DEFAULT_SEED_DATA_DIR = app.DATA_DIR / "missing-default-data"
        app.init_db()

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base_url = f"http://127.0.0.1:{self.server.server_address[1]}"

        login = self.request_json(
            "/api/auth",
            method="POST",
            body={"nickname": "상운", "access_code": "960725"},
            auth=False,
        )
        self.user_id = int(login["user"]["id"])

    def tearDown(self) -> None:
        self.server.shutdown()
        self.thread.join(timeout=2)
        self.server.server_close()
        gc.collect()
        app.DB_PATH = self.old_db_path
        app.DATA_DIR = self.old_data_dir
        app.APP_USER = self.old_app_user
        app.APP_PASSWORD = self.old_app_password
        app.DEFAULT_SEED_DATA_DIR = self.old_default_seed_data_dir
        self.tmp.cleanup()

    def auth_headers(self) -> dict[str, str]:
        return {
            "X-Byeorakchigi-User-Id": str(self.user_id),
            "X-Byeorakchigi-Code": "960725",
        }

    def request_json(
        self,
        path: str,
        *,
        method: str = "GET",
        body: dict | None = None,
        auth: bool = True,
        expected: int = HTTPStatus.OK,
    ) -> dict:
        headers = {"Accept": "application/json"}
        if auth:
            headers.update(self.auth_headers())
        data = None
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        request = urllib.request.Request(f"{self.base_url}{path}", data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                payload = json.loads(response.read().decode("utf-8"))
                self.assertEqual(expected, response.status, payload)
                return payload
        except urllib.error.HTTPError as error:
            payload = json.loads(error.read().decode("utf-8"))
            self.assertEqual(expected, error.code, payload)
            return payload
        finally:
            # This sandbox's filesystem occasionally makes a freshly committed
            # sqlite WAL write visible to a *new* connection (opened by the
            # very next request) only after a short delay. Give it a beat so
            # sequential mutating calls in these tests don't race ahead of
            # their own commits.
            if method != "GET":
                time.sleep(0.05)

    def create_collection_and_group(self, group_name: str = "동사 활용") -> tuple[int, int]:
        collection = self.request_json(
            "/api/collections",
            method="POST",
            body={"name": f"라이트너 테스트 {group_name}", "description": ""},
            expected=HTTPStatus.CREATED,
        )["collection"]
        group = self.request_json(
            "/api/groups",
            method="POST",
            body={"collection_id": collection["id"], "name": group_name, "description": ""},
            expected=HTTPStatus.CREATED,
        )["group"]
        return int(collection["id"]), int(group["id"])

    def create_card(self, group_id: int, front: str) -> dict:
        return self.request_json(
            "/api/cards",
            method="POST",
            body={"group_id": group_id, "front": front, "back": f"{front} 뜻", "memo": ""},
            expected=HTTPStatus.CREATED,
        )["card"]

    def group_cards(self, group_id: int) -> list[dict]:
        return self.request_json(f"/api/cards?group_id={group_id}")["cards"]

    def test_new_card_defaults_to_box_1_due_today_and_appears_in_queue(self) -> None:
        _collection_id, group_id = self.create_collection_and_group()
        card = self.create_card(group_id, "食べる")

        study = self.request_json(f"/api/leitner/study?group_id={group_id}")
        self.assertEqual([card["id"]], [c["id"] for c in study["cards"]])
        self.assertEqual(1, study["cards"][0]["leitner_box"])
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        self.assertEqual(today, study["cards"][0]["leitner_due_at"])

    def test_correct_answer_moves_box_up_and_wrong_resets_to_box_1(self) -> None:
        _collection_id, group_id = self.create_collection_and_group()
        card = self.create_card(group_id, "飲む")

        # Prime the leitner_states row (box=1, due today) by fetching the queue once.
        self.request_json(f"/api/leitner/study?group_id={group_id}")

        review = self.request_json(
            "/api/leitner/review",
            method="POST",
            body={"card_id": card["id"], "result": "correct"},
            expected=HTTPStatus.CREATED,
        )
        self.assertEqual(1, review["box_before"])
        self.assertEqual(2, review["box_after"])
        today = datetime.now(timezone.utc)
        expected_due = (today + timedelta(days=app.LEITNER_BOX_INTERVAL_DAYS[2])).strftime("%Y-%m-%d")
        self.assertEqual(expected_due, review["due_at"])

        # Box 2 card isn't due again today, so it should drop out of the queue.
        study_after_correct = self.request_json(f"/api/leitner/study?group_id={group_id}")
        self.assertEqual([], study_after_correct["cards"])

        # Force it back into today's queue to exercise a wrong answer from box 2.
        with app.connect() as conn:
            conn.execute(
                "UPDATE leitner_states SET due_at = ? WHERE card_id = ?",
                (today.strftime("%Y-%m-%d"), card["id"]),
            )

        wrong_review = self.request_json(
            "/api/leitner/review",
            method="POST",
            body={"card_id": card["id"], "result": "wrong"},
            expected=HTTPStatus.CREATED,
        )
        self.assertEqual(2, wrong_review["box_before"])
        self.assertEqual(1, wrong_review["box_after"])
        self.assertEqual((today + timedelta(days=1)).strftime("%Y-%m-%d"), wrong_review["due_at"])

    def test_box_is_capped_at_max(self) -> None:
        _collection_id, group_id = self.create_collection_and_group()
        card = self.create_card(group_id, "話す")
        self.request_json(f"/api/leitner/study?group_id={group_id}")

        with app.connect() as conn:
            conn.execute(
                "UPDATE leitner_states SET box = ?, due_at = ? WHERE card_id = ?",
                (app.LEITNER_MAX_BOX, datetime.now(timezone.utc).strftime("%Y-%m-%d"), card["id"]),
            )

        review = self.request_json(
            "/api/leitner/review",
            method="POST",
            body={"card_id": card["id"], "result": "correct"},
            expected=HTTPStatus.CREATED,
        )
        self.assertEqual(app.LEITNER_MAX_BOX, review["box_before"])
        self.assertEqual(app.LEITNER_MAX_BOX, review["box_after"])

    def test_only_due_cards_are_returned(self) -> None:
        _collection_id, group_id = self.create_collection_and_group()
        due_card = self.create_card(group_id, "見る")
        future_card = self.create_card(group_id, "聞く")
        self.request_json(f"/api/leitner/study?group_id={group_id}")

        future_date = (datetime.now(timezone.utc) + timedelta(days=5)).strftime("%Y-%m-%d")
        with app.connect() as conn:
            conn.execute(
                "UPDATE leitner_states SET due_at = ? WHERE card_id = ?",
                (future_date, future_card["id"]),
            )

        study = self.request_json(f"/api/leitner/study?group_id={group_id}")
        self.assertEqual([due_card["id"]], [c["id"] for c in study["cards"]])
        self.assertEqual(2, study["total_scope_cards"])

    def test_collection_scope_with_group_ids_matches_group_scope(self) -> None:
        collection_id, group_id = self.create_collection_and_group()
        card = self.create_card(group_id, "書く")

        by_group = self.request_json(f"/api/leitner/study?group_id={group_id}")
        by_collection = self.request_json(
            f"/api/leitner/study?collection_id={collection_id}&group_ids={group_id}"
        )
        self.assertEqual([card["id"]], [c["id"] for c in by_group["cards"]])
        self.assertEqual([card["id"]], [c["id"] for c in by_collection["cards"]])

    def test_leitner_review_never_touches_existing_study_tables_or_counters(self) -> None:
        _collection_id, group_id = self.create_collection_and_group()
        card = self.create_card(group_id, "読む")
        self.request_json(f"/api/leitner/study?group_id={group_id}")

        self.request_json(
            "/api/leitner/review",
            method="POST",
            body={"card_id": card["id"], "result": "correct"},
            expected=HTTPStatus.CREATED,
        )
        self.request_json(
            "/api/leitner/review",
            method="POST",
            body={"card_id": card["id"], "result": "wrong"},
            expected=HTTPStatus.CREATED,
        )

        [refreshed] = self.group_cards(group_id)
        self.assertEqual(0, refreshed["correct_count"])
        self.assertEqual(0, refreshed["wrong_count"])

        rounds = self.request_json(f"/api/rounds?group_id={group_id}")["rounds"]
        self.assertEqual([], rounds)

        with app.connect() as conn:
            self.assertEqual(0, conn.execute("SELECT COUNT(*) FROM study_rounds").fetchone()[0])
            self.assertEqual(0, conn.execute("SELECT COUNT(*) FROM reviews").fetchone()[0])
            leitner_review_count = conn.execute(
                "SELECT COUNT(*) FROM leitner_reviews WHERE card_id = ?", (card["id"],)
            ).fetchone()[0]
            self.assertEqual(2, leitner_review_count)

        # And the existing study mode still works untouched, independently.
        study = self.request_json(f"/api/study?group_id={group_id}&order=sequence")
        self.assertEqual([card["id"]], [c["id"] for c in study["cards"]])
        saved = self.request_json(
            "/api/rounds",
            method="POST",
            body={
                "group_id": group_id,
                "order_mode": "sequence",
                "results": [{"card_id": card["id"], "result": "correct"}],
            },
            expected=HTTPStatus.CREATED,
        )
        self.assertEqual(1, saved["round"]["total_cards"])
        [after_official_round] = self.group_cards(group_id)
        self.assertEqual(1, after_official_round["correct_count"])
        self.assertEqual(0, after_official_round["wrong_count"])

    def test_status_endpoint_groups_cards_by_box_with_due_dates(self) -> None:
        _collection_id, group_id = self.create_collection_and_group()
        box1_card = self.create_card(group_id, "走る")
        box2_card = self.create_card(group_id, "泳ぐ")
        self.request_json(f"/api/leitner/study?group_id={group_id}")

        review = self.request_json(
            "/api/leitner/review",
            method="POST",
            body={"card_id": box2_card["id"], "result": "correct"},
            expected=HTTPStatus.CREATED,
        )

        status = self.request_json(f"/api/leitner/status?group_id={group_id}")
        boxes = status["boxes"]
        self.assertEqual(1, boxes["1"]["count"])
        self.assertEqual([box1_card["id"]], [c["id"] for c in boxes["1"]["cards"]])
        self.assertEqual(1, boxes["2"]["count"])
        self.assertEqual([box2_card["id"]], [c["id"] for c in boxes["2"]["cards"]])
        self.assertEqual(review["due_at"], boxes["2"]["cards"][0]["due_at"])
        self.assertGreater(boxes["2"]["cards"][0]["days_until_due"], 0)
        self.assertEqual(0, boxes["3"]["count"])

        by_collection = self.request_json(
            f"/api/leitner/status?collection_id={_collection_id}&group_ids={group_id}"
        )
        self.assertEqual(status["boxes"], by_collection["boxes"])

    def test_review_rejects_unknown_result_and_card(self) -> None:
        _collection_id, group_id = self.create_collection_and_group()
        card = self.create_card(group_id, "泳ぐ")
        self.request_json(
            "/api/leitner/review",
            method="POST",
            body={"card_id": card["id"], "result": "maybe"},
            expected=HTTPStatus.BAD_REQUEST,
        )
        self.request_json(
            "/api/leitner/review",
            method="POST",
            body={"card_id": 999999, "result": "correct"},
            expected=HTTPStatus.NOT_FOUND,
        )


if __name__ == "__main__":
    unittest.main()
