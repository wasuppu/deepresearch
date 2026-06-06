import re


NOISE_PATTERNS = [
    r"字体：\s*小\s*中\s*大\s*分享到：?",
    r"\[设置\]\(#+\)\s*\*\s*日夜间\s*\*\s*主题色",
    r"\*\s*日夜间\s*\*\s*主题色\s*\*?",
    r"\[订阅\]\(#+\)",
    r"\[RSS订阅\]\([^)]+\)",
    r"分享到：?\s*(微信|微博|QQ|朋友圈|\s|\*)+",
    r"打开微信，点击底部的“发现”，\s*使用“扫一扫”即可将网页分享至朋友圈。",
]


def parse_numbered_lines(content: str, limit: int = 5) -> list[str]:
    lines: list[str] = []

    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        line = re.sub(r"^\s*(?:[-*]\s*)?(?:\d{1,2}[.、)]\s+)", "", line)
        line = re.sub(r"^\s*[-*]\s+", "", line)

        if line and line not in lines:
            lines.append(line)

    return lines[:limit]


def clean_source_excerpt(content: str, max_length: int = 4000) -> str:
    text = content or ""

    text = re.sub(r"!\[[^\]]*]\([^)]*\)", " ", text)
    text = re.sub(r"\[[^\]]*]\(#{1,}\)", " ", text)
    text = re.sub(r"data:image/[^)\s]+", " ", text)
    text = re.sub(r"https?://\S+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?\S*)?", " ", text)
    text = re.sub(r"(^|\s)#{1,6}\s+", " ", text)

    for pattern in NOISE_PATTERNS:
        text = re.sub(pattern, " ", text, flags=re.IGNORECASE)

    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+\*\s+", " ", text)
    text = re.sub(r"(?:\s*[|｜]\s*){2,}", " ", text)
    text = text.strip()

    return text[:max_length]
