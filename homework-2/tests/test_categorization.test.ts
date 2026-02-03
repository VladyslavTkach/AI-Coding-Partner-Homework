import { classifyCategory } from '../src/classifiers/categoryClassifier';
import { classifyPriority } from '../src/classifiers/priorityClassifier';
import { matchKeywords, normalizeText, calculateConfidence } from '../src/classifiers/keywordMatcher';
import { Category, Priority } from '../src/types';

describe('Category Classifier', () => {
  // CAT-01: Account access keywords
  it('should classify as account_access for login/password keywords', () => {
    const result = classifyCategory({
      subject: "Can't login to my account",
      description: 'Password reset not working. I am locked out of my account.'
    });

    expect(result.category).toBe(Category.ACCOUNT_ACCESS);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.keywords_found.length).toBeGreaterThan(0);
    expect(result.reasoning).toContain('account_access');
  });

  // CAT-02: Technical issue keywords
  it('should classify as technical_issue for error/crash keywords', () => {
    const result = classifyCategory({
      subject: 'Application crashes on startup',
      description: 'Getting an error message and the app keeps crashing. It is not working at all.'
    });

    expect(result.category).toBe(Category.TECHNICAL_ISSUE);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.keywords_found.length).toBeGreaterThan(0);
  });

  // CAT-03: Billing question keywords
  it('should classify as billing_question for invoice/payment keywords', () => {
    const result = classifyCategory({
      subject: 'Question about my invoice',
      description: 'I need a refund for the incorrect charge on my account. The payment was wrong.'
    });

    expect(result.category).toBe(Category.BILLING_QUESTION);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.keywords_found.length).toBeGreaterThan(0);
  });

  // CAT-04: Feature request keywords
  it('should classify as feature_request for suggestion/enhancement keywords', () => {
    const result = classifyCategory({
      subject: 'Feature suggestion for the app',
      description: 'I would like to propose a new feature. It would be nice if you could add dark mode.'
    });

    expect(result.category).toBe(Category.FEATURE_REQUEST);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.keywords_found.length).toBeGreaterThan(0);
  });

  // CAT-05: Bug report keywords
  it('should classify as bug_report for bug/reproduce keywords', () => {
    const result = classifyCategory({
      subject: 'Bug in the checkout process',
      description: 'I found a bug that I can reproduce. Expected behavior is different from actual behavior.'
    });

    expect(result.category).toBe(Category.BUG_REPORT);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.keywords_found.length).toBeGreaterThan(0);
  });

  // CAT-06: No matching keywords defaults to other
  it('should classify as other when no keywords match', () => {
    const result = classifyCategory({
      subject: 'General inquiry',
      description: 'I have a general question about your services and offerings.'
    });

    expect(result.category).toBe(Category.OTHER);
    expect(result.confidence).toBe(0.3);
    expect(result.keywords_found).toHaveLength(0);
    expect(result.reasoning).toContain('No specific keywords');
  });

  describe('Category Confidence Levels', () => {
    it('should have high confidence with multiple matching keywords', () => {
      const result = classifyCategory({
        subject: 'Cannot login - password reset needed',
        description: 'Locked out of account. Authentication failed. Access denied. Credentials not working.'
      });

      expect(result.category).toBe(Category.ACCOUNT_ACCESS);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should have moderate confidence with few matching keywords', () => {
      const result = classifyCategory({
        subject: 'Login issue',
        description: 'Having some problems with accessing the system.'
      });

      expect(result.category).toBe(Category.ACCOUNT_ACCESS);
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
    });
  });
});

