import Big from 'big.js';
import { Message, AgentLogEntry } from '../types';

const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY'];

function maskAccount(account: string): string {
  if (account.length <= 4) return '****';
  return '****' + account.slice(-4);
}

export async function processMessage(message: Message): Promise<Message> {
  const log: AgentLogEntry[] = message.agent_log ?? [];
  const txId = message.transaction?.transaction_id ?? 'UNKNOWN';

  try {
    const tx = message.transaction;
    const requiredFields: (keyof typeof tx)[] = [
      'transaction_id',
      'amount',
      'currency',
      'source_account',
      'destination_account',
      'timestamp',
    ];

    for (const field of requiredFields) {
      const value = tx[field];
      if (value === undefined || value === null || String(value).trim() === '') {
        const entry: AgentLogEntry = {
          timestamp: new Date().toISOString(),
          agentName: 'TransactionValidator',
          transactionId: txId,
          outcome: `rejected: MISSING_FIELD: ${field}`,
        };
        return {
          ...message,
          status: 'rejected',
          reason: `MISSING_FIELD: ${field}`,
          agent_log: [...log, entry],
        };
      }
    }

    let amount: Big;
    try {
      amount = new Big(tx.amount);
    } catch {
      const entry: AgentLogEntry = {
        timestamp: new Date().toISOString(),
        agentName: 'TransactionValidator',
        transactionId: txId,
        outcome: 'rejected: INVALID_AMOUNT',
      };
      return {
        ...message,
        status: 'rejected',
        reason: 'INVALID_AMOUNT',
        agent_log: [...log, entry],
      };
    }

    if (amount.lte(0)) {
      const entry: AgentLogEntry = {
        timestamp: new Date().toISOString(),
        agentName: 'TransactionValidator',
        transactionId: txId,
        outcome: 'rejected: INVALID_AMOUNT',
      };
      return {
        ...message,
        status: 'rejected',
        reason: 'INVALID_AMOUNT',
        agent_log: [...log, entry],
      };
    }

    if (!VALID_CURRENCIES.includes(tx.currency)) {
      const entry: AgentLogEntry = {
        timestamp: new Date().toISOString(),
        agentName: 'TransactionValidator',
        transactionId: txId,
        outcome: 'rejected: INVALID_CURRENCY',
      };
      return {
        ...message,
        status: 'rejected',
        reason: 'INVALID_CURRENCY',
        agent_log: [...log, entry],
      };
    }

    const maskedSrc = maskAccount(tx.source_account);
    const maskedDst = maskAccount(tx.destination_account);
    console.log(
      `[TransactionValidator] ${txId} src=${maskedSrc} dst=${maskedDst} → validated`
    );

    const entry: AgentLogEntry = {
      timestamp: new Date().toISOString(),
      agentName: 'TransactionValidator',
      transactionId: txId,
      outcome: 'validated',
    };

    return {
      ...message,
      status: 'validated',
      agent_log: [...log, entry],
    };
  } catch (err) {
    const entry: AgentLogEntry = {
      timestamp: new Date().toISOString(),
      agentName: 'TransactionValidator',
      transactionId: txId,
      outcome: `rejected: INTERNAL_ERROR`,
    };
    console.error(`[TransactionValidator] Unexpected error for ${txId}:`, err);
    return {
      ...message,
      status: 'rejected',
      reason: 'INTERNAL_ERROR',
      agent_log: [...log, entry],
    };
  }
}
