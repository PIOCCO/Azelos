import hashlib

import numpy as np

from app.core.config import settings

_model = None


def _mock_embed(text: str) -> list[float]:
    h = hashlib.sha256(text.encode()).digest()
    arr = np.frombuffer(h, dtype=np.uint8).astype(np.float32)
    reps = int(np.ceil(settings.embedding_dimension / len(arr)))
    vec = np.tile(arr, reps)[: settings.embedding_dimension]
    vec = vec / (np.linalg.norm(vec) + 1e-9)
    return vec.tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    if settings.llm_mock or settings.app_env == "test":
        return [_mock_embed(t) for t in texts]
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(settings.embedding_model)
    vectors = _model.encode(texts, normalize_embeddings=True)
    return [v.tolist() for v in vectors]
