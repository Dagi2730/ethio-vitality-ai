"""Peer wellness community — JSON-backed forum."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

COMMUNITY_FILE = Path(__file__).resolve().parent.parent / "data" / "community_posts.json"
COMMUNITY_FILE.parent.mkdir(parents=True, exist_ok=True)


def _load() -> list[dict]:
    if COMMUNITY_FILE.exists():
        return json.loads(COMMUNITY_FILE.read_text(encoding="utf-8"))
    return []


def _save(posts: list[dict]) -> None:
    COMMUNITY_FILE.write_text(json.dumps(posts, indent=2), encoding="utf-8")


def create_post(
    author_id: str,
    author_name: str,
    content: str,
    category: str = "general",
    anonymous: bool = False,
) -> dict:
    posts = _load()
    post = {
        "id": str(len(posts) + 1),
        "author_id": author_id,
        "author": "Anonymous" if anonymous else author_name,
        "content": content[:1000],
        "category": category,
        "likes": 0,
        "replies": [],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "flagged": False,
    }
    posts.insert(0, post)
    _save(posts)
    return post


def add_reply(
    post_id: str, author_name: str, content: str, anonymous: bool
) -> dict | None:
    posts = _load()
    for post in posts:
        if post["id"] == post_id:
            reply = {
                "id": str(len(post["replies"]) + 1),
                "author": "Anonymous" if anonymous else author_name,
                "content": content[:500],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            post["replies"].append(reply)
            _save(posts)
            return reply
    return None


def like_post(post_id: str) -> int:
    posts = _load()
    for post in posts:
        if post["id"] == post_id:
            post["likes"] += 1
            _save(posts)
            return post["likes"]
    return 0


def get_posts(category: str | None = None, limit: int = 20) -> list[dict]:
    posts = _load()
    if not posts:
        _seed_demo_posts()
        posts = _load()
    if category and category != "all":
        posts = [p for p in posts if p.get("category") == category]
    return posts[:limit]


def _seed_demo_posts() -> None:
    demos = [
        ("general", "Taking small walks between meetings really helps my stress.", "Hanna"),
        ("anxiety", "Does anyone else feel anxious before big family gatherings?", "Anonymous"),
        ("burnout", "Three months of overtime — how do you set boundaries respectfully?", "Dawit"),
        ("sleep", "Coffee after 4pm ruins my sleep. Anyone switched to buna earlier?", "Sara"),
        ("motivation", "Grateful for this space. Ishii, we can do hard things together.", "Member"),
    ]
    for cat, text, name in demos:
        create_post("demo", name, text, category=cat, anonymous=name == "Anonymous")
