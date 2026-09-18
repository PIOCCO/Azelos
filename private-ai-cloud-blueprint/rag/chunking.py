def chunk_pages(pages: list[dict], chunk_size: int = 800, overlap: int = 100) -> list[dict]:
    chunks = []
    idx = 0
    for page in pages:
        text = (page.get("text") or "").strip()
        if not text:
            continue
        start = 0
        while start < len(text):
            end = min(len(text), start + chunk_size)
            piece = text[start:end]
            chunks.append(
                {
                    "chunk_index": idx,
                    "page": page.get("page"),
                    "section": page.get("section"),
                    "content": piece,
                }
            )
            idx += 1
            if end >= len(text):
                break
            start = end - overlap
    return chunks
