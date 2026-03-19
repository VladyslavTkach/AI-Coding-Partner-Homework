import fs from 'fs';
import path from 'path';
import { Transaction, Message } from './types';
import * as transactionValidator from './agents/transaction_validator';
import * as fraudDetector from './agents/fraud_detector';
import * as settlementProcessor from './agents/settlement_processor';

const AUDIT_LOG_DIR = path.resolve('shared/logs');
const AUDIT_LOG_FILE = path.join(AUDIT_LOG_DIR, 'audit.log');
const TRANSACTIONS_FILE = path.resolve('sample-transactions.json');

function ensureAuditDir(): void {
  if (!fs.existsSync(AUDIT_LOG_DIR)) {
    fs.mkdirSync(AUDIT_LOG_DIR, { recursive: true });
  }
}

function appendAuditLog(entries: NonNullable<Message['agent_log']>): void {
  ensureAuditDir();
  const lines = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
  fs.appendFileSync(AUDIT_LOG_FILE, lines, 'utf-8');
}

export async function runPipeline(): Promise<void> {
  const raw = fs.readFileSync(TRANSACTIONS_FILE, 'utf-8');
  const transactions: Transaction[] = JSON.parse(raw);

  let settled = 0;
  let declined = 0;

  for (const transaction of transactions) {
    try {
      let message: Message = {
        transaction,
        status: 'pending',
        agent_log: [],
      };

      message = await transactionValidator.processMessage(message);
      message = await fraudDetector.processMessage(message);
      message = await settlementProcessor.processMessage(message);

      if (message.agent_log && message.agent_log.length > 0) {
        appendAuditLog(message.agent_log);
      }

      if (message.status === 'settled') {
        settled++;
      } else {
        declined++;
      }
    } catch (err) {
      console.error(
        `[Integrator] Fatal error processing ${transaction.transaction_id}:`,
        err
      );
      declined++;
    }
  }

  const total = settled + declined;
  console.log('\n========== Pipeline Summary ==========');
  console.log(`Total processed : ${total}`);
  console.log(`Settled         : ${settled}`);
  console.log(`Declined        : ${declined}`);
  console.log('======================================\n');
}

if (require.main === module) {
  runPipeline().catch((err) => {
    console.error('[Integrator] Pipeline failed:', err);
    process.exit(1);
  });
}
