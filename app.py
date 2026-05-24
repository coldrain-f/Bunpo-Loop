from __future__ import annotations

import base64
import hmac
import json
import mimetypes
import os
import random
import sqlite3
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse


ROOT = Path(__file__).resolve().parent
STATIC_DIR = ROOT / "static"
DATA_DIR = ROOT / "data"
DB_ENV = os.environ.get("BYEORAKCHIGI_DB") or os.environ.get("BUNPO_LOOP_DB") or os.environ.get("JLPT_DB")
DB_PATH = Path(DB_ENV or DATA_DIR / "jlpt_cards.sqlite3")
APP_USER = os.environ.get("APP_USER")
APP_PASSWORD = os.environ.get("APP_PASSWORD")
DEFAULT_WEAK_CARD_THRESHOLD = 16
DEFAULT_WEAK_RECENT_ROUNDS = 3
DEFAULT_WEAK_RECENT_WRONG_THRESHOLD = 8
BACKUP_VERSION = 2

USER_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL UNIQUE,
    access_code TEXT NOT NULL,
    target_name TEXT NOT NULL DEFAULT '',
    jlpt_exam_date TEXT NOT NULL DEFAULT '',
    weak_card_threshold INTEGER NOT NULL DEFAULT 16,
    weak_recent_rounds INTEGER NOT NULL DEFAULT 3,
    weak_recent_wrong_threshold INTEGER NOT NULL DEFAULT 8,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""

LEARNING_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (collection_id, name)
);

CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    memo TEXT NOT NULL DEFAULT '',
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS examples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    japanese TEXT NOT NULL,
    korean TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS study_rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
    scope_type TEXT NOT NULL DEFAULT 'group' CHECK (scope_type IN ('group', 'collection')),
    round_no INTEGER NOT NULL,
    order_mode TEXT NOT NULL,
    total_cards INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    wrong_count INTEGER NOT NULL,
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS study_round_groups (
    round_id INTEGER NOT NULL REFERENCES study_rounds(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    PRIMARY KEY (round_id, group_id)
);

CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    round_id INTEGER NOT NULL REFERENCES study_rounds(id) ON DELETE CASCADE,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    result TEXT NOT NULL CHECK (result IN ('correct', 'wrong')),
    reviewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_groups_collection_id ON groups(collection_id);
CREATE INDEX IF NOT EXISTS idx_cards_group_id ON cards(group_id);
CREATE INDEX IF NOT EXISTS idx_examples_card_id ON examples(card_id);
CREATE INDEX IF NOT EXISTS idx_rounds_collection_id ON study_rounds(collection_id);
CREATE INDEX IF NOT EXISTS idx_rounds_group_id ON study_rounds(group_id);
CREATE INDEX IF NOT EXISTS idx_round_groups_group_id ON study_round_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_reviews_round_id ON reviews(round_id);
"""


def utc_now_sql() -> str:
    return "datetime('now')"


def connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = TRUNCATE")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.executescript(USER_SCHEMA_SQL)
        if learning_schema_needs_reset(conn):
            reset_learning_schema(conn)
        else:
            conn.executescript(LEARNING_SCHEMA_SQL)
        migrate_db(conn)
        count = conn.execute("SELECT COUNT(*) FROM collections").fetchone()[0]
        if count == 0:
            seed_data(conn)


def migrate_db(conn: sqlite3.Connection) -> None:
    round_columns = {
        row["name"]
        for row in conn.execute("PRAGMA table_info(study_rounds)").fetchall()
    }
    if "started_at" not in round_columns:
        conn.execute("ALTER TABLE study_rounds ADD COLUMN started_at TEXT")
        conn.execute("UPDATE study_rounds SET started_at = completed_at WHERE started_at IS NULL")
    if "duration_seconds" not in round_columns:
        conn.execute(
            "ALTER TABLE study_rounds ADD COLUMN duration_seconds INTEGER NOT NULL DEFAULT 0"
        )
    user_columns = {
        row["name"]
        for row in conn.execute("PRAGMA table_info(users)").fetchall()
    }
    if "jlpt_exam_date" not in user_columns:
        conn.execute("ALTER TABLE users ADD COLUMN jlpt_exam_date TEXT NOT NULL DEFAULT ''")
    if "target_name" not in user_columns:
        conn.execute("ALTER TABLE users ADD COLUMN target_name TEXT NOT NULL DEFAULT ''")
    if "weak_card_threshold" not in user_columns:
        conn.execute(
            "ALTER TABLE users ADD COLUMN weak_card_threshold INTEGER NOT NULL DEFAULT 16"
        )
    if "weak_recent_rounds" not in user_columns:
        conn.execute(
            "ALTER TABLE users ADD COLUMN weak_recent_rounds INTEGER NOT NULL DEFAULT 3"
        )
    if "weak_recent_wrong_threshold" not in user_columns:
        conn.execute(
            "ALTER TABLE users ADD COLUMN weak_recent_wrong_threshold INTEGER NOT NULL DEFAULT 8"
        )
    conn.execute(
        """
        UPDATE users
        SET weak_card_threshold = ?,
            weak_recent_rounds = ?,
            weak_recent_wrong_threshold = ?
        WHERE weak_recent_rounds = 3
          AND weak_recent_wrong_threshold = 2
          AND weak_card_threshold IN (5, 8)
        """,
        (
            DEFAULT_WEAK_CARD_THRESHOLD,
            DEFAULT_WEAK_RECENT_ROUNDS,
            DEFAULT_WEAK_RECENT_WRONG_THRESHOLD,
        ),
    )
    conn.execute(
        """
        UPDATE collections
        SET name = ?
        WHERE name IN (?, ?)
          AND description = ?
        """,
        (
            "영어 단어 꼬꼬회독",
            "영어 단어 벼락회독",
            "영어 단어 벼락치기",
            "단어와 예문을 빠르게 반복합니다.",
        ),
    )


def table_columns(conn: sqlite3.Connection, table: str) -> set[str]:
    return {row["name"] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}


def table_exists(conn: sqlite3.Connection, table: str) -> bool:
    return (
        conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
            (table,),
        ).fetchone()
        is not None
    )


def learning_schema_needs_reset(conn: sqlite3.Connection) -> bool:
    if not table_exists(conn, "collections"):
        return True
    if "collection_id" not in table_columns(conn, "groups"):
        return True
    if "scope_type" not in table_columns(conn, "study_rounds"):
        return True
    if not table_exists(conn, "study_round_groups"):
        return True
    return False


def reset_learning_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        DROP TABLE IF EXISTS reviews;
        DROP TABLE IF EXISTS study_round_groups;
        DROP TABLE IF EXISTS study_rounds;
        DROP TABLE IF EXISTS examples;
        DROP TABLE IF EXISTS cards;
        DROP TABLE IF EXISTS groups;
        DROP TABLE IF EXISTS collections;
        """
    )
    conn.executescript(LEARNING_SCHEMA_SQL)


def seed_data(conn: sqlite3.Connection) -> None:
    collections = [
        ("일본어 시험 표현", "문법과 표현을 소그룹으로 나누어 회독합니다."),
        ("영어 단어 꼬꼬회독", "단어와 예문을 빠르게 반복합니다."),
    ]
    collection_ids: dict[str, int] = {}
    for name, description in collections:
        cur = conn.execute(
            "INSERT INTO collections (name, description) VALUES (?, ?)",
            (name, description),
        )
        collection_ids[name] = int(cur.lastrowid)

    groups = [
        ("일본어 시험 표현", "문법 표현", "문장 끝과 연결 표현"),
        ("일본어 시험 표현", "부사 표현", "문장 흐름을 잡는 표현"),
        ("영어 단어 꼬꼬회독", "동사구", "시험과 회화에 자주 나오는 표현"),
    ]
    group_ids: dict[str, int] = {}
    for collection_name, name, description in groups:
        cur = conn.execute(
            "INSERT INTO groups (collection_id, name, description) VALUES (?, ?, ?)",
            (collection_ids[collection_name], name, description),
        )
        group_ids[name] = int(cur.lastrowid)

    cards = [
        (
            "문법 표현",
            "〜あまり",
            "~한 나머지",
            [
                ("緊張のあまり、声が震えた。", "긴장한 나머지 목소리가 떨렸다."),
                ("考えすぎたあまり、眠れなかった。", "너무 생각한 나머지 잠을 잘 수 없었다."),
            ],
        ),
        (
            "문법 표현",
            "〜に至っては",
            "~에 이르러서는",
            [
                ("弟に至っては、まだ準備もしていない。", "동생에 이르러서는 아직 준비도 하지 않았다."),
                ("この問題に至っては、説明するのも難しい。", "이 문제에 이르러서는 설명하기도 어렵다."),
            ],
        ),
        (
            "문법 표현",
            "〜をもって",
            "~로써 / ~을 기해",
            [
                ("本日をもって受付を終了します。", "오늘을 기해 접수를 종료합니다."),
                ("努力をもって困難を乗り越えた。", "노력으로써 어려움을 극복했다."),
            ],
        ),
        (
            "부사 표현",
            "いかにも",
            "정말로 / 참으로",
            [
                ("いかにも彼らしい答えだ。", "정말 그다운 대답이다."),
                ("いかにも高そうな時計をしている。", "참으로 비싸 보이는 시계를 차고 있다."),
            ],
        ),
        (
            "동사구",
            "carry out",
            "수행하다 / 실행하다",
            [
                ("We need to carry out the plan by Friday.", "금요일까지 그 계획을 실행해야 한다."),
                ("The team carried out a quick review.", "팀은 빠른 검토를 수행했다."),
            ],
        ),
    ]

    for group_name, front, back, examples in cards:
        cur = conn.execute(
            "INSERT INTO cards (group_id, front, back) VALUES (?, ?, ?)",
            (group_ids[group_name], front, back),
        )
        card_id = int(cur.lastrowid)
        insert_examples(conn, card_id, examples)


