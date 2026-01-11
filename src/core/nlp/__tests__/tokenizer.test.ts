import { describe, it, expect } from 'vitest';
import { Tokenizer, POS } from '../tokenizer';

describe('Tokenizer', () => {
  const tokenizer = new Tokenizer();

  describe('tokenize', () => {
    it('should tokenize Chinese text correctly', () => {
      const result = tokenizer.tokenize('生成本月考勤表');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(t => t.word === '生成')).toBe(true);
      expect(result.some(t => t.word === '本月')).toBe(true);
      expect(result.some(t => t.word === '考勤表')).toBe(true);
    });

    it('should handle date patterns', () => {
      const result = tokenizer.tokenize('2024年1月的考勤');
      expect(result.some(t => t.word.includes('2024'))).toBe(true);
    });

    it('should handle department names', () => {
      const result = tokenizer.tokenize('技术部的考勤表');
      expect(result.some(t => t.word === '考勤表')).toBe(true);
    });

    it('should handle empty input', () => {
      const result = tokenizer.tokenize('');
      expect(result).toEqual([]);
    });

    it('should handle mixed Chinese and numbers', () => {
      const result = tokenizer.tokenize('生成12月考勤表');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(t => t.word === '12')).toBe(true);
    });

    it('should assign correct POS tags', () => {
      const result = tokenizer.tokenize('生成考勤表');
      const verbToken = result.find(t => t.word === '生成');
      const nounToken = result.find(t => t.word === '考勤表');

      expect(verbToken?.pos).toBe(POS.VERB);
      expect(nounToken?.pos).toBe(POS.NOUN);
    });
  });

  describe('tokenizeAndFilter', () => {
    it('should filter stop words', () => {
      const result = tokenizer.tokenizeAndFilter('生成一个考勤表');
      expect(result.some(t => t.word === '一个')).toBe(false);
      expect(result.some(t => t.word === '的')).toBe(false);
    });
  });

  describe('getKeywords', () => {
    it('should extract keywords', () => {
      const result = tokenizer.getKeywords('生成本月考勤表');
      expect(result).toContain('生成');
      expect(result).toContain('本月');
      expect(result).toContain('考勤表');
    });
  });

  describe('extractNounPhrases', () => {
    it('should extract noun phrases', () => {
      const result = tokenizer.extractNounPhrases('详细考勤表');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('containsPOS', () => {
    it('should detect verb presence', () => {
      expect(tokenizer.containsPOS('生成考勤表', POS.VERB)).toBe(true);
      expect(tokenizer.containsPOS('考勤表', POS.VERB)).toBe(false);
    });

    it('should detect noun presence', () => {
      expect(tokenizer.containsPOS('考勤表', POS.NOUN)).toBe(true);
    });
  });

  describe('getWordsByPOS', () => {
    it('should get words by POS', () => {
      const verbs = tokenizer.getWordsByPOS('生成并导出考勤表', POS.VERB);
      expect(verbs).toContain('生成');
      expect(verbs).toContain('导出');
    });
  });
});
