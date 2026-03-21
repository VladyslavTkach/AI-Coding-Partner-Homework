import Big from 'big.js';
import { Message, AgentLogEntry } from '../types';

function maskAccount(account: string): string {
  if (account.length <= 4) return '****';
  return '****' + account.slice(-4);
}

function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score <= 2) return 'LOW';
  if (score <= 6) return 'MEDIUM';
  return 'HIGH';
}

export async function processMessage(message: Message): Promise<Message> {
  const log: AgentLogEntry[] = message.agent_log ?? [];
  const txId = message.transaction?.transaction_id ?? 'UNKNOWN';

  if (message.status === 'rejected') {
    return message;
  }

  try {
    const tx = message.transaction;
    const amount = new Big(tx.amount);
    let score = 0;

    if (amount.gt(50000)) {
      score += 4;
    } else if (amount.gt(10000)) {
      score += 3;
    } else if (amount.gt(1000)) {
      score += 1;
    }

    const hour = new Date(tx.timestamp).getUTCHours();
    if (hour >= 2 && hour <= 5) {
      score += 2;
    }

    if (tx.cross_border === true) {
      score += 1;
    }

    const risk = getRiskLevel(score);
    const maskedSrc = maskAccount(tx.source_account);
    console.log(
      `[FraudDetector] ${txId} src=${maskedSrc} score=${score} risk=${risk}`
    );

    const entry: AgentLogEntry = {
      timestamp: new Date().toISOString(),
      agentName: 'FraudDetector',
      transactionId: txId,
      outcome: `scored: ${risk} (${score})`,
    };

    return {
      ...message,
      fraud_risk_score: score,
      fraud_risk: risk,
      agent_log: [...log, entry],
    };
  } catch (err) {
    const entry: AgentLogEntry = {
      timestamp: new Date().toISOString(),
      agentName: 'FraudDetector',
      transactionId: txId,
      outcome: 'INTERNAL_ERROR',
    };
    console.error(`[FraudDetector] Unexpected error for ${txId}:`, err);
    return {
      ...message,
      agent_log: [...log, entry],
    };
  }
}
