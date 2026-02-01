import { Category, Priority, Status, Source, DeviceType } from '../types';

export const CATEGORIES = Object.values(Category);
export const PRIORITIES = Object.values(Priority);
export const STATUSES = Object.values(Status);
export const SOURCES = Object.values(Source);
export const DEVICE_TYPES = Object.values(DeviceType);

export const SUBJECT_MIN_LENGTH = 1;
export const SUBJECT_MAX_LENGTH = 200;
export const DESCRIPTION_MIN_LENGTH = 10;
export const DESCRIPTION_MAX_LENGTH = 2000;

export const DEFAULT_PORT = 3000;

// Category keywords mapping for auto-classification
export const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  [Category.ACCOUNT_ACCESS]: [
    'login', 'password', 'reset password', 'forgot password', "can't login",
    'cannot login', 'locked out', 'account locked', '2fa', 'two-factor',
    'authentication', 'sign in', 'signin', 'log in', 'access denied',
    'unauthorized', 'permission denied', 'credentials', 'username'
  ],
  [Category.TECHNICAL_ISSUE]: [
    'bug', 'error', 'crash', 'not working', 'broken', 'issue', 'problem',
    'fail', 'failed', 'failure', 'exception', 'glitch', 'malfunction',
    'slow', 'timeout', 'unresponsive', 'freeze', 'hang', '500 error',
    '404 error', 'server error', 'loading'
  ],
  [Category.BILLING_QUESTION]: [
    'payment', 'invoice', 'refund', 'charge', 'billing', 'subscription',
    'cancel subscription', 'upgrade', 'downgrade', 'plan', 'pricing',
    'receipt', 'transaction', 'credit card', 'bank', 'money', 'cost',
    'fee', 'discount', 'coupon', 'promo'
  ],
  [Category.FEATURE_REQUEST]: [
    'feature', 'request', 'suggestion', 'enhancement', 'improve',
    'would be nice', 'would like', 'wish', 'idea', 'propose', 'add',
    'new feature', 'capability', 'functionality', 'could you add'
  ],
  [Category.BUG_REPORT]: [
    'bug', 'defect', 'reproduce', 'steps to reproduce', 'regression',
    'unexpected behavior', 'expected', 'actual', 'should', 'instead',
    'broken feature', 'not as expected', 'wrong behavior'
  ],
  [Category.OTHER]: []
};

// Priority keywords mapping for auto-classification
export const PRIORITY_KEYWORDS: Record<Priority, string[]> = {
  [Priority.URGENT]: [
    'urgent', 'critical', 'emergency', 'asap', 'immediately', 'production down',
    'security', 'security breach', 'data loss', "can't access", 'cannot access',
    'completely broken', 'site down', 'service down', 'outage', 'blocked completely'
  ],
  [Priority.HIGH]: [
    'important', 'high priority', 'blocking', 'blocker', 'severe',
    'major', 'significant', 'need help now', 'affecting multiple',
    'business critical', 'deadline', 'time sensitive'
  ],
  [Priority.MEDIUM]: [],
  [Priority.LOW]: [
    'minor', 'cosmetic', 'low priority', 'when you have time', 'not urgent',
    'nice to have', 'suggestion', 'small issue', 'trivial', 'enhancement',
    'future', 'eventually', 'no rush'
  ]
};
