# Homework 5: Configure MCP Servers

> **Student Name**: Vladyslav Tkach
> **Date Submitted**: March 8, 2026
> **AI Tools Used**: Claude Code

---

## Overview

This homework covers installing and configuring three external MCP servers
(GitHub, Filesystem, Jira) and building one custom MCP server with FastMCP.

## Tasks completed

| Task | Description | Status |
|------|-------------|--------|
| Task 1 | GitHub MCP — list PRs / commits | Done |
| Task 2 | Filesystem MCP — list and read files | Done |
| Task 3 | Jira MCP — query last 5 bug tickets | Done |
| Task 4 | Custom MCP server with FastMCP | Done |

## Task 4: Custom MCP Server

A lightweight Python MCP server built with [FastMCP](https://github.com/jlowin/fastmcp)
that reads words from a Lorem Ipsum source file.

### Concepts

- **Resources** are URIs that Claude can read from (e.g., files, APIs). They
  are passive data sources — Claude fetches content without triggering side
  effects.

- **Tools** are actions Claude can call to perform operations (e.g., reading a
  file, running a command). They are active — calling them can trigger logic,
  computation, or side effects.

### API

| Type | Name / URI | Default | Description |
|------|-----------|---------|-------------|
| Tool | `read` | `word_count=30` | Returns N words from the Lorem Ipsum source |
| Resource | `lorem://ipsum/{word_count}` | `word_count=30` | Same content, addressable by URI |

### Structure

```
homework-5/
├── README.md
├── HOWTORUN.md          # setup & usage instructions
├── TASKS.md             # task requirements
├── .mcp.json            # Claude Code server config (update paths for your machine)
├── custom-mcp-server/
│   ├── server.py
│   ├── lorem-ipsum.md
│   └── requirements.txt
└── docs/
    ├── task-4-plan.md
    └── screenshots/
```

### Quick start

See [HOWTORUN.md](./HOWTORUN.md) for full setup and usage instructions (all platforms).
