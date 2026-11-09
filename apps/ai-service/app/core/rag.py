"""RAG tối giản: knowledge JSONL + token-overlap search.

# ponytail: lexical overlap đủ khi KB nhỏ; đổi sang embedding khi chunk >~500 hoặc recall kém.
"""

from __future__ import annotations

import json
import re
import unicodedata
from functools import lru_cache
from pathlib import Path
from typing import Iterable

_DATA = Path(__file__).resolve().parent.parent.parent / "data" / "knowledge.jsonl"
_TOKEN = re.compile(r"[a-zA-Zà-ỹÀ-Ỹđ0-9]+", re.UNICODE)

# Từ hỏi/đệm phổ biến: giữ lại sẽ làm câu hỏi khớp nhầm mọi đoạn kiến thức.
_STOPWORDS_ACCENTED = {
    "có", "không", "là", "gì", "tôi", "mình", "bạn", "cho", "và", "của", "thì",
    "được", "nào", "nhé", "ạ", "ơi", "em", "anh", "chị", "thế", "này", "đó",
    "những", "các", "một", "với", "khi", "muốn", "hỏi", "vậy", "bị", "nha",
    "nhỉ", "sao", "ở", "đâu", "bao", "nhiêu", "mà", "rồi", "để", "hay",
    "hoặc", "thể", "nên", "làm", "như", "biết", "giúp", "xin", "dạ",
}
# Bản không dấu: chỉ những từ không bị trùng nghĩa quan trọng (vd "dau" = đau, "the" = thẻ).
_STOPWORDS_PLAIN = {
    "co", "khong", "la", "gi", "toi", "minh", "cho", "va", "duoc", "nao",
    "nhe", "nay", "nhung", "cac", "mot", "voi", "khi", "muon", "hoi", "vay",
    "bi", "nha", "sao", "bao", "nhieu", "thi", "de", "hay", "lam", "nhu",
    "biet", "giup", "xin",
}


def _strip_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text)
    stripped = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return stripped.replace("đ", "d").replace("Đ", "D")


def _tokens(text: str) -> set[str]:
    """Token của câu hỏi, giữ nguyên dấu như người dùng gõ và bỏ từ đệm."""
    out: set[str] = set()
    for raw in _TOKEN.findall(unicodedata.normalize("NFC", text)):
        token = raw.lower()
        if len(token) <= 1:
            continue
        stop = _STOPWORDS_PLAIN if _strip_accents(token) == token else _STOPWORDS_ACCENTED
        if token not in stop:
            out.add(token)
    return out


def _doc_tokens(text: str) -> set[str]:
    """Token tài liệu gồm cả bản có dấu và không dấu: câu có dấu khớp chính xác
    ("mở" không trùng "mô"), câu gõ không dấu vẫn khớp được."""
    out: set[str] = set()
    for raw in _TOKEN.findall(unicodedata.normalize("NFC", text)):
        token = raw.lower()
        if len(token) > 1:
            out.add(token)
            out.add(_strip_accents(token))
    return out


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


def retrieve(
    query: str,
    top_k: int = 4,
    min_score: float = 0.08,
    audience: str | None = None,
    exclude_sources: Iterable[str] = (),
) -> list[dict]:
    """Trả về các chunk liên quan nhất (score = |q∩d| / |q| , cộng nhẹ tag trùng).

    audience="patient" bỏ các chunk chỉ dành cho nhân viên (đơn thuốc, mẫu HSBA...).
    """
    q = _tokens(query)
    if not q:
        return []
    excluded = set(exclude_sources)
    scored: list[tuple[float, dict]] = []
    for ch in _load_chunks():
        if audience and ch.get("audience", "all") not in ("all", audience):
            continue
        if ch.get("source") in excluded:
            continue
        text = ch.get("text") or ""
        tags = " ".join(ch.get("tags") or [])
        tag_tokens = _doc_tokens(tags)
        d = _doc_tokens(text) | tag_tokens
        if not d:
            continue
        overlap = len(q & d) / len(q)
        tag_bonus = 0.15 * (len(q & tag_tokens) / max(len(q), 1))
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


def build_rag_block(
    query: str,
    top_k: int = 4,
    audience: str | None = None,
    exclude_sources: Iterable[str] = (),
) -> str:
    ctx = format_context(
        retrieve(
            query,
            top_k=top_k,
            audience=audience,
            exclude_sources=exclude_sources,
        )
    )
    if not ctx:
        return ""
    return (
        "Kiến thức phòng khám (chỉ dùng nếu liên quan; không bịa ngoài đoạn này):\n"
        f"{ctx}"
    )