def row_to_dict(row: sqlite3.Row) -> dict:
    return {key: row[key] for key in row.keys()}


def insert_examples(
    conn: sqlite3.Connection,
    card_id: int,
    examples: list[dict] | list[tuple[str, str]],
) -> None:
    clean_examples = []
    for idx, item in enumerate(examples):
        if isinstance(item, dict):
            japanese = str(item.get("japanese", "")).strip()
            korean = str(item.get("korean", "")).strip()
        else:
            japanese = str(item[0]).strip()
            korean = str(item[1]).strip()
        if japanese:
            clean_examples.append((card_id, japanese, korean, idx))

    conn.executemany(
        """
        INSERT INTO examples (card_id, japanese, korean, sort_order)
        VALUES (?, ?, ?, ?)
        """,
        clean_examples,
    )


def get_examples(conn: sqlite3.Connection, card_ids: list[int]) -> dict[int, list[dict]]:
    if not card_ids:
        return {}
    placeholders = ",".join("?" for _ in card_ids)
    rows = conn.execute(
        f"""
        SELECT id, card_id, japanese, korean, sort_order
        FROM examples
        WHERE card_id IN ({placeholders})
        ORDER BY sort_order ASC, id ASC
        """,
        card_ids,
    ).fetchall()
    grouped: dict[int, list[dict]] = {card_id: [] for card_id in card_ids}
    for row in rows:
        grouped[int(row["card_id"])].append(row_to_dict(row))
    return grouped


def parse_body(handler: BaseHTTPRequestHandler) -> dict:
    length = int(handler.headers.get("content-length") or 0)
    if length == 0:
        return {}
    raw = handler.rfile.read(length)
    try:
        body = json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError("JSON 형식이 올바르지 않습니다.") from exc
    if not isinstance(body, dict):
        raise ValueError("요청 본문은 JSON 객체여야 합니다.")
    return body


def validate_text(value: object, field: str, max_len: int = 500) -> str:
    text = str(value or "").strip()
    if not text:
        raise ValueError(f"{field} 값을 입력하세요.")
    if len(text) > max_len:
        raise ValueError(f"{field} 값이 너무 깁니다.")
    return text


def validate_optional_text(value: object, field: str, max_len: int = 500) -> str:
    text = str(value or "").strip()
    if len(text) > max_len:
        raise ValueError(f"{field} 값이 너무 깁니다.")
    return text


def validate_nickname(value: object) -> str:
    text = validate_text(value, "닉네임", 40)
    if any(char in text for char in "\r\n\t"):
        raise ValueError("닉네임에 사용할 수 없는 문자가 있습니다.")
    return text


def validate_access_code(value: object) -> str:
    text = str(value or "").strip()
    if len(text) != 6 or not text.isdigit():
        raise ValueError("숫자 6자리를 입력하세요.")
    return text


def validate_exam_date(value: object) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    try:
        datetime.strptime(text, "%Y-%m-%d")
    except ValueError as exc:
        raise ValueError("목표일은 YYYY-MM-DD 형식이어야 합니다.") from exc
    return text


def validate_weak_card_threshold(value: object) -> int:
    try:
        threshold = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError("약점 카드 기준은 숫자로 입력하세요.") from exc
    if threshold < 1 or threshold > 20:
        raise ValueError("약점 카드 기준은 1~20회 사이로 입력하세요.")
    return threshold


def validate_weak_recent_rounds(value: object) -> int:
    try:
        rounds = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError("최근 회독 범위는 숫자로 입력하세요.") from exc
    if rounds < 1 or rounds > 20:
        raise ValueError("최근 회독 범위는 1~20회 사이로 입력하세요.")
    return rounds


def validate_weak_recent_wrong_threshold(value: object) -> int:
    try:
        threshold = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError("최근 오답 기준은 숫자로 입력하세요.") from exc
    if threshold < 1 or threshold > 20:
        raise ValueError("최근 오답 기준은 1~20회 사이로 입력하세요.")
    return threshold


def secure_text_compare(left: str, right: str) -> bool:
    return hmac.compare_digest(left.encode("utf-8"), right.encode("utf-8"))


def normalize_timestamp(value: object) -> str:
    text = str(value or "").strip()
    if not text:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    if len(text) > 40:
        raise ValueError("시작 시간이 올바르지 않습니다.")
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("시작 시간이 올바르지 않습니다.") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def normalize_duration(value: object) -> int:
    try:
        seconds = int(value or 0)
    except (TypeError, ValueError) as exc:
        raise ValueError("학습 시간이 올바르지 않습니다.") from exc
    if seconds < 0 or seconds > 60 * 60 * 24:
        raise ValueError("학습 시간이 올바르지 않습니다.")
    return seconds


def normalize_round_limit(value: object, default: int = 200) -> int:
    try:
        limit = int(value or default)
    except (TypeError, ValueError):
        return default
    return min(500, max(1, limit))


def get_collection(conn: sqlite3.Connection, collection_id: int) -> sqlite3.Row | None:
    return conn.execute("SELECT * FROM collections WHERE id = ?", (collection_id,)).fetchone()


def get_group(conn: sqlite3.Connection, group_id: int) -> sqlite3.Row | None:
    return conn.execute("SELECT * FROM groups WHERE id = ?", (group_id,)).fetchone()


def get_card(conn: sqlite3.Connection, card_id: int) -> sqlite3.Row | None:
    return conn.execute("SELECT * FROM cards WHERE id = ?", (card_id,)).fetchone()


def duplicate_card_exists(
    conn: sqlite3.Connection,
    group_id: int,
    front: str,
    exclude_card_id: int | None = None,
) -> bool:
    params: list[object] = [group_id, front.strip()]
    sql = "SELECT 1 FROM cards WHERE group_id = ? AND front = ?"
    if exclude_card_id is not None:
        sql += " AND id <> ?"
        params.append(exclude_card_id)
    return conn.execute(sql, params).fetchone() is not None


def collections_payload(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        """
        WITH group_stats AS (
            SELECT
                collection_id,
                COUNT(*) AS group_count
            FROM groups
            GROUP BY collection_id
        ),
        card_stats AS (
            SELECT
                g.collection_id,
                COUNT(c.id) AS card_count,
                COALESCE(SUM(c.correct_count), 0) AS correct_total,
                COALESCE(SUM(c.wrong_count), 0) AS wrong_total
            FROM groups g
            LEFT JOIN cards c ON c.group_id = g.id
            GROUP BY g.collection_id
        ),
        round_collection_links AS (
            SELECT DISTINCT
                g.collection_id,
                sr.id AS round_id
            FROM study_rounds sr
            JOIN study_round_groups rg ON rg.round_id = sr.id
            JOIN groups g ON g.id = rg.group_id
        ),
        round_stats AS (
            SELECT
                collection_id,
                COUNT(DISTINCT round_id) AS completed_rounds
            FROM round_collection_links
            GROUP BY collection_id
        ),
        latest_rounds AS (
            SELECT *
            FROM (
                SELECT
                    sr.*,
                    rcl.collection_id AS stat_collection_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY rcl.collection_id
                        ORDER BY sr.completed_at DESC, sr.id DESC
                    ) AS row_no
                FROM study_rounds sr
                JOIN round_collection_links rcl ON rcl.round_id = sr.id
            )
            WHERE row_no = 1
        ),
        first_attempts AS (
            SELECT
                first_reviews.round_id,
                COUNT(*) AS first_attempt_total,
                SUM(CASE WHEN first_reviews.result = 'correct' THEN 1 ELSE 0 END) AS first_attempt_correct_count
            FROM reviews first_reviews
            JOIN (
                SELECT round_id, card_id, MIN(id) AS first_review_id
                FROM reviews
                GROUP BY round_id, card_id
            ) first_ids ON first_ids.first_review_id = first_reviews.id
            GROUP BY first_reviews.round_id
        )
        SELECT
            c.id,
            c.name,
            c.description,
            c.created_at,
            COALESCE(gs.group_count, 0) AS group_count,
            COALESCE(cs.card_count, 0) AS card_count,
            COALESCE(cs.correct_total, 0) AS correct_total,
            COALESCE(cs.wrong_total, 0) AS wrong_total,
            COALESCE(rs.completed_rounds, 0) AS completed_rounds,
            lr.completed_at AS last_studied_at,
            lr.round_no AS latest_round_no,
            lr.total_cards AS latest_total_cards,
            lr.correct_count AS latest_correct_count,
            lr.wrong_count AS latest_wrong_count,
            COALESCE(fa.first_attempt_total, lr.total_cards) AS latest_first_attempt_total,
            COALESCE(fa.first_attempt_correct_count, lr.correct_count) AS latest_first_attempt_correct_count
        FROM collections c
        LEFT JOIN group_stats gs ON gs.collection_id = c.id
        LEFT JOIN card_stats cs ON cs.collection_id = c.id
        LEFT JOIN round_stats rs ON rs.collection_id = c.id
        LEFT JOIN latest_rounds lr ON lr.stat_collection_id = c.id
        LEFT JOIN first_attempts fa ON fa.round_id = lr.id
        ORDER BY c.created_at ASC, c.id ASC
        """
    ).fetchall()
    return [row_to_dict(row) for row in rows]


