def normalize_model_base_url(base_url: str, api_format: str) -> str:
    normalized = base_url.strip().rstrip("/")

    if api_format == "openai" and normalized.endswith("/chat/completions"):
        return normalized[: -len("/chat/completions")].rstrip("/")

    if api_format == "anthropic" and normalized.endswith("/messages"):
        return normalized[: -len("/messages")].rstrip("/")

    return normalized
