from pathlib import Path

from fastmcp import FastMCP

mcp = FastMCP("lorem-ipsum-server")

LOREM_FILE = Path(__file__).parent / "lorem-ipsum.md"


def _read_words(word_count: int) -> str:
    if word_count < 1:
        raise ValueError(f"word_count must be at least 1, got {word_count}")
    if not LOREM_FILE.exists():
        raise FileNotFoundError(f"lorem-ipsum.md not found at {LOREM_FILE}")
    text = LOREM_FILE.read_text(encoding="utf-8")
    words = text.split()
    return " ".join(words[:word_count])


@mcp.resource("lorem://ipsum/{word_count}")
def lorem_resource(word_count: int = 30) -> str:
    """Read word_count words from lorem-ipsum.md.

    Resources are URIs that Claude can read from (e.g., files, APIs).
    They are passive data sources — Claude fetches content from them
    but does not trigger side effects by reading them.
    """
    return _read_words(word_count)


@mcp.tool()
def read(word_count: int = 30) -> str:
    """Read word_count words from lorem-ipsum.md.

    Tools are actions Claude can call to perform operations (e.g., reading
    a file, running a command). Unlike resources, tools are active — calling
    them can trigger logic, side effects, or dynamic computation.
    """
    return _read_words(word_count)


if __name__ == "__main__":
    mcp.run()
