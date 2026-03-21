# How to Run — AI-Powered Multi-Agent Banking Pipeline

This guide covers setup and usage on **Linux**, **macOS**, and **Windows**.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 18 or later | [nodejs.org](https://nodejs.org) |
| npm | 9 or later | Comes with Node.js |
| Python | 3.10 or later | Required only for the MCP server |
| Git | any | To clone the repository |

### Check your versions

```bash
node --version
npm --version
python3 --version   # macOS / Linux
python --version    # Windows
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/VladyslavTkach/AI-Coding-Partner-Homework.git
cd AI-Coding-Partner-Homework/homework-6
```

---

## 2. Install Node.js Dependencies

```bash
npm install
```

---

## 3. Build the TypeScript Source

```bash
npx tsc
```

This compiles everything from `src/` into `dist/`. You must re-run this command any time you edit a `.ts` file.

---

## 4. Run the Pipeline

```bash
node dist/integrator.js
```

The pipeline reads `sample-transactions.json`, runs each transaction through all three agents, and prints a summary:

```
========== Pipeline Summary ==========
Total processed : 8
Settled         : 6
Declined        : 2
======================================
```

Results are written to `shared/results/<transaction_id>.json`.
The audit log is appended to `shared/logs/audit.log`.

---

## 5. Run the Tests

```bash
npm test
```

To see the full coverage report:

```bash
npm run test:coverage
```

Expected output: **105 tests passing**, line coverage ≥ 95%.

---

## 6. Start the HTTP API Server (optional)

```bash
node dist/server.js
```

The server starts on port 3000 by default.

**Query a single transaction:**
```
GET http://localhost:3000/status/TXN001
```

**List all results:**
```
GET http://localhost:3000/results
```

### Change the port

**Linux / macOS:**
```bash
PORT=8080 node dist/server.js
```

**Windows (Command Prompt):**
```cmd
set PORT=8080 && node dist/server.js
```

**Windows (PowerShell):**
```powershell
$env:PORT=8080; node dist/server.js
```

---

## 7. Run the MCP Server (optional)

The MCP server makes pipeline results queryable directly from Claude Code.

### Install FastMCP

**Linux / macOS:**
```bash
pip3 install fastmcp
```

**Windows:**
```cmd
pip install fastmcp
```

### Start the server

**Linux / macOS:**
```bash
python3 mcp/server.py
```

**Windows:**
```cmd
python mcp\server.py
```

The MCP server is also auto-started by Claude Code when `mcp.json` is present in the project root.

---

## Platform Notes

### Windows

- Use `node dist/integrator.js` (same as Linux/macOS — Node.js handles path separators)
- Replace `python3` with `python` in all commands
- If `npx tsc` is not found, run `npm install` first or use `.\node_modules\.bin\tsc`
- The `shared/` directories are created automatically on first run

### macOS

- If `python3` is not installed, run `brew install python`
- If the `npm` command is not found after installing Node.js, restart your terminal

### Linux

- On Ubuntu/Debian, install Node.js via `nvm` or the [NodeSource repo](https://github.com/nodesource/distributions) to get version 18+
- `python3` is typically pre-installed; install `pip3` with `sudo apt install python3-pip`

---

## Full Demo Sequence

Run these commands in order to go from a clean checkout to a fully working demo:

```bash
# 1. Install dependencies
npm install

# 2. Compile TypeScript
npx tsc

# 3. Run the pipeline
node dist/integrator.js

# 4. Check a result
cat shared/results/TXN001.json

# 5. Check the audit log
cat shared/logs/audit.log

# 6. Run tests with coverage
npm run test:coverage

# 7. Start the API server (in a separate terminal)
node dist/server.js

# 8. Query a result via curl
curl http://localhost:3000/status/TXN001
curl http://localhost:3000/results
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module 'dist/integrator.js'` | Run `npx tsc` first |
| `Error: Cannot find module 'big.js'` | Run `npm install` |
| `No tests found` | Make sure you're in the `homework-6/` directory |
| `EACCES: permission denied` on `shared/` | Run `mkdir -p shared/results shared/logs` manually |
| `python3: command not found` (Windows) | Use `python` instead of `python3` |
| Port 3000 already in use | Set a different port: `PORT=8080 node dist/server.js` |
