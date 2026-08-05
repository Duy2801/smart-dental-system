"""RAG tối giản: knowledge JSONL + token-overlap search.

# ponytail: lexical overlap đủ khi KB nhỏ; đổi sang embedding khi chunk >~500 hoặc recall kém.
"""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

_DATA = Path(__file__).resolve().parent.parent.parent / "data" / "knowledge.jsonl"
_TOKEN = re.compile(r"[a-zA-Zà-ỹÀ-Ỹ0-9]+", re.UNICODE)


def _tokens(text: str) -> set[str]:
    return {t.lower() for t in _TOKEN.findall(text) if len(t) > 1}


@lru_cache(maxsize=1)
def _load_chunks() -> tuple[dict, ...]:
    if not _DATA.is_file():
        return ()
    chunks: list[dict] = []
    for line in _DATA.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        chunks.append(json.loads(line))
    return tuple(chunks)


def retrieve(query: str, top_k: int = 4, min_score: float = 0.08) -> list[dict]:
    """Trả về các chunk liên quan nhất (score = |q∩d| / |q| , cộng nhẹ tag trùng)."""
    q = _tokens(query)
    if not q:
        return []
    scored: list[tuple[float, dict]] = []
    for ch in _load_chunks():
        text = ch.get("text") or ""
        tags = " ".join(ch.get("tags") or [])
        d = _tokens(text) | _tokens(tags)
        if not d:
            continue
        overlap = len(q & d) / len(q)
        tag_bonus = 0.15 * (len(q & _tokens(tags)) / max(len(q), 1))
        score = overlap + tag_bonus
        if score >= min_score:
            scored.append((score, ch))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:top_k]]


def format_context(chunks: list[dict]) -> str:
    if not chunks:
        return ""
    lines = []
    for i, ch in enumerate(chunks, 1):
        src = ch.get("source") or "kb"
        lines.append(f"[{i}|{src}] {ch.get('text', '').strip()}")
    return "\n".join(lines)


def build_rag_block(query: str, top_k: int = 4) -> str:
    ctx = format_context(retrieve(query, top_k=top_k))
    if not ctx:
        return ""
    return (
        "Kiến thức phòng khám (chỉ dùng nếu liên quan; không bịa ngoài đoạn này):\n"
        f"{ctx}"
    )
