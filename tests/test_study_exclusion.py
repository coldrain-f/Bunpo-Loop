from __future__ import annotations

import json
import gc
import os
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http import HTTPStatus
from http.server import ThreadingHTTPServer
from pathlib import Path

import app


class QuietHandler(app.AppHandler):
    def log_message(self, format: str, *args: object) -> None:
        return


class StudyExclusionApiTest(unittest.TestCase):
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

    def request_text(self, path: str, *, expected: int = HTTPStatus.OK) -> str:
        request = urllib.request.Request(
            f"{self.base_url}{path}",
            headers={"Accept": "text/csv", **self.auth_headers()},
            method="GET",
        )
        with urllib.request.urlopen(request, timeout=5) as response:
            text = response.read().decode("utf-8-sig")
            self.assertEqual(expected, response.status, text)
            return text

    def create_collection_and_group(self, group_name: str = "부사 02") -> tuple[int, int]:
        collection = self.request_json(
            "/api/collections",
            method="POST",
            body={"name": f"해커스 JLPT N1 문법 {group_name}", "description": ""},
            expected=HTTPStatus.CREATED,
        )["collection"]
        group = self.request_json(
            "/api/groups",
            method="POST",
            body={"collection_id": collection["id"], "name": group_name, "description": ""},
            expected=HTTPStatus.CREATED,
        )["group"]
        return int(collection["id"]), int(group["id"])

    def create_card(self, group_id: int, front: str, *, excluded: bool = False) -> dict:
        return self.request_json(
            "/api/cards",
            method="POST",
            body={
                "group_id": group_id,
                "front": front,
                "back": f"{front} 뜻",
                "memo": "",
                "study_excluded": excluded,
            },
            expected=HTTPStatus.CREATED,
        )["card"]

    def group_cards(self, group_id: int) -> list[dict]:
        return self.request_json(f"/api/cards?group_id={group_id}")["cards"]

    def test_study_uses_only_non_excluded_cards_and_reincludes_later(self) -> None:
        _collection_id, group_id = self.create_collection_and_group()
        first = self.create_card(group_id, "첫 카드")
        excluded = self.create_card(group_id, "제외 카드", excluded=True)
        third = self.create_card(group_id, "셋째 카드")

        study = self.request_json(f"/api/study?group_id={group_id}&order=sequence")
        self.assertEqual([first["id"], third["id"]], [card["id"] for card in study["cards"]])

        saved = self.request_json(
            "/api/rounds",
            method="POST",
            body={
                "group_id": group_id,
                "order_mode": "sequence",
                "results": [
                    {"card_id": first["id"], "result": "correct"},
                    {"card_id": third["id"], "result": "wrong"},
                ],
            },
            expected=HTTPStatus.CREATED,
        )
        self.assertEqual(2, saved["round"]["total_cards"])

        cards_by_id = {card["id"]: card for card in self.group_cards(group_id)}
        self.assertEqual(0, cards_by_id[excluded["id"]]["correct_count"])
        self.assertEqual(0, cards_by_id[excluded["id"]]["wrong_count"])
        self.assertEqual(1, cards_by_id[third["id"]]["wrong_count"])

        self.request_json(f"/api/cards/{excluded['id']}", method="PATCH", body={"study_excluded": False})
        study_after_include = self.request_json(f"/api/study?group_id={group_id}&order=sequence")
        self.assertEqual(
            [first["id"], excluded["id"], third["id"]],
            [card["id"] for card in study_after_include["cards"]],
        )

    def test_all_excluded_group_is_blocked_and_cannot_be_saved(self) -> None:
        _collection_id, group_id = self.create_collection_and_group("전체 제외")
        card = self.create_card(group_id, "기록 보존 카드")
        self.request_json(
            "/api/rounds",
            method="POST",
            body={
                "group_id": group_id,
                "order_mode": "sequence",
                "results": [{"card_id": card["id"], "result": "wrong"}],
            },
            expected=HTTPStatus.CREATED,
        )
        self.request_json(f"/api/cards/{card['id']}", method="PATCH", body={"study_excluded": True})

        blocked = self.request_json(f"/api/study?group_id={group_id}&order=sequence", expected=HTTPStatus.BAD_REQUEST)
        self.assertIn("학습 대상 카드가 없습니다", blocked["error"])

        rejected = self.request_json(
            "/api/rounds",
            method="POST",
            body={
                "group_id": group_id,
                "order_mode": "sequence",
                "results": [{"card_id": card["id"], "result": "correct"}],
            },
            expected=HTTPStatus.BAD_REQUEST,
        )
        self.assertIn("학습에서 제외된 카드", rejected["error"])

        [updated] = self.group_cards(group_id)
        self.assertEqual(1, updated["study_excluded"])
        self.assertEqual(0, updated["correct_count"])
        self.assertEqual(1, updated["wrong_count"])
        rounds = self.request_json(f"/api/rounds?group_id={group_id}")["rounds"]
        self.assertEqual(1, len(rounds))

    def test_delete_group_cards_keeps_group_and_clears_history(self) -> None:
        _collection_id, group_id = self.create_collection_and_group("전체 삭제")
        first = self.create_card(group_id, "삭제 대상 1")
        second = self.create_card(group_id, "삭제 대상 2")
        _other_collection_id, other_group_id = self.create_collection_and_group("보존 그룹")
        other = self.create_card(other_group_id, "보존 카드")

        self.request_json(
            "/api/rounds",
            method="POST",
            body={
                "group_id": group_id,
                "order_mode": "sequence",
                "results": [
                    {"card_id": first["id"], "result": "correct"},
                    {"card_id": second["id"], "result": "wrong"},
                ],
            },
            expected=HTTPStatus.CREATED,
        )

        deleted = self.request_json(f"/api/groups/{group_id}/cards", method="DELETE")
        self.assertEqual(2, deleted["cards_deleted"])
        self.assertEqual(1, deleted["rounds_deleted"])
        self.assertEqual([], self.group_cards(group_id))
        self.assertEqual([other["id"]], [card["id"] for card in self.group_cards(other_group_id)])
        groups = self.request_json("/api/groups")["groups"]
        target = next(group for group in groups if int(group["id"]) == group_id)
        self.assertEqual(0, target["card_count"])
        self.assertEqual([], self.request_json(f"/api/rounds?group_id={group_id}")["rounds"])

    def test_csv_and_backup_restore_preserve_exclusion(self) -> None:
        _collection_id, source_group_id = self.create_collection_and_group("CSV 원본")
        source_card = self.create_card(source_group_id, "CSV 제외", excluded=True)
        expected_settings = self.request_json(
            "/api/settings",
            method="PATCH",
            body={
                "target_name": "JLPT N1",
                "jlpt_exam_date": "2026-12-06",
                "weak_card_threshold": 12,
                "weak_recent_rounds": 4,
                "weak_recent_wrong_threshold": 3,
                "controller_a_action": "wrong",
                "controller_b_action": "primary",
                "controller_x_action": "disabled",
                "controller_y_action": "wrong",
            },
        )["settings"]
        csv_text = self.request_text(f"/api/groups/{source_group_id}/cards.csv")
        self.assertIn("학습제외", csv_text)
        self.assertIn("예", csv_text)

        _other_collection_id, target_group_id = self.create_collection_and_group("CSV 대상")
        imported = self.request_json(
            f"/api/groups/{target_group_id}/cards.csv",
            method="POST",
            body={"csv": csv_text},
            expected=HTTPStatus.CREATED,
        )
        self.assertEqual(1, imported["created_count"])
        [imported_card] = self.group_cards(target_group_id)
        self.assertEqual(1, imported_card["study_excluded"])

        backup = self.request_json("/api/backup")["backup"]
        backup_matches = [card for card in backup["cards"] if card["front"] == source_card["front"]]
        self.assertEqual(2, len(backup_matches))
        self.assertTrue(all(card["study_excluded"] == 1 for card in backup_matches))
        self.assertEqual(expected_settings, backup["settings"])
        self.request_json("/api/settings", method="PATCH", body={"target_name": "임시 목표"})
        self.request_json("/api/backup", method="POST", body=backup)

        restored_matches = [
            card for card in self.request_json("/api/cards")["cards"] if card["front"] == source_card["front"]
        ]
        self.assertEqual(2, len(restored_matches))
        self.assertTrue(all(card["study_excluded"] == 1 for card in restored_matches))
        self.assertEqual(expected_settings, self.request_json("/api/settings")["settings"])