def groups_payload(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        """
        WITH card_stats AS (
            SELECT
                group_id,
                COUNT(id) AS card_count,
                COALESCE(SUM(correct_count), 0) AS correct_total,
                COALESCE(SUM(wrong_count), 0) AS wrong_total
            FROM cards
            GROUP BY group_id
        ),
        round_stats AS (
            SELECT
                rg.group_id,
                COUNT(DISTINCT rg.round_id) AS completed_rounds
            FROM study_round_groups rg
            GROUP BY rg.group_id
        ),
        latest_rounds AS (
            SELECT *
            FROM (
                SELECT
                    sr.*,
                    rg.group_id AS stat_group_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY rg.group_id
                        ORDER BY sr.completed_at DESC, sr.id DESC
                    ) AS row_no
                FROM study_rounds sr
                JOIN study_round_groups rg ON rg.round_id = sr.id
            )
            WHERE row_no = 1
        ),
        first_attempts AS (
            SELECT
                first_reviews.round_id,
                COUNT(*) AS first_attempt_total,
                SUM(CASE WHEN first_reviews.result = 'correct' THEN 1 ELSE 0 END) AS first_attempt_correct_count
            FROM reviews first_reviews
            JOIN (
                SELECT round_id, card_id, MIN(id) AS first_review_id
                FROM reviews
                GROUP BY round_id, card_id
            ) first_ids ON first_ids.first_review_id = first_reviews.id
            GROUP BY first_reviews.round_id
        )
        SELECT
            g.id,
            g.collection_id,
            g.name,
            g.description,
            g.created_at,
            c.name AS collection_name,
            COALESCE(cs.card_count, 0) AS card_count,
            COALESCE(cs.correct_total, 0) AS correct_total,
            COALESCE(cs.wrong_total, 0) AS wrong_total,
            COALESCE(rs.completed_rounds, 0) AS completed_rounds,
            lr.completed_at AS last_studied_at,
            lr.round_no AS latest_round_no,
            lr.total_cards AS latest_total_cards,
            lr.correct_count AS latest_correct_count,
            lr.wrong_count AS latest_wrong_count,
            COALESCE(fa.first_attempt_total, lr.total_cards) AS latest_first_attempt_total,
            COALESCE(fa.first_attempt_correct_count, lr.correct_count) AS latest_first_attempt_correct_count
        FROM groups g
        JOIN collections c ON c.id = g.collection_id
        LEFT JOIN card_stats cs ON cs.group_id = g.id
        LEFT JOIN round_stats rs ON rs.group_id = g.id
        LEFT JOIN latest_rounds lr ON lr.stat_group_id = g.id
        LEFT JOIN first_attempts fa ON fa.round_id = lr.id
        ORDER BY c.created_at ASC, c.id ASC, g.created_at ASC, g.id ASC
        """
    ).fetchall()
    return [row_to_dict(row) for row in rows]


def cards_payload(
    conn: sqlite3.Connection,
    group_id: int | None = None,
    group_ids: list[int] | None = None,
    query: str | None = None,
    order_mode: str = "created",
    recent_round_window: int = DEFAULT_WEAK_RECENT_ROUNDS,
) -> list[dict]:
    clauses: list[str] = []
    params: list[object] = []
    if group_ids:
        placeholders = ",".join("?" for _ in group_ids)
        clauses.append(f"c.group_id IN ({placeholders})")
        params.extend(group_ids)
    elif group_id:
        clauses.append("c.group_id = ?")
        params.append(group_id)
    if query:
        clauses.append("(c.front LIKE ? OR c.back LIKE ?)")
        like = f"%{query}%"
        params.extend([like, like])
    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""

    order_sql = "c.created_at DESC, c.id DESC"
    if order_mode == "sequence":
        order_sql = "c.id ASC"
    elif order_mode == "wrong":
        order_sql = """
            c.wrong_count DESC,
            CASE
                WHEN c.correct_count + c.wrong_count = 0 THEN 0
                ELSE CAST(c.wrong_count AS REAL) / (c.correct_count + c.wrong_count)
            END DESC,
            c.id ASC
        """

    rows = conn.execute(
        f"""
        SELECT
            c.id,
            c.group_id,
            c.front,
            c.back,
            c.memo,
            c.correct_count,
            c.wrong_count,
            COALESCE((
                SELECT COUNT(*)
                FROM reviews rv
                WHERE rv.card_id = c.id
                  AND rv.result = 'wrong'
            ), 0) AS round_wrong_count,
            COALESCE((
                SELECT COUNT(*)
                FROM reviews recent_rv
                JOIN study_rounds recent_sr ON recent_sr.id = recent_rv.round_id
                JOIN study_round_groups recent_rg
                  ON recent_rg.round_id = recent_sr.id
                 AND recent_rg.group_id = c.group_id
                WHERE recent_rv.card_id = c.id
                  AND recent_rv.result = 'wrong'
                  AND recent_sr.id IN (
                      SELECT sr2.id
                      FROM study_rounds sr2
                      JOIN study_round_groups rg2 ON rg2.round_id = sr2.id
                      WHERE rg2.group_id = c.group_id
                      ORDER BY sr2.completed_at DESC, sr2.id DESC
                      LIMIT ?
                  )
            ), 0) AS recent_wrong_count,
            c.created_at,
            c.updated_at,
            g.name AS group_name,
            g.collection_id,
            col.name AS collection_name
        FROM cards c
        JOIN groups g ON g.id = c.group_id
        JOIN collections col ON col.id = g.collection_id
        {where_sql}
        ORDER BY {order_sql}
        """,
        [recent_round_window, *params],
    ).fetchall()
    cards = [row_to_dict(row) for row in rows]
    examples = get_examples(conn, [int(card["id"]) for card in cards])
    for card in cards:
        card["examples"] = examples.get(int(card["id"]), [])
    if order_mode == "random":
        random.shuffle(cards)
    return cards


def table_payload(conn: sqlite3.Connection, table: str, order_by: str) -> list[dict]:
    rows = conn.execute(f"SELECT * FROM {table} ORDER BY {order_by}").fetchall()
    return [row_to_dict(row) for row in rows]


def backup_payload(conn: sqlite3.Connection) -> dict:
    return {
        "version": BACKUP_VERSION,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "collections": table_payload(conn, "collections", "id ASC"),
        "groups": table_payload(conn, "groups", "id ASC"),
        "cards": table_payload(conn, "cards", "id ASC"),
        "examples": table_payload(conn, "examples", "card_id ASC, sort_order ASC, id ASC"),
        "study_rounds": table_payload(conn, "study_rounds", "id ASC"),
        "study_round_groups": table_payload(conn, "study_round_groups", "round_id ASC, group_id ASC"),
        "reviews": table_payload(conn, "reviews", "id ASC"),
    }


def ensure_list(value: object, field: str) -> list:
    if not isinstance(value, list):
        raise ValueError(f"{field} 형식이 올바르지 않습니다.")
    return value


def normalize_backup_payload(payload: dict) -> tuple[dict, int]:
    if not isinstance(payload, dict):
        raise ValueError("백업 JSON 형식이 올바르지 않습니다.")
    backup = payload.get("backup") if isinstance(payload.get("backup"), dict) else payload
    if not isinstance(backup, dict):
        raise ValueError("백업 JSON 형식이 올바르지 않습니다.")
    raw_version = backup.get("version", 1)
    try:
        version = int(raw_version)
    except (TypeError, ValueError):
        raise ValueError("백업 version 값이 올바르지 않습니다.")
    if version < 1:
        raise ValueError("백업 version 값이 올바르지 않습니다.")
    if version > BACKUP_VERSION:
        raise ValueError("현재 앱에서 지원하지 않는 백업 version입니다.")
    return backup, version


def table_count(conn: sqlite3.Connection, table: str) -> int:
    return int(conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0] or 0)


