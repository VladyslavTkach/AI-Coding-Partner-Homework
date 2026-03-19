export interface Transaction {
  transaction_id: string;
  amount: string;
  currency: string;
  source_account: string;
  destination_account: string;
  timestamp: string;
  cross_border?: boolean;
}

export interface AgentLogEntry {
  timestamp: string;
  agentName: string;
  transactionId: string;
  outcome: string;
}

export interface Message {
  transaction: Transaction;
  status: 'pending' | 'validated' | 'rejected' | 'settled' | 'declined';
  reason?: string;
  fraud_risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  fraud_risk_score?: number;
  agent_log?: AgentLogEntry[];
}

export interface AgentResult {
  message: Message;
  log: AgentLogEntry;
}