class DefaultSeedTest(unittest.TestCase):
    def setUp(self) -> None:
        tmp_root = Path(os.environ.get("BUNPO_LOOP_TEST_TMP") or tempfile.gettempdir()) / "bunpo-loop-tests"
        tmp_root.mkdir(parents=True, exist_ok=True)
        self.tmp = tempfile.TemporaryDirectory(dir=tmp_root)
        self.old_db_path = app.DB_PATH
        self.old_data_dir = app.DATA_DIR
        self.old_app_user = app.APP_USER
        self.old_app_password = app.APP_PASSWORD
        self.old_default_seed_data_dir = app.DEFAULT_SEED_DATA_DIR
        self.old_seed_enabled = os.environ.get("BUNPO_LOOP_SEED_DEFAULT_DATA")
        app.DATA_DIR = Path(self.tmp.name)
        app.DB_PATH = app.DATA_DIR / "test.sqlite3"
        app.APP_USER = None
        app.APP_PASSWORD = None
        app.DEFAULT_SEED_DATA_DIR = app.ROOT / "default-data" / "jlpt-improved-reviewed"
        os.environ["BUNPO_LOOP_SEED_DEFAULT_DATA"] = "1"

    def tearDown(self) -> None:
        gc.collect()
        app.DB_PATH = self.old_db_path
        app.DATA_DIR = self.old_data_dir
        app.APP_USER = self.old_app_user
        app.APP_PASSWORD = self.old_app_password
        app.DEFAULT_SEED_DATA_DIR = self.old_default_seed_data_dir
        if self.old_seed_enabled is None:
            os.environ.pop("BUNPO_LOOP_SEED_DEFAULT_DATA", None)
        else:
            os.environ["BUNPO_LOOP_SEED_DEFAULT_DATA"] = self.old_seed_enabled
        self.tmp.cleanup()

    def test_fresh_database_seeds_bundled_jlpt_decks_once(self) -> None:
        app.init_db()

        with app.connect() as conn:
            user = conn.execute("SELECT id FROM users WHERE nickname = ?", ("상운",)).fetchone()
            self.assertIsNotNone(user)
            user_id = int(user["id"])
            counts = app.user_learning_counts(conn, user_id)
            self.assertEqual(2, counts["collections"])
            self.assertEqual(28, counts["groups"])
            self.assertEqual(529, counts["cards"])
            self.assertEqual(
                "seeded:28:groups:529:cards",
                app.get_app_metadata(conn, app.DEFAULT_SEED_META_KEY),
            )
            first_group = conn.execute(
                """
                SELECT g.name
                FROM groups g
                JOIN collections c ON c.id = g.collection_id
                WHERE c.user_id = ?
                ORDER BY g.id ASC
                LIMIT 1
                """,
                (user_id,),
            ).fetchone()
            self.assertEqual("N3-N2-문형-01", first_group["name"])
            seeded_card = conn.execute(
                """
                SELECT c.back, ex.japanese, ex.korean
                FROM cards c
                JOIN examples ex ON ex.card_id = c.id
                JOIN groups g ON g.id = c.group_id
                JOIN collections col ON col.id = g.collection_id
                WHERE col.user_id = ?
                  AND c.front = ?
                ORDER BY ex.sort_order ASC
                LIMIT 1
                """,
                (user_id, "~一方だ"),
            ).fetchone()
            self.assertIsNotNone(seeded_card)
            self.assertEqual("계속 ~해지다", seeded_card["back"])
            self.assertEqual("毎年客が増える[[一方だ]]", seeded_card["japanese"])

        app.init_db()

        with app.connect() as conn:
            user = conn.execute("SELECT id FROM users WHERE nickname = ?", ("상운",)).fetchone()
            counts = app.user_learning_counts(conn, int(user["id"]))
            self.assertEqual(2, counts["collections"])
            self.assertEqual(28, counts["groups"])
            self.assertEqual(529, counts["cards"])


if __name__ == "__main__":
    unittest.main()
