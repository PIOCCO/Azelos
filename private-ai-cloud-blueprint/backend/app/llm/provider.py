import httpx

from app.core.config import settings


class LLMProvider:
    def complete(self, system: str, user: str) -> str:
        raise NotImplementedError


class MockLLM(LLMProvider):
    def complete(self, system: str, user: str) -> str:
        if "vacation" in user.lower():
            return (
                "According to the HR Handbook, employees receive 20 days of paid vacation per year.\n\n"
                "Sources: HR_Handbook.pdf — Page 14"
            )
        if "RETRIEVED COMPANY CONTENT" in user and "HR" in user:
            return "According to the HR Handbook, employees receive paid vacation as described in the handbook."
        return "The available company documents do not contain enough information to answer that question."


class OllamaLLM(LLMProvider):
    def complete(self, system: str, user: str) -> str:
        payload = {
            "model": settings.llm_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "stream": False,
        }
        with httpx.Client(timeout=120.0) as client:
            r = client.post(f"{settings.llm_base_url.rstrip('/')}/api/chat", json=payload)
            r.raise_for_status()
            return r.json()["message"]["content"]


def get_llm() -> LLMProvider:
    if settings.llm_mock or settings.llm_provider == "mock":
        return MockLLM()
    if settings.llm_provider == "ollama":
        return OllamaLLM()
    raise ValueError(f"Unsupported LLM provider: {settings.llm_provider}")
