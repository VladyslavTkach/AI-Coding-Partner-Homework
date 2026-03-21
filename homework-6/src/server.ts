import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const RESULTS_DIR = path.resolve('shared/results');

export const app = express();
app.use(express.json());

function isSafeId(id: string): boolean {
  return !id.includes('..') && !id.includes('/') && !id.includes('\\');
}

app.get('/status/:transaction_id', (req: Request, res: Response) => {
  const txId = req.params.transaction_id;

  if (!isSafeId(txId)) {
    res.status(400).json({ error: 'INVALID_ID' });
    return;
  }

  const filePath = path.join(RESULTS_DIR, `${txId}.json`);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'NOT_FOUND' });
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.status(200).json(data);
  } catch {
    res.status(500).json({ error: 'READ_ERROR' });
  }
});

app.get('/results', (_req: Request, res: Response) => {
  if (!fs.existsSync(RESULTS_DIR)) {
    res.status(200).json([]);
    return;
  }

  try {
    const files = fs
      .readdirSync(RESULTS_DIR)
      .filter((f) => f.endsWith('.json'));
    const results = files.map((f) => {
      const raw = fs.readFileSync(path.join(RESULTS_DIR, f), 'utf-8');
      return JSON.parse(raw);
    });
    res.status(200).json(results);
  } catch {
    res.status(500).json({ error: 'READ_ERROR' });
  }
});

if (require.main === module) {
  const port = process.env.PORT ?? 3000;
  app.listen(port, () => {
    console.log(`[Server] Listening on port ${port}`);
  });
}
