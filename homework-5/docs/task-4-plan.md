# Task 4 Implementation Plan: Custom MCP Server with FastMCP

> **Student Name**: Vladyslav Tkach
> **Date Submitted**: March 7, 2026
> **AI Tools Used**: Claude Code

---

## What to build

A Python MCP server using `fastmcp` that exposes:
- A **Resource** at a URI like `lorem://ipsum?word_count=30` — reads `lorem-ipsum.md` and returns N words
- A **Tool** named `read` — callable by Claude with optional `word_count` param, delegates to the resource

---

## Files to create

| File | Purpose |
|------|---------|
| `homework-5/custom-mcp-server/server.py` | FastMCP server with resource + tool |
| `homework-5/custom-mcp-server/lorem-ipsum.md` | Source text (Lorem Ipsum content) |
| `homework-5/custom-mcp-server/requirements.txt` | Python deps (must include `fastmcp`) |
| `homework-5/README.md` | Description of work + author name |
| `homework-5/HOWTORUN.md` | Install/run/connect/test instructions |
| `homework-5/.mcp.json` | MCP server config pointing to `server.py` |

---

## `server.py` design

```python
from fastmcp import FastMCP
mcp = FastMCP("lorem-ipsum-server")

@mcp.resource("lorem://ipsum")
def lorem_resource(word_count: int = 30) -> str:
    # Read lorem-ipsum.md, return first word_count words

@mcp.tool()
def read(word_count: int = 30) -> str:
    # Call the resource logic and return content
```

## `.mcp.json` config shape

```json
{
  "mcpServers": {
    "lorem-ipsum": {
      "command": "python",
      "args": ["homework-5/custom-mcp-server/server.py"]
    }
  }
}
```

---

## Docs to include

A short explanation differentiating:
- **Resources** — URIs Claude reads from (files, APIs, data sources); passive/read-only
- **Tools** — actions Claude calls to perform operations; active/executable

---

## Steps in order

1. Create `lorem-ipsum.md` with sufficient Lorem Ipsum text (~200+ words)
2. Write `server.py` with FastMCP resource + tool
3. Write `requirements.txt` with `fastmcp`
4. Write `HOWTORUN.md` (pip install, run server, connect MCP config, test)
5. Write `README.md` with task description + author name
6. Write `.mcp.json` MCP config
7. Test locally that the server starts and the tool returns word-limited content
