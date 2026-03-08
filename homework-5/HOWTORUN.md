# How to Run the Custom MCP Server

## Prerequisites

- Python 3.10 or higher
- Claude Code CLI

---

## 1. Install dependencies

### Linux (Debian/Ubuntu)

On Debian/Ubuntu, the system Python environment is externally managed and
blocks direct `pip install`. Use a virtual environment instead.

```bash
# Install venv support if missing
sudo apt install python3-venv

cd homework-5/custom-mcp-server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### macOS

```bash
cd homework-5/custom-mcp-server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

If Python 3 is not installed, get it via Homebrew: `brew install python`

### Windows (PowerShell)

```powershell
cd homework-5\custom-mcp-server
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

If Python is not installed, download it from [python.org](https://www.python.org/downloads/).
During installation, check **"Add Python to PATH"**.

> **Note:** If you see an execution policy error when activating the venv on
> Windows, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` first.

---

## 2. Run the server manually (optional)

This step is only needed to verify the server starts correctly. Claude Code
launches the server automatically via `.mcp.json` (see step 3).

With the virtual environment active, from inside `custom-mcp-server/`:

**Linux / macOS:**
```bash
python server.py
# or using the fastmcp CLI:
fastmcp run server.py
```

**Windows (PowerShell):**
```powershell
python server.py
# or using the fastmcp CLI:
fastmcp run server.py
```

The server starts in stdio mode and waits for MCP connections. Press `Ctrl+C`
to stop it.

---

## 3. Configure `.mcp.json`

The `.mcp.json` file in `homework-5/` tells Claude Code how to launch the
server. **It is already present in the repo**, but you must update the paths to
match your machine.

> **Why absolute paths?** Relative paths can fail depending on Claude Code's
> working directory at startup. Always use full absolute paths.

### Find your absolute path

**Linux / macOS:**
```bash
# Run from inside homework-5/
echo "$(pwd)/custom-mcp-server"
```

**Windows (PowerShell):**
```powershell
# Run from inside homework-5\
(Get-Item .).FullName + "\custom-mcp-server"
```

**Windows (Command Prompt):**
```cmd
cd homework-5\custom-mcp-server && cd
```

### Linux / macOS — `.mcp.json`

Replace `/path/to/homework-5` with the actual path on your machine:

```json
{
  "mcpServers": {
    "lorem-ipsum": {
      "command": "/path/to/homework-5/custom-mcp-server/.venv/bin/python",
      "args": ["/path/to/homework-5/custom-mcp-server/server.py"]
    }
  }
}
```

### Windows — `.mcp.json`

Use double backslashes (`\\`) inside JSON strings:

```json
{
  "mcpServers": {
    "lorem-ipsum": {
      "command": "C:\\path\\to\\homework-5\\custom-mcp-server\\.venv\\Scripts\\python.exe",
      "args": ["C:\\path\\to\\homework-5\\custom-mcp-server\\server.py"]
    }
  }
}
```

After editing `.mcp.json`, (re)open the `homework-5/` folder in Claude Code.
The server will start automatically in the background.

---

## 4. Use and test the `read` tool

Once connected, ask Claude Code to call the tool:

- **Default (30 words):**
  > Call the `read` tool on the lorem-ipsum server.

- **Custom word count:**
  > Call the `read` tool with `word_count=50`.

You can also ask Claude to read the resource directly by URI:

> Read the resource `lorem://ipsum/50` from the lorem-ipsum server.

### Expected output (30 words)

```
Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor
incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis
nostrud exercitation ullamco laboris nisi
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `python: command not found` (Linux/macOS) | Use `python3` instead of `python` |
| Execution policy error (Windows) | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `pip install` blocked (Linux) | Create a venv first (see step 1) |
| Server not found in Claude Code | Check absolute paths in `.mcp.json`; restart Claude Code |
| `ModuleNotFoundError: fastmcp` | Venv not activated or `pip install -r requirements.txt` not run |
