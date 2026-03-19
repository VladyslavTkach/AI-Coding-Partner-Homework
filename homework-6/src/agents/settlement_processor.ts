import fs from 'fs';
import path from 'path';
import { Message, AgentLogEntry } from '../types';

const RESULTS_DIR = path.resolve('shared/results');

function maskAccount(account: string): string {
  if (account.length <= 4) return '****';
  return '****' + account.slice(-4);
}

export async function processMessage(message: Message): Promise<Message> {
  const log: AgentLogEntry[] = message.agent_log ?? [];
  const txId = message.transaction?.transaction_id ?? 'UNKNOWN';
  let result = { ...message };

  try {
    if (message.status === 'rejected') {
      result = { ...message, status: 'declined' };
    } else if (message.fraud_risk === 'HIGH') {
      result = { ...message, status: 'declined', reason: 'HIGH_FRAUD_RISK' };
    } else {
      result = { ...message, status: 'settled' };
    }

    const outcome =
      result.status === 'settled'
        ? 'settled'
        : `declined: ${result.reason ?? 'unknown'}`;

    const maskedSrc = maskAccount(message.transaction.source_account);
    console.log(
      `[SettlementProcessor] ${txId} src=${maskedSrc} → ${outcome}`
    );

    const entry: AgentLogEntry = {
      timestamp: new Date().toISOString(),
      agentName: 'SettlementProcessor',
      transactionId: txId,
      outcome,
    };

    result = { ...result, agent_log: [...log, entry] };
  } catch (err) {
    console.error(`[SettlementProcessor] Unexpected error for ${txId}:`, err);
    const entry: AgentLogEntry = {
      timestamp: new Date().toISOString(),
      agentName: 'SettlementProcessor',
      transactionId: txId,
      outcome: 'declined: INTERNAL_ERROR',
    };
    result = {
      ...message,
      status: 'declined',
      reason: 'INTERNAL_ERROR',
      agent_log: [...log, entry],
    };
  }

  try {
    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }
    const filePath = path.join(RESULTS_DIR, `${txId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
  } catch (writeErr) {
    console.error(
      `[SettlementProcessor] Failed to write result for ${txId}:`,
      writeErr
    );
  }

  return result;
}