def restore_backup(conn: sqlite3.Connection, payload: dict) -> dict:
    backup, _version = normalize_backup_payload(payload)
    collections = ensure_list(backup.get("collections", []), "대그룹 백업")
    groups = ensure_list(backup.get("groups", []), "소그룹 백업")
    cards = ensure_list(backup.get("cards", []), "카드 백업")
    examples = ensure_list(backup.get("examples", []), "예문 백업")
    rounds = ensure_list(backup.get("study_rounds", []), "회독 백업")
    round_groups = ensure_list(backup.get("study_round_groups", []), "회독 소그룹 백업")
    reviews = ensure_list(backup.get("reviews", []), "복습 백업")
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    conn.execute("DELETE FROM reviews")
    conn.execute("DELETE FROM study_round_groups")
    conn.execute("DELETE FROM study_rounds")
    conn.execute("DELETE FROM examples")
    conn.execute("DELETE FROM cards")
    conn.execute("DELETE FROM groups")
    conn.execute("DELETE FROM collections")

    if not collections and groups:
        collections = [
            {
                "id": 1,
                "name": "기본 대그룹",
                "description": "이전 백업에서 가져온 소그룹입니다.",
                "created_at": now,
            }
        ]

    for collection in collections:
        conn.execute(
            """
            INSERT INTO collections (id, name, description, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                int(collection.get("id") or 0),
                validate_text(collection.get("name"), "대그룹명", 100),
                str(collection.get("description") or "").strip(),
                str(collection.get("created_at") or now),
            ),
        )

    group_collection_ids: dict[int, int] = {}
    default_collection_id = int(collections[0].get("id") or 1) if collections else 0
    for group in groups:
        group_id = int(group.get("id") or 0)
        collection_id = int(group.get("collection_id") or default_collection_id)
        group_collection_ids[group_id] = collection_id
        conn.execute(
            """
            INSERT INTO groups (id, collection_id, name, description, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                group_id,
                collection_id,
                validate_text(group.get("name"), "소그룹명", 100),
                str(group.get("description") or "").strip(),
                str(group.get("created_at") or now),
            ),
        )

    for card in cards:
        conn.execute(
            """
            INSERT INTO cards (
                id,
                group_id,
                front,
                back,
                memo,
                correct_count,
                wrong_count,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                int(card.get("id") or 0),
                int(card.get("group_id") or 0),
                validate_text(card.get("front"), "앞면", 200),
                validate_text(card.get("back"), "뒷면", 500),
                str(card.get("memo") or "").strip(),
                int(card.get("correct_count") or 0),
                int(card.get("wrong_count") or 0),
                str(card.get("created_at") or now),
                str(card.get("updated_at") or now),
            ),
        )

    for example in examples:
        japanese = str(example.get("japanese") or "").strip()
        if not japanese:
            continue
        conn.execute(
            """
            INSERT INTO examples (id, card_id, japanese, korean, sort_order)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                int(example.get("id") or 0),
                int(example.get("card_id") or 0),
                japanese,
                str(example.get("korean") or "").strip(),
                int(example.get("sort_order") or 0),
            ),
        )

    for round_item in rounds:
        order_mode = str(round_item.get("order_mode") or "sequence")
        if order_mode not in ("sequence", "random", "wrong"):
            order_mode = "sequence"
        group_id = int(round_item.get("group_id") or 0) or None
        collection_id = int(round_item.get("collection_id") or 0) or (
            group_collection_ids.get(group_id) if group_id else None
        )
        scope_type = str(round_item.get("scope_type") or ("group" if group_id else "collection"))
        if scope_type not in ("group", "collection"):
            scope_type = "group" if group_id else "collection"
        conn.execute(
            """
            INSERT INTO study_rounds (
                id,
                collection_id,
                group_id,
                scope_type,
                round_no,
                order_mode,
                total_cards,
                correct_count,
                wrong_count,
                started_at,
                duration_seconds,
                completed_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                int(round_item.get("id") or 0),
                collection_id,
                group_id,
                scope_type,
                int(round_item.get("round_no") or 1),
                order_mode,
                int(round_item.get("total_cards") or 0),
                int(round_item.get("correct_count") or 0),
                int(round_item.get("wrong_count") or 0),
                str(round_item.get("started_at") or now),
                int(round_item.get("duration_seconds") or 0),
                str(round_item.get("completed_at") or now),
            ),
        )

    if round_groups:
        for item in round_groups:
            round_id = int(item.get("round_id") or 0)
            group_id = int(item.get("group_id") or 0)
            if round_id and group_id:
                conn.execute(
                    "INSERT OR IGNORE INTO study_round_groups (round_id, group_id) VALUES (?, ?)",
                    (round_id, group_id),
                )
    else:
        for round_item in rounds:
            round_id = int(round_item.get("id") or 0)
            group_id = int(round_item.get("group_id") or 0)
            if round_id and group_id:
                conn.execute(
                    "INSERT OR IGNORE INTO study_round_groups (round_id, group_id) VALUES (?, ?)",
                    (round_id, group_id),
                )

    for review in reviews:
        result = str(review.get("result") or "")
        if result not in ("correct", "wrong"):
            continue
        conn.execute(
            """
            INSERT INTO reviews (id, round_id, card_id, result, reviewed_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                int(review.get("id") or 0),
                int(review.get("round_id") or 0),
                int(review.get("card_id") or 0),
                result,
                str(review.get("reviewed_at") or now),
            ),
        )

    delete_orphan_rounds(conn)
    return {
        "collections": table_count(conn, "collections"),
        "groups": table_count(conn, "groups"),
        "cards": table_count(conn, "cards"),
        "examples": table_count(conn, "examples"),
        "rounds": table_count(conn, "study_rounds"),
        "reviews": table_count(conn, "reviews"),
    }


def parse_example_text(value: str) -> list[tuple[str, str]]:
    examples = []
    for raw_part in value.replace("\n", ";").split(";"):
        part = raw_part.strip()
        if not part:
            continue
        if "=>" in part:
            japanese, korean = part.split("=>", 1)
        elif "::" in part:
            japanese, korean = part.split("::", 1)
        elif "->" in part:
            japanese, korean = part.split("->", 1)
        else:
            japanese, korean = part, ""
        japanese = japanese.strip()
        korean = korean.strip()
        if japanese:
            examples.append((japanese, korean))
    return examples


