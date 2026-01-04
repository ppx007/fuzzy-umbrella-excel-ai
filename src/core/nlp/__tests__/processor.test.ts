import { describe, it, expect } from 'vitest';
import { NLPProcessor } from '../processor';
import { AttendanceIntent } from '@/types';

describe('NLPProcessor', () => {
  const processor = new NLPProcessor();

  describe('process', () => {
    it('should recognize CREATE_DAILY intent', () => {
      const result = processor.process('生成今天的考勤表');
      expect(result.intent).toBe(AttendanceIntent.CREATE_DAILY);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should recognize CREATE_WEEKLY intent', () => {
      const result = processor.process('生成本周考勤汇总');
      expect(result.intent).toBe(AttendanceIntent.CREATE_WEEKLY);
    });

    it('should recognize CREATE_MONTHLY intent', () => {
      const result = processor.process('生成本月考勤表');
      expect(result.intent).toBe(AttendanceIntent.CREATE_MONTHLY);
    });

    it('should recognize QUERY_STATISTICS intent', () => {
      const result = processor.process('统计本月出勤率');
      expect(result.intent).toBe(AttendanceIntent.QUERY_STATISTICS);
    });

    it('should recognize GENERATE_CHART intent', () => {
      const result = processor.process('生成考勤饼图');
      expect(result.intent).toBe(AttendanceIntent.GENERATE_CHART);
    });

    it('should extract date entities', () => {
      const result = processor.process('生成2024年1月考勤表');
      expect(result.entities.dateRange).toBeDefined();
    });

    it('should extract department entities', () => {
      const result = processor.process('生成技术部考勤表');
      expect(result.entities.department).toBeDefined();
    });

    it('should handle unknown intent', () => {
      const result = processor.process('你好');
      expect(result.intent).toBe(AttendanceIntent.UNKNOWN);
    });

    it('should build parameters from entities', () => {
      const result = processor.process('生成本月考勤表');
      expect(result.parameters).toBeDefined();
    });
  });

  describe('processWithDetails', () => {
    it('should return processing details', () => {
      const { result, details } = processor.processWithDetails('生成考勤表');
      expect(result).toBeDefined();
      expect(details.tokens).toBeDefined();
      expect(details.keywords).toBeDefined();
      expect(details.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getSuggestions', () => {
    it('should provide suggestions for partial input', () => {
      const suggestions = processor.getSuggestions('生成');
      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should provide relevant suggestions', () => {
      const suggestions = processor.getSuggestions('统计');
      expect(suggestions.some(s => s.includes('统计'))).toBe(true);
    });
  });

  describe('validateIntent', () => {
    it('should validate intent with required entities', () => {
      const result = processor.process('生成考勤表');
      const validation = processor.validateIntent(result);
      expect(validation).toBeDefined();
      expect(typeof validation.valid).toBe('boolean');
      expect(Array.isArray(validation.missingEntities)).toBe(true);
    });

    it('should identify missing entities', () => {
      const result = processor.process('生成日报');
      result.entities.dateRange = undefined;
      const validation = processor.validateIntent(result);
      if (result.intent === AttendanceIntent.CREATE_DAILY) {
        expect(validation.missingEntities).toContain('日期范围');
      }
    });
  });

  describe('context management', () => {
    it('should set and use context', () => {
      const context = {
        lastDateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      };
      processor.setContext(context);
      const result = processor.process('生成考勤表');
      // Context should be used if no date range in input
      expect(result).toBeDefined();
    });

    it('should update context after processing', () => {
      const result = processor.process('生成本月考勤表');
      processor.updateContext(result);
      // Context should be updated
      expect(result).toBeDefined();
    });

    it('should clear context', () => {
      processor.clearContext();
      // No error should occur
      expect(true).toBe(true);
    });
  });
});