describe('Priority Classifier', () => {
  // PRI-01: Urgent keywords
  it('should classify as urgent for critical/emergency keywords', () => {
    const result = classifyPriority({
      subject: 'CRITICAL: Production down!',
      description: 'This is an emergency. We need help ASAP. Our production system is completely down.'
    });

    expect(result.priority).toBe(Priority.URGENT);
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.keywords_found.length).toBeGreaterThan(0);
  });

  // PRI-02: High priority keywords
  it('should classify as high for important/blocking keywords', () => {
    const result = classifyPriority({
      subject: 'Important: Blocking issue',
      description: 'This is a severe blocker affecting our business. Need help by the deadline.'
    });

    expect(result.priority).toBe(Priority.HIGH);
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.keywords_found.length).toBeGreaterThan(0);
  });

  // PRI-03: Low priority keywords
  it('should classify as low for minor/no-rush keywords', () => {
    const result = classifyPriority({
      subject: 'Minor cosmetic issue',
      description: 'When you have time, could you look at this? No rush, its just a small issue.'
    });

    expect(result.priority).toBe(Priority.LOW);
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.keywords_found.length).toBeGreaterThan(0);
  });

  // PRI-04: No keywords defaults to medium
  it('should classify as medium when no priority keywords match', () => {
    const result = classifyPriority({
      subject: 'General question',
      description: 'I have a question about your product functionality.'
    });

    expect(result.priority).toBe(Priority.MEDIUM);
    expect(result.confidence).toBe(0.5);
    expect(result.keywords_found).toHaveLength(0);
    expect(result.reasoning).toContain('No priority keywords');
  });

  describe('Priority Reasoning Messages', () => {
    it('should include urgent reasoning for urgent priority', () => {
      const result = classifyPriority({
        subject: 'Critical system failure',
        description: 'Production is down'
      });

      expect(result.reasoning).toContain('Urgent priority');
      expect(result.reasoning).toContain('Immediate attention');
    });

    it('should include high reasoning for high priority', () => {
      const result = classifyPriority({
        subject: 'Important blocker',
        description: 'Blocking our work'
      });

      expect(result.reasoning).toContain('High priority');
      expect(result.reasoning).toContain('should be addressed soon');
    });

    it('should include low reasoning for low priority', () => {
      const result = classifyPriority({
        subject: 'Minor issue',
        description: 'When you have time'
      });

      expect(result.reasoning).toContain('Low priority');
      expect(result.reasoning).toContain('when time permits');
    });
  });
});

describe('Keyword Matcher', () => {
  describe('normalizeText', () => {
    it('should convert to lowercase', () => {
      expect(normalizeText('HELLO WORLD')).toBe('hello world');
    });

    it('should remove special characters', () => {
      expect(normalizeText('hello! world?')).toBe('hello world');
    });

    it('should preserve apostrophes in contractions', () => {
      expect(normalizeText("can't won't")).toBe("can't won't");
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeText('hello    world')).toBe('hello world');
    });

    it('should trim whitespace', () => {
      expect(normalizeText('  hello world  ')).toBe('hello world');
    });
  });

  describe('matchKeywords', () => {
    it('should find matching keywords', () => {
      const result = matchKeywords('I cannot login to my account', ['login', 'account']);

      expect(result.matched_keywords).toContain('login');
      expect(result.matched_keywords).toContain('account');
      expect(result.match_count).toBe(2);
    });

    it('should be case insensitive', () => {
      const result = matchKeywords('LOGIN PROBLEM', ['login', 'problem']);

      expect(result.matched_keywords).toContain('login');
      expect(result.matched_keywords).toContain('problem');
    });

    it('should match multi-word keywords', () => {
      const result = matchKeywords("I can't login to the system", ["can't login"]);

      expect(result.matched_keywords).toContain("can't login");
      expect(result.match_count).toBe(1);
    });

    it('should not match partial words', () => {
      const result = matchKeywords('logging is important', ['log', 'login']);

      // Should not match 'log' in 'logging'
      expect(result.matched_keywords).not.toContain('log');
    });

    it('should return empty for no matches', () => {
      const result = matchKeywords('hello world', ['login', 'password']);

      expect(result.matched_keywords).toHaveLength(0);
      expect(result.match_count).toBe(0);
    });

    it('should calculate match density', () => {
      const result = matchKeywords('short text with login', ['login']);

      expect(result.match_density).toBeGreaterThan(0);
      expect(result.text_length).toBeGreaterThan(0);
    });
  });

  describe('calculateConfidence', () => {
    it('should return 0 for no matches', () => {
      const result = calculateConfidence({
        matched_keywords: [],
        match_count: 0,
        text_length: 100,
        match_density: 0
      });

      expect(result).toBe(0);
    });

    it('should increase confidence with more matches', () => {
      const result1 = calculateConfidence({
        matched_keywords: ['login'],
        match_count: 1,
        text_length: 100,
        match_density: 0.01
      });

      const result2 = calculateConfidence({
        matched_keywords: ['login', 'password', 'account'],
        match_count: 3,
        text_length: 100,
        match_density: 0.03
      });

      expect(result2).toBeGreaterThan(result1);
    });

    it('should cap confidence at 1', () => {
      const result = calculateConfidence({
        matched_keywords: Array(10).fill('keyword'),
        match_count: 10,
        text_length: 100,
        match_density: 0.1
      });

      expect(result).toBeLessThanOrEqual(1);
    });
  });
});