def parse_bulk_cards(text: object) -> list[dict]:
    raw_text = str(text or "").strip()
    if not raw_text:
        raise ValueError("대량 등록할 카드를 입력하세요.")
    items = []
    for line_no, raw_line in enumerate(raw_text.splitlines(), start=1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        columns = [part.strip() for part in (line.split("\t") if "\t" in line else line.split("|"))]
        if len(columns) < 2:
            raise ValueError(f"{line_no}번째 줄은 앞면과 뒷면이 필요합니다.")
        front = validate_text(columns[0], f"{line_no}번째 줄 앞면", 200)
        back = validate_text(columns[1], f"{line_no}번째 줄 뒷면", 500)
        memo = columns[2] if len(columns) >= 3 else ""
        example_text = " | ".join(columns[3:]) if len(columns) >= 4 else ""
        items.append(
            {
                "front": front,
                "back": back,
                "memo": memo,
                "examples": parse_example_text(example_text),
            }
        )
    if not items:
        raise ValueError("등록할 카드가 없습니다.")
    if len(items) > 500:
        raise ValueError("한 번에 500개까지만 등록할 수 있습니다.")
    return items


def parse_id_list(value: object) -> list[int]:
    raw_items: list[object]
    if value is None:
        return []
    if isinstance(value, list):
        raw_items = value
    else:
        raw_items = str(value).replace(",", " ").split()
    ids: list[int] = []
    seen: set[int] = set()
    for raw in raw_items:
        group_id = int(raw or 0)
        if group_id <= 0 or group_id in seen:
            continue
        ids.append(group_id)
        seen.add(group_id)
    return ids


def groups_for_collection(
    conn: sqlite3.Connection,
    collection_id: int,
    group_ids: list[int] | None = None,
) -> list[sqlite3.Row]:
    params: list[object] = [collection_id]
    where = "WHERE collection_id = ?"
    if group_ids:
        placeholders = ",".join("?" for _ in group_ids)
        where += f" AND id IN ({placeholders})"
        params.extend(group_ids)
    rows = conn.execute(
        f"""
        SELECT *
        FROM groups
        {where}
        ORDER BY created_at ASC, id ASC
        """,
        params,
    ).fetchall()
    if group_ids and len(rows) != len(set(group_ids)):
        raise ValueError("대그룹에 속하지 않는 소그룹이 포함되어 있습니다.")
    return rows


def group_round_no(conn: sqlite3.Connection, group_id: int) -> int:
    return (
        conn.execute(
            """
            SELECT COUNT(DISTINCT round_id) + 1
            FROM study_round_groups
            WHERE group_id = ?
            """,
            (group_id,),
        ).fetchone()[0]
        or 1
    )


def delete_rounds_for_group(conn: sqlite3.Connection, group_id: int) -> int:
    return conn.execute(
        """
        DELETE FROM study_rounds
        WHERE group_id = ?
           OR id IN (
               SELECT round_id
               FROM study_round_groups
               WHERE group_id = ?
           )
        """,
        (group_id, group_id),
    ).rowcount


def delete_rounds_for_collection(conn: sqlite3.Connection, collection_id: int) -> int:
    return conn.execute(
        """
        DELETE FROM study_rounds
        WHERE collection_id = ?
           OR group_id IN (
               SELECT id
               FROM groups
               WHERE collection_id = ?
           )
           OR id IN (
               SELECT rg.round_id
               FROM study_round_groups rg
               JOIN groups g ON g.id = rg.group_id
               WHERE g.collection_id = ?
           )
        """,
        (collection_id, collection_id, collection_id),
    ).rowcount


def delete_orphan_rounds(conn: sqlite3.Connection) -> int:
    return conn.execute(
        """
        DELETE FROM study_rounds
        WHERE NOT EXISTS (
            SELECT 1
            FROM study_round_groups rg
            WHERE rg.round_id = study_rounds.id
        )
        """
    ).rowcount


class AppHandler(BaseHTTPRequestHandler):
    server_version = "Byeorakchigi/1.0"

    def do_GET(self) -> None:
        self.handle_request("GET")

    def do_POST(self) -> None:
        self.handle_request("POST")

    def do_PATCH(self) -> None:
        self.handle_request("PATCH")

    def do_DELETE(self) -> None:
        self.handle_request("DELETE")

    def log_message(self, format: str, *args: object) -> None:
        print(f"{self.address_string()} - {format % args}")

    def handle_request(self, method: str) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        try:
            if not self.is_authorized():
                self.require_auth()
                return
            if path.startswith("/api/"):
                self.handle_api(method, path, parse_qs(parsed.query))
            else:
                self.handle_static(path)
        except ValueError as exc:
            self.send_json({"error": str(exc)}, HTTPStatus.BAD_REQUEST)
        except sqlite3.IntegrityError as exc:
            message = "이미 존재하거나 연결된 데이터가 올바르지 않습니다."
            self.send_json({"error": message, "detail": str(exc)}, HTTPStatus.CONFLICT)
        except Exception as exc:
            self.send_json(
                {"error": "서버 오류가 발생했습니다.", "detail": str(exc)},
                HTTPStatus.INTERNAL_SERVER_ERROR,
            )

    def handle_static(self, path: str) -> None:
        is_service_worker = path == "/sw.js"
        if is_service_worker:
            file_path = STATIC_DIR / "sw.js"
        elif path in ("", "/"):
            file_path = STATIC_DIR / "index.html"
        else:
            safe_path = Path(path.lstrip("/"))
            file_path = (ROOT / safe_path).resolve()
            if not str(file_path).startswith(str(ROOT)):
                self.send_error(HTTPStatus.FORBIDDEN)
                return
        if not file_path.exists() or not file_path.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        data = file_path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        if is_service_worker:
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Service-Worker-Allowed", "/")
        self.end_headers()
        self.wfile.write(data)

    def handle_api(self, method: str, path: str, query: dict[str, list[str]]) -> None:
        parts = [part for part in path.split("/") if part]
        with connect() as conn:
            if parts == ["api", "health"] and method == "GET":
                self.send_json({"ok": True})
                return
            if parts == ["api", "auth"] and method == "POST":
                self.login(conn)
                return

            user = self.current_user(conn)
            if user is None:
                self.send_json({"error": "로그인이 필요합니다."}, HTTPStatus.UNAUTHORIZED)
                return

            if parts == ["api", "settings"]:
                if method == "GET":
                    self.send_json({"settings": self.settings_payload(user)})
                    return
                if method == "PATCH":
                    self.update_settings(conn, user)
                    return

            if parts == ["api", "collections"]:
                if method == "GET":
                    self.send_json({"collections": collections_payload(conn)})
                    return
                if method == "POST":
                    body = parse_body(self)
                    name = validate_text(body.get("name"), "대그룹명", 100)
                    description = str(body.get("description") or "").strip()
                    cur = conn.execute(
                        "INSERT INTO collections (name, description) VALUES (?, ?)",
                        (name, description),
                    )
                    collection = get_collection(conn, int(cur.lastrowid))
                    self.send_json({"collection": row_to_dict(collection)}, HTTPStatus.CREATED)
                    return

            if (
                len(parts) == 4
                and parts[:2] == ["api", "collections"]
                and parts[3] == "reset-history"
                and method == "POST"
            ):
                collection_id = int(parts[2])
                collection = get_collection(conn, collection_id)
                if collection is None:
                    self.send_json({"error": "대그룹을 찾을 수 없습니다."}, HTTPStatus.NOT_FOUND)
                    return
                self.reset_collection_history(conn, collection_id)
                return

            if len(parts) == 3 and parts[:2] == ["api", "collections"]:
                collection_id = int(parts[2])
                collection = get_collection(conn, collection_id)
                if collection is None:
                    self.send_json({"error": "대그룹을 찾을 수 없습니다."}, HTTPStatus.NOT_FOUND)
                    return
                if method == "PATCH":
                    body = parse_body(self)
                    name = validate_text(body.get("name", collection["name"]), "대그룹명", 100)
                    description = str(body.get("description", collection["description"]) or "").strip()
                    conn.execute(
                        "UPDATE collections SET name = ?, description = ? WHERE id = ?",
                        (name, description, collection_id),
                    )
                    updated = get_collection(conn, collection_id)
                    self.send_json({"collection": row_to_dict(updated)})
                    return
                if method == "DELETE":
                    delete_rounds_for_collection(conn, collection_id)
                    conn.execute("DELETE FROM collections WHERE id = ?", (collection_id,))
                    delete_orphan_rounds(conn)
                    self.send_json({"ok": True})
                    return

            if parts == ["api", "groups"]:
                if method == "GET":
                    self.send_json({"groups": groups_payload(conn)})
                    return
                if method == "POST":
                    body = parse_body(self)
                    collection_id = int(body.get("collection_id") or 0)
                    if get_collection(conn, collection_id) is None:
                        raise ValueError("소그룹을 넣을 대그룹을 선택하세요.")
                    name = validate_text(body.get("name"), "소그룹명", 100)
                    description = str(body.get("description") or "").strip()
                    cur = conn.execute(
                        "INSERT INTO groups (collection_id, name, description) VALUES (?, ?, ?)",
                        (collection_id, name, description),
                    )
                    group = conn.execute(
                        "SELECT * FROM groups WHERE id = ?",
                        (cur.lastrowid,),
                    ).fetchone()
                    self.send_json({"group": row_to_dict(group)}, HTTPStatus.CREATED)
                    return

            if (
                len(parts) == 4
                and parts[:2] == ["api", "groups"]
                and parts[3] == "reset-history"
                and method == "POST"
            ):
                group_id = int(parts[2])
                group = get_group(conn, group_id)
                if group is None:
                    self.send_json({"error": "소그룹을 찾을 수 없습니다."}, HTTPStatus.NOT_FOUND)
                    return
                self.reset_group_history(conn, group_id)
                return

            if len(parts) == 3 and parts[:2] == ["api", "groups"]:
                group_id = int(parts[2])
                group = get_group(conn, group_id)
                if group is None:
                    self.send_json({"error": "소그룹을 찾을 수 없습니다."}, HTTPStatus.NOT_FOUND)
                    return
                if method == "PATCH":
                    body = parse_body(self)
                    collection_id = int(body.get("collection_id", group["collection_id"]) or group["collection_id"])
                    if get_collection(conn, collection_id) is None:
                        raise ValueError("소그룹을 넣을 대그룹을 선택하세요.")
                    name = validate_text(body.get("name", group["name"]), "소그룹명", 100)
                    description = str(body.get("description", group["description"]) or "").strip()
                    conn.execute(
                        "UPDATE groups SET collection_id = ?, name = ?, description = ? WHERE id = ?",
                        (collection_id, name, description, group_id),
                    )
                    updated = get_group(conn, group_id)
                    self.send_json({"group": row_to_dict(updated)})
                    return
                if method == "DELETE":
                    delete_rounds_for_group(conn, group_id)
                    conn.execute("DELETE FROM groups WHERE id = ?", (group_id,))
                    delete_orphan_rounds(conn)
                    self.send_json({"ok": True})
                    return

            if parts == ["api", "cards"]:
                if method == "GET":
                    group_id = int(query["group_id"][0]) if query.get("group_id") else None
                    group_ids = parse_id_list(query["group_ids"][0]) if query.get("group_ids") else None
                    q = query["q"][0].strip() if query.get("q") else None
                    self.send_json(
                        {
                            "cards": cards_payload(
                                conn,
                                group_id=group_id,
                                group_ids=group_ids,
                                query=q,
                                recent_round_window=int(user["weak_recent_rounds"] or DEFAULT_WEAK_RECENT_ROUNDS),
                            )
                        }
                    )
                    return
                if method == "POST":
                    self.create_card(conn)
                    return

            if parts == ["api", "cards", "bulk"] and method == "POST":
                self.create_bulk_cards(conn)
                return

            if len(parts) == 3 and parts[:2] == ["api", "cards"]:
                card_id = int(parts[2])
                if method == "PATCH":
                    self.update_card(conn, card_id)
                    return
                if method == "DELETE":
                    card = get_card(conn, card_id)
                    if card is None:
                        self.send_json({"error": "카드를 찾을 수 없습니다."}, HTTPStatus.NOT_FOUND)
                        return
                    conn.execute("DELETE FROM cards WHERE id = ?", (card_id,))
                    self.send_json({"ok": True})
                    return

            if parts == ["api", "study"] and method == "GET":
                order_mode = query.get("order", ["sequence"])[0]
                if order_mode not in ("sequence", "random", "wrong"):
                    raise ValueError("지원하지 않는 학습 순서입니다.")
                collection_id = int(query.get("collection_id", ["0"])[0])
                if collection_id:
                    collection = get_collection(conn, collection_id)
                    if collection is None:
                        self.send_json({"error": "대그룹을 찾을 수 없습니다."}, HTTPStatus.NOT_FOUND)
                        return
                    group_ids = parse_id_list(query.get("group_ids", [""])[0])
                    if not group_ids:
                        raise ValueError("학습할 소그룹을 하나 이상 선택하세요.")
                    selected_groups = groups_for_collection(conn, collection_id, group_ids)
                    selected_group_ids = [int(group["id"]) for group in selected_groups]
                    cards = cards_payload(conn, group_ids=selected_group_ids, order_mode=order_mode)
                    self.send_json(
                        {
                            "scope_type": "practice",
                            "collection": row_to_dict(collection),
                            "groups": [row_to_dict(group) for group in selected_groups],
                            "round_no": group_round_no(conn, selected_group_ids[0]),
                            "order_mode": order_mode,
                            "cards": cards,
                        }
                    )
                    return
                group_id = int(query.get("group_id", ["0"])[0])
                group = get_group(conn, group_id)
                if group is None:
                    self.send_json({"error": "소그룹을 찾을 수 없습니다."}, HTTPStatus.NOT_FOUND)
                    return
                collection = get_collection(conn, int(group["collection_id"]))
                cards = cards_payload(conn, group_id=group_id, order_mode=order_mode)
                self.send_json(
                    {
                        "scope_type": "group",
                        "collection": row_to_dict(collection) if collection else None,
                        "group": row_to_dict(group),
                        "groups": [row_to_dict(group)],
                        "round_no": group_round_no(conn, group_id),
                        "order_mode": order_mode,
                        "cards": cards,
                    }
                )
                return

            if parts == ["api", "rounds"]:
                if method == "GET":
                    group_id = int(query["group_id"][0]) if query.get("group_id") else None
                    collection_id = int(query["collection_id"][0]) if query.get("collection_id") else None
                    limit = normalize_round_limit(query.get("limit", ["200"])[0])
                    self.send_json({"rounds": self.rounds_payload(conn, group_id, collection_id, limit)})
                    return
                if method == "POST":
                    self.complete_round(conn)
                    return

            if len(parts) == 3 and parts[:2] == ["api", "rounds"] and method == "GET":
                round_id = int(parts[2])
                detail = self.round_detail_payload(conn, round_id)
                if detail is None:
                    self.send_json({"error": "회독 기록을 찾을 수 없습니다."}, HTTPStatus.NOT_FOUND)
                    return
                self.send_json(detail)
                return

            if parts == ["api", "weak-rounds"] and method == "POST":
                self.complete_weak_round(conn)
                return

            if parts == ["api", "backup"]:
                if method == "GET":
                    self.send_json({"backup": backup_payload(conn)})
                    return
                if method == "POST":
                    self.import_backup(conn)
                    return

        self.send_json({"error": "요청 경로를 찾을 수 없습니다."}, HTTPStatus.NOT_FOUND)

    def login(self, conn: sqlite3.Connection) -> None:
        body = parse_body(self)
        nickname = validate_nickname(body.get("nickname"))
        access_code = validate_access_code(body.get("access_code"))
        user = conn.execute(
            "SELECT * FROM users WHERE nickname = ?",
            (nickname,),
        ).fetchone()
        if user is None:
            cur = conn.execute(
                """
                INSERT INTO users (
                    nickname,
                    access_code,
                    weak_card_threshold,
                    weak_recent_rounds,
                    weak_recent_wrong_threshold
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    nickname,
                    access_code,
                    DEFAULT_WEAK_CARD_THRESHOLD,
                    DEFAULT_WEAK_RECENT_ROUNDS,
                    DEFAULT_WEAK_RECENT_WRONG_THRESHOLD,
                ),
            )
            user = conn.execute(
                "SELECT * FROM users WHERE id = ?",
                (cur.lastrowid,),
            ).fetchone()
        elif not hmac.compare_digest(str(user["access_code"]), access_code):
            self.send_json({"error": "닉네임 또는 숫자 코드가 맞지 않습니다."}, HTTPStatus.UNAUTHORIZED)
            return
        else:
            conn.execute(
                f"UPDATE users SET last_login_at = {utc_now_sql()} WHERE id = ?",
                (user["id"],),
            )
        self.send_json(
            {
                "user": {
                    "id": user["id"],
                    "nickname": user["nickname"],
                }
            }
        )

    def current_user(self, conn: sqlite3.Connection) -> sqlite3.Row | None:
        user_id = (
            self.headers.get("X-Byeorakchigi-User-Id")
            or self.headers.get("X-JLPT-User-Id")
            or ""
        ).strip()
        access_code = (
            self.headers.get("X-Byeorakchigi-Code")
            or self.headers.get("X-JLPT-Code")
            or ""
        ).strip()
        if not access_code:
            return None
        if user_id:
            if not user_id.isdigit():
                return None
            user = conn.execute(
                "SELECT * FROM users WHERE id = ?",
                (int(user_id),),
            ).fetchone()
        else:
            nickname = (
                self.headers.get("X-Byeorakchigi-Nickname")
                or self.headers.get("X-JLPT-Nickname")
                or ""
            ).strip()
            if not nickname:
                return None
            user = conn.execute(
                "SELECT * FROM users WHERE nickname = ?",
                (nickname,),
            ).fetchone()
        if user is None:
            return None
        if not hmac.compare_digest(str(user["access_code"]), access_code):
            return None
        return user

    def settings_payload(self, user: sqlite3.Row) -> dict:
        return {
            "target_name": str(user["target_name"] or ""),
            "jlpt_exam_date": str(user["jlpt_exam_date"] or ""),
            "weak_card_threshold": int(user["weak_card_threshold"] or DEFAULT_WEAK_CARD_THRESHOLD),
            "weak_recent_rounds": int(user["weak_recent_rounds"] or DEFAULT_WEAK_RECENT_ROUNDS),
            "weak_recent_wrong_threshold": int(
                user["weak_recent_wrong_threshold"] or DEFAULT_WEAK_RECENT_WRONG_THRESHOLD
            ),
        }

    def update_settings(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        body = parse_body(self)
        target_name = (
            validate_optional_text(body.get("target_name"), "목표 이름", 80)
            if "target_name" in body
            else str(user["target_name"] or "")
        )
        exam_date = (
            validate_exam_date(body.get("jlpt_exam_date"))
            if "jlpt_exam_date" in body
            else str(user["jlpt_exam_date"] or "")
        )
        weak_card_threshold = (
            validate_weak_card_threshold(body.get("weak_card_threshold"))
            if "weak_card_threshold" in body
            else int(user["weak_card_threshold"] or DEFAULT_WEAK_CARD_THRESHOLD)
        )
        weak_recent_rounds = (
            validate_weak_recent_rounds(body.get("weak_recent_rounds"))
            if "weak_recent_rounds" in body
            else int(user["weak_recent_rounds"] or DEFAULT_WEAK_RECENT_ROUNDS)
        )
        weak_recent_wrong_threshold = (
            validate_weak_recent_wrong_threshold(body.get("weak_recent_wrong_threshold"))
            if "weak_recent_wrong_threshold" in body
            else int(user["weak_recent_wrong_threshold"] or DEFAULT_WEAK_RECENT_WRONG_THRESHOLD)
        )
        conn.execute(
            """
            UPDATE users
            SET target_name = ?,
                jlpt_exam_date = ?,
                weak_card_threshold = ?,
                weak_recent_rounds = ?,
                weak_recent_wrong_threshold = ?
            WHERE id = ?
            """,
            (
                target_name,
                exam_date,
                weak_card_threshold,
                weak_recent_rounds,
                weak_recent_wrong_threshold,
                user["id"],
            ),
        )
        updated = conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
        self.send_json({"settings": self.settings_payload(updated)})

    def create_card(self, conn: sqlite3.Connection) -> None:
        body = parse_body(self)
        group_id = int(body.get("group_id") or 0)
        if get_group(conn, group_id) is None:
            raise ValueError("카드를 저장할 소그룹을 선택하세요.")
        front = validate_text(body.get("front"), "앞면", 200)
        back = validate_text(body.get("back"), "뒷면", 500)
        memo = str(body.get("memo") or "").strip()
        examples = body.get("examples") or []
        if not isinstance(examples, list):
            raise ValueError("예문은 배열이어야 합니다.")
        if duplicate_card_exists(conn, group_id, front):
            raise ValueError("같은 소그룹에 이미 같은 앞면 카드가 있습니다.")
        cur = conn.execute(
            """
            INSERT INTO cards (group_id, front, back, memo)
            VALUES (?, ?, ?, ?)
            """,
            (group_id, front, back, memo),
        )
        card_id = int(cur.lastrowid)
        insert_examples(conn, card_id, examples)
        card = cards_payload(conn, query=None)
        created = next(item for item in card if int(item["id"]) == card_id)
        self.send_json({"card": created}, HTTPStatus.CREATED)

    def update_card(self, conn: sqlite3.Connection, card_id: int) -> None:
        card = get_card(conn, card_id)
        if card is None:
            self.send_json({"error": "카드를 찾을 수 없습니다."}, HTTPStatus.NOT_FOUND)
            return
        body = parse_body(self)
        group_id = int(body.get("group_id", card["group_id"]) or card["group_id"])
        if get_group(conn, group_id) is None:
            raise ValueError("카드를 저장할 소그룹을 선택하세요.")
        front = validate_text(body.get("front", card["front"]), "앞면", 200)
        back = validate_text(body.get("back", card["back"]), "뒷면", 500)
        memo = str(body.get("memo", card["memo"]) or "").strip()
        examples = body.get("examples")
        if examples is not None and not isinstance(examples, list):
            raise ValueError("예문은 배열이어야 합니다.")
        if duplicate_card_exists(conn, group_id, front, card_id):
            raise ValueError("같은 소그룹에 이미 같은 앞면 카드가 있습니다.")
        conn.execute(
            f"""
            UPDATE cards
            SET group_id = ?,
                front = ?,
                back = ?,
                memo = ?,
                updated_at = {utc_now_sql()}
            WHERE id = ?
            """,
            (group_id, front, back, memo, card_id),
        )
        if examples is not None:
            conn.execute("DELETE FROM examples WHERE card_id = ?", (card_id,))
            insert_examples(conn, card_id, examples)
        updated = next(item for item in cards_payload(conn) if int(item["id"]) == card_id)
        self.send_json({"card": updated})

    def create_bulk_cards(self, conn: sqlite3.Connection) -> None:
        body = parse_body(self)
        group_id = int(body.get("group_id") or 0)
        if get_group(conn, group_id) is None:
            raise ValueError("카드를 저장할 소그룹을 선택하세요.")
        items = parse_bulk_cards(body.get("text"))
        seen_fronts = set()
        for item in items:
            front = item["front"]
            if front in seen_fronts:
                raise ValueError(f"대량 등록 안에 같은 앞면이 두 번 들어 있습니다: {front}")
            seen_fronts.add(front)
            if duplicate_card_exists(conn, group_id, front):
                raise ValueError(f"같은 소그룹에 이미 같은 앞면 카드가 있습니다: {front}")
        created_ids = []
        for item in items:
            cur = conn.execute(
                """
                INSERT INTO cards (group_id, front, back, memo)
                VALUES (?, ?, ?, ?)
                """,
                (group_id, item["front"], item["back"], item["memo"]),
            )
            card_id = int(cur.lastrowid)
            created_ids.append(card_id)
            insert_examples(conn, card_id, item["examples"])
        self.send_json(
            {
                "ok": True,
                "created_count": len(created_ids),
                "card_ids": created_ids,
            },
            HTTPStatus.CREATED,
        )

    def import_backup(self, conn: sqlite3.Connection) -> None:
        body = parse_body(self)
        result = restore_backup(conn, body)
        self.send_json({"ok": True, "restored": result})

    def reset_group_history(self, conn: sqlite3.Connection, group_id: int) -> None:
        rounds_deleted = delete_rounds_for_group(conn, group_id)
        cards_reset = conn.execute(
            f"""
            UPDATE cards
            SET correct_count = 0,
                wrong_count = 0,
                updated_at = {utc_now_sql()}
            WHERE group_id = ?
            """,
            (group_id,),
        ).rowcount
        self.send_json(
            {
                "ok": True,
                "rounds_deleted": rounds_deleted,
                "cards_reset": cards_reset,
            }
        )

    def reset_collection_history(self, conn: sqlite3.Connection, collection_id: int) -> None:
        rounds_deleted = delete_rounds_for_collection(conn, collection_id)
        cards_reset = conn.execute(
            f"""
            UPDATE cards
            SET correct_count = 0,
                wrong_count = 0,
                updated_at = {utc_now_sql()}
            WHERE group_id IN (
                SELECT id
                FROM groups
                WHERE collection_id = ?
            )
            """,
            (collection_id,),
        ).rowcount
        self.send_json(
            {
                "ok": True,
                "rounds_deleted": rounds_deleted,
                "cards_reset": cards_reset,
            }
        )

    def complete_round(self, conn: sqlite3.Connection) -> None:
        body = parse_body(self)
        collection_id = int(body.get("collection_id") or 0)
        group_id = int(body.get("group_id") or 0)
        order_mode = str(body.get("order_mode") or "sequence")
        started_at = normalize_timestamp(body.get("started_at"))
        duration_seconds = normalize_duration(body.get("duration_seconds"))
        results = body.get("results") or []
        if order_mode not in ("sequence", "random", "wrong"):
            raise ValueError("지원하지 않는 학습 순서입니다.")
        if not isinstance(results, list) or not results:
            raise ValueError("저장할 학습 결과가 없습니다.")
        if collection_id:
            raise ValueError("묶음 연습은 학습 기록을 저장하지 않습니다.")

        scope_type = "group"
        primary_group_id: int | None = None
        selected_group_ids: list[int]
        round_collection_id: int | None = None
        if collection_id:
            if get_collection(conn, collection_id) is None:
                raise ValueError("대그룹을 찾을 수 없습니다.")
            selected_group_ids = parse_id_list(body.get("group_ids"))
            if not selected_group_ids:
                raise ValueError("학습한 소그룹 정보가 없습니다.")
            selected_groups = groups_for_collection(conn, collection_id, selected_group_ids)
            selected_group_ids = [int(group["id"]) for group in selected_groups]
            primary_group_id = selected_group_ids[0] if len(selected_group_ids) == 1 else None
            round_no = group_round_no(conn, selected_group_ids[0])
            previous_round = conn.execute(
                """
                SELECT sr.*
                FROM study_rounds sr
                JOIN study_round_groups rg ON rg.round_id = sr.id
                WHERE rg.group_id = ?
                ORDER BY completed_at DESC, id DESC
                LIMIT 1
                """,
                (selected_group_ids[0],),
            ).fetchone()
        else:
            group = get_group(conn, group_id)
            if group is None:
                raise ValueError("소그룹을 찾을 수 없습니다.")
            primary_group_id = group_id
            selected_group_ids = [group_id]
            round_no = group_round_no(conn, group_id)
            previous_round = conn.execute(
                """
                SELECT sr.*
                FROM study_rounds sr
                JOIN study_round_groups rg ON rg.round_id = sr.id
                WHERE rg.group_id = ?
                ORDER BY sr.completed_at DESC, sr.id DESC
                LIMIT 1
                """,
                (group_id,),
            ).fetchone()

        card_ids = []
        cleaned = []
        for result in results:
            if not isinstance(result, dict):
                raise ValueError("학습 결과 형식이 올바르지 않습니다.")
            card_id = int(result.get("card_id") or 0)
            value = str(result.get("result") or "")
            if value not in ("correct", "wrong"):
                raise ValueError("결과는 correct 또는 wrong이어야 합니다.")
            card_ids.append(card_id)
            cleaned.append((card_id, value))

        unique_card_ids = sorted(set(card_ids))
        group_placeholders = ",".join("?" for _ in selected_group_ids)
        card_placeholders = ",".join("?" for _ in unique_card_ids)
        rows = conn.execute(
            f"""
            SELECT id, group_id FROM cards
            WHERE group_id IN ({group_placeholders})
              AND id IN ({card_placeholders})
            """,
            [*selected_group_ids, *unique_card_ids],
        ).fetchall()
        valid_ids = {int(row["id"]) for row in rows}
        if len(valid_ids) != len(unique_card_ids):
            raise ValueError("선택한 소그룹에 속하지 않는 카드가 포함되어 있습니다.")

        correct_count = sum(1 for _, value in cleaned if value == "correct")
        wrong_count = len(cleaned) - correct_count
        cur = conn.execute(
            """
            INSERT INTO study_rounds (
                collection_id,
                group_id,
                scope_type,
                round_no,
                order_mode,
                total_cards,
                correct_count,
                wrong_count,
                started_at,
                duration_seconds
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                round_collection_id,
                primary_group_id,
                scope_type,
                round_no,
                order_mode,
                len(cleaned),
                correct_count,
                wrong_count,
                started_at,
                duration_seconds,
            ),
        )
        round_id = int(cur.lastrowid)
        conn.executemany(
            "INSERT INTO study_round_groups (round_id, group_id) VALUES (?, ?)",
            [(round_id, selected_group_id) for selected_group_id in selected_group_ids],
        )
        conn.executemany(
            "INSERT INTO reviews (round_id, card_id, result) VALUES (?, ?, ?)",
            [(round_id, card_id, value) for card_id, value in cleaned],
        )
        for card_id, value in cleaned:
            column = "correct_count" if value == "correct" else "wrong_count"
            conn.execute(
                f"""
                UPDATE cards
                SET {column} = {column} + 1,
                    updated_at = {utc_now_sql()}
                WHERE id = ?
                """,
                (card_id,),
            )
        round_row = conn.execute(
            "SELECT * FROM study_rounds WHERE id = ?",
            (round_id,),
        ).fetchone()
        self.send_json(
            {
                "round": row_to_dict(round_row),
                "previous_round": row_to_dict(previous_round) if previous_round else None,
            },
            HTTPStatus.CREATED,
        )

    def complete_weak_round(self, conn: sqlite3.Connection) -> None:
        body = parse_body(self)
        started_at = normalize_timestamp(body.get("started_at"))
        duration_seconds = normalize_duration(body.get("duration_seconds"))
        results = body.get("results") or []
        if not isinstance(results, list) or not results:
            raise ValueError("저장할 약점 복습 결과가 없습니다.")

        card_ids = []
        cleaned = []
        for result in results:
            if not isinstance(result, dict):
                raise ValueError("약점 복습 결과 형식이 올바르지 않습니다.")
            card_id = int(result.get("card_id") or 0)
            value = str(result.get("result") or "")
            if value not in ("correct", "wrong"):
                raise ValueError("결과는 correct 또는 wrong이어야 합니다.")
            card_ids.append(card_id)
            cleaned.append((card_id, value))

        unique_card_ids = sorted(set(card_ids))
        placeholders = ",".join("?" for _ in unique_card_ids)
        rows = conn.execute(
            f"SELECT id FROM cards WHERE id IN ({placeholders})",
            unique_card_ids,
        ).fetchall()
        valid_ids = {int(row["id"]) for row in rows}
        if len(valid_ids) != len(unique_card_ids):
            raise ValueError("존재하지 않는 카드가 포함되어 있습니다.")

        completed_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        correct_count = sum(1 for _, value in cleaned if value == "correct")
        self.send_json(
            {
                "round": {
                    "id": None,
                    "group_id": None,
                    "group_name": "약점 카드",
                    "round_no": "약점 복습",
                    "order_mode": "wrong",
                    "total_cards": len(cleaned),
                    "correct_count": correct_count,
                    "wrong_count": len(cleaned) - correct_count,
                    "started_at": started_at,
                    "duration_seconds": duration_seconds,
                    "completed_at": completed_at,
                }
            },
            HTTPStatus.CREATED,
        )

    def round_detail_payload(self, conn: sqlite3.Connection, round_id: int) -> dict | None:
        round_row = conn.execute(
            """
            SELECT
                sr.*,
                COALESCE(c.name, g.name, '학습') AS group_name,
                c.name AS collection_name,
                (
                    SELECT group_concat(g2.name, ', ')
                    FROM study_round_groups rg2
                    JOIN groups g2 ON g2.id = rg2.group_id
                    WHERE rg2.round_id = sr.id
                ) AS selected_group_names,
                (
                    SELECT group_concat(rg2.group_id, ',')
                    FROM study_round_groups rg2
                    WHERE rg2.round_id = sr.id
                ) AS selected_group_ids
            FROM study_rounds sr
            LEFT JOIN groups g ON g.id = sr.group_id
            LEFT JOIN collections c ON c.id = sr.collection_id
            WHERE sr.id = ?
            """,
            (round_id,),
        ).fetchone()
        if round_row is None:
            return None

        review_rows = conn.execute(
            """
            SELECT
                rv.id,
                rv.card_id,
                rv.result,
                rv.reviewed_at,
                c.front,
                c.back,
                c.memo
            FROM reviews rv
            JOIN cards c ON c.id = rv.card_id
            WHERE rv.round_id = ?
            ORDER BY rv.id ASC
            """,
            (round_id,),
        ).fetchall()
        cards_by_id: dict[int, dict] = {}
        for row in review_rows:
            card_id = int(row["card_id"])
            if card_id not in cards_by_id:
                cards_by_id[card_id] = {
                    "id": card_id,
                    "front": row["front"],
                    "back": row["back"],
                    "memo": row["memo"],
                    "attempts": [],
                }
            attempts = cards_by_id[card_id]["attempts"]
            attempts.append(
                {
                    "id": row["id"],
                    "result": row["result"],
                    "reviewed_at": row["reviewed_at"],
                    "attempt_no": len(attempts) + 1,
                }
            )

        cards = list(cards_by_id.values())
        for card in cards:
            attempts = card["attempts"]
            card["wrong_count"] = sum(1 for item in attempts if item["result"] == "wrong")
            card["correct_count"] = sum(1 for item in attempts if item["result"] == "correct")
            card["first_result"] = attempts[0]["result"] if attempts else ""
            card["passed_attempt_no"] = len(attempts)

        first_attempt_total = len(cards)
        first_attempt_correct_count = sum(1 for card in cards if card["first_result"] == "correct")
        has_reviews = bool(review_rows)
        round_payload = row_to_dict(round_row)
        round_payload["first_attempt_total"] = first_attempt_total if has_reviews else int(round_row["total_cards"] or 0)
        round_payload["first_attempt_correct_count"] = (
            first_attempt_correct_count if has_reviews else int(round_row["correct_count"] or 0)
        )
        round_payload["total_attempts"] = len(review_rows) or int(round_row["total_cards"] or 0)
        round_payload["repeated_card_count"] = sum(1 for card in cards if card["wrong_count"] > 0)
        return {"round": round_payload, "cards": cards}

    def rounds_payload(
        self,
        conn: sqlite3.Connection,
        group_id: int | None,
        collection_id: int | None = None,
        limit: int = 200,
    ) -> list[dict]:
        clauses = []
        params = []
        if group_id:
            clauses.append(
                """
                EXISTS (
                    SELECT 1
                    FROM study_round_groups rg_filter
                    WHERE rg_filter.round_id = sr.id
                      AND rg_filter.group_id = ?
                )
                """
            )
            params.append(group_id)
        if collection_id:
            clauses.append(
                """
                (
                    sr.collection_id = ?
                    OR EXISTS (
                        SELECT 1
                        FROM study_round_groups rg_filter
                        JOIN groups g_filter ON g_filter.id = rg_filter.group_id
                        WHERE rg_filter.round_id = sr.id
                          AND g_filter.collection_id = ?
                    )
                )
                """
            )
            params.extend([collection_id, collection_id])
        where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        rows = conn.execute(
            f"""
            SELECT
                sr.*,
                COALESCE(c.name, g.name, '학습') AS group_name,
                c.name AS collection_name,
                (
                    SELECT group_concat(g2.name, ', ')
                    FROM study_round_groups rg2
                    JOIN groups g2 ON g2.id = rg2.group_id
                    WHERE rg2.round_id = sr.id
                ) AS selected_group_names,
                (
                    SELECT group_concat(rg2.group_id, ',')
                    FROM study_round_groups rg2
                    WHERE rg2.round_id = sr.id
                ) AS selected_group_ids,
                COALESCE(first_attempts.first_attempt_total, sr.total_cards) AS first_attempt_total,
                COALESCE(first_attempts.first_attempt_correct_count, sr.correct_count) AS first_attempt_correct_count
            FROM study_rounds sr
            LEFT JOIN groups g ON g.id = sr.group_id
            LEFT JOIN collections c ON c.id = sr.collection_id
            LEFT JOIN (
                SELECT
                    first_reviews.round_id,
                    COUNT(*) AS first_attempt_total,
                    SUM(CASE WHEN first_reviews.result = 'correct' THEN 1 ELSE 0 END) AS first_attempt_correct_count
                FROM reviews first_reviews
                JOIN (
                    SELECT round_id, card_id, MIN(id) AS first_review_id
                    FROM reviews
                    GROUP BY round_id, card_id
                ) first_ids ON first_ids.first_review_id = first_reviews.id
                GROUP BY first_reviews.round_id
            ) first_attempts ON first_attempts.round_id = sr.id
            {where_sql}
            ORDER BY sr.completed_at DESC, sr.id DESC
            LIMIT ?
            """,
            [*params, limit],
        ).fetchall()
        return [row_to_dict(row) for row in rows]

    def send_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def is_authorized(self) -> bool:
        if not APP_USER or not APP_PASSWORD:
            return True
        header = self.headers.get("Authorization", "")
        if not header.startswith("Basic "):
            return False
        try:
            decoded = base64.b64decode(header.removeprefix("Basic ").strip()).decode("utf-8")
        except Exception:
            return False
        username, separator, password = decoded.partition(":")
        if not separator:
            return False
        return secure_text_compare(username, APP_USER) and secure_text_compare(password, APP_PASSWORD)

    def require_auth(self) -> None:
        self.send_response(HTTPStatus.UNAUTHORIZED)
        self.send_header("WWW-Authenticate", 'Basic realm="Byeorakchigi", charset="UTF-8"')
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write("인증이 필요합니다.".encode("utf-8"))


def main() -> None:
    init_db()
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), AppHandler)
    print(f"꼬꼬회독 running at http://{host}:{port}")
    print(f"SQLite database: {DB_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
