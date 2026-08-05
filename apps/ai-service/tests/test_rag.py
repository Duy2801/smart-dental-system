from app.core.rag import build_rag_block, retrieve


def test_retrieve_price_implant():
    hits = retrieve("giá trồng răng implant Hàn Quốc bao nhiêu", top_k=3)
    assert hits
    assert any("implant" in (h.get("id") or "") or "Implant" in (h.get("text") or "") for h in hits)


def test_retrieve_urgent_protocol():
    hits = retrieve("sưng mặt đau dữ dội có cần khám gấp không", top_k=3)
    assert hits
    ids = {h["id"] for h in hits}
    assert "protocol-urgent" in ids or any("khám gấp" in h["text"] for h in hits)


def test_build_rag_block_nonempty():
    block = build_rag_block("cạo vôi răng có mòn men không")
    assert "Kiến thức phòng khám" in block
    assert "cạo vôi" in block.lower() or "siêu âm" in block.lower()
