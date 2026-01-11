import { describe, it, expect } from 'vitest';
import {
  createValidationResult,
  mergeValidationResults,
  validateRequired,
  validateStringLength,
  validateNumberRange,
  validateDate,
  validateDateRange,
  validateTimeFormat,
  validateEmail,
  validatePhone,
  validateArrayNotEmpty,
  validateFileType,
  validateFileSize,
  validateEmployeeData,
  validateAttendanceRecord,
} from '../validation';

describe('Validation Utils', () => {
  describe('createValidationResult', () => {
    it('should create valid result with no errors', () => {
      const result = createValidationResult();
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should create invalid result with errors', () => {
      const result = createValidationResult(['Error 1', 'Error 2']);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
    });

    it('should include warnings', () => {
      const result = createValidationResult([], ['Warning 1']);
      expect(result.valid).toBe(true);
      expect(result.warnings?.length).toBe(1);
    });
  });

  describe('mergeValidationResults', () => {
    it('should merge multiple results', () => {
      const result1 = createValidationResult(['Error 1']);
      const result2 = createValidationResult(['Error 2']);
      const merged = mergeValidationResults(result1, result2);
      expect(merged.valid).toBe(false);
      expect(merged.errors.length).toBe(2);
    });

    it('should merge warnings', () => {
      const result1 = createValidationResult([], ['Warning 1']);
      const result2 = createValidationResult([], ['Warning 2']);
      const merged = mergeValidationResults(result1, result2);
      expect(merged.valid).toBe(true);
      expect(merged.warnings?.length).toBe(2);
    });
  });

  describe('validateRequired', () => {
    it('should pass for non-empty value', () => {
      const result = validateRequired('value', '字段');
      expect(result.valid).toBe(true);
    });

    it('should fail for empty string', () => {
      const result = validateRequired('', '字段');
      expect(result.valid).toBe(false);
    });

    it('should fail for null', () => {
      const result = validateRequired(null, '字段');
      expect(result.valid).toBe(false);
    });

    it('should fail for undefined', () => {
      const result = validateRequired(undefined, '字段');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateStringLength', () => {
    it('should pass for valid length', () => {
      const result = validateStringLength('test', '字段', 2, 10);
      expect(result.valid).toBe(true);
    });

    it('should fail for too short', () => {
      const result = validateStringLength('a', '字段', 2, 10);
      expect(result.valid).toBe(false);
    });

    it('should fail for too long', () => {
      const result = validateStringLength('this is too long', '字段', 2, 10);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateNumberRange', () => {
    it('should pass for valid number', () => {
      const result = validateNumberRange(5, '数字', 1, 10);
      expect(result.valid).toBe(true);
    });

    it('should fail for too small', () => {
      const result = validateNumberRange(0, '数字', 1, 10);
      expect(result.valid).toBe(false);
    });

    it('should fail for too large', () => {
      const result = validateNumberRange(15, '数字', 1, 10);
      expect(result.valid).toBe(false);
    });

    it('should fail for NaN', () => {
      const result = validateNumberRange(NaN, '数字', 1, 10);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should pass for valid date', () => {
      const result = validateDate(new Date('2024-01-15'), '日期');
      expect(result.valid).toBe(true);
    });

    it('should pass for valid date string', () => {
      const result = validateDate('2024-01-15', '日期');
      expect(result.valid).toBe(true);
    });

    it('should fail for null', () => {
      const result = validateDate(null, '日期');
      expect(result.valid).toBe(false);
    });

    it('should fail for invalid date string', () => {
      const result = validateDate('invalid', '日期');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateDateRange', () => {
    it('should pass for valid range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      const result = validateDateRange(start, end);
      expect(result.valid).toBe(true);
    });

    it('should fail when end is before start', () => {
      const start = new Date('2024-01-31');
      const end = new Date('2024-01-01');
      const result = validateDateRange(start, end);
      expect(result.valid).toBe(false);
    });

    it('should pass for same day', () => {
      const date = new Date('2024-01-15');
      const result = validateDateRange(date, date);
      expect(result.valid).toBe(true);
    });

    it('should warn for large range', () => {
      const start = new Date('2023-01-01');
      const end = new Date('2024-12-31');
      const result = validateDateRange(start, end);
      expect(result.warnings?.length).toBeGreaterThan(0);
    });
  });

  describe('validateTimeFormat', () => {
    it('should pass for valid time', () => {
      const result = validateTimeFormat('09:00', '时间');
      expect(result.valid).toBe(true);
    });

    it('should pass for 24-hour format', () => {
      const result = validateTimeFormat('23:59', '时间');
      expect(result.valid).toBe(true);
    });

    it('should fail for invalid format', () => {
      const result = validateTimeFormat('25:00', '时间');
      expect(result.valid).toBe(false);
    });

    it('should fail for non-time string', () => {
      const result = validateTimeFormat('invalid', '时间');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should pass for valid email', () => {
      const result = validateEmail('test@example.com');
      expect(result.valid).toBe(true);
    });

    it('should fail for invalid email', () => {
      const result = validateEmail('invalid');
      expect(result.valid).toBe(false);
    });

    it('should fail for email without domain', () => {
      const result = validateEmail('test@');
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should pass for valid phone', () => {
      const result = validatePhone('13800138000');
      expect(result.valid).toBe(true);
    });

    it('should fail for invalid phone', () => {
      const result = validatePhone('1234567');
      expect(result.valid).toBe(false);
    });

    it('should fail for non-numeric', () => {
      const result = validatePhone('abc');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateArrayNotEmpty', () => {
    it('should pass for non-empty array', () => {
      const result = validateArrayNotEmpty([1, 2, 3], '数组');
      expect(result.valid).toBe(true);
    });

    it('should fail for empty array', () => {
      const result = validateArrayNotEmpty([], '数组');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateFileType', () => {
    it('should pass for allowed extension', () => {
      const result = validateFileType('test.xlsx', ['xlsx', 'csv']);
      expect(result.valid).toBe(true);
    });

    it('should fail for disallowed extension', () => {
      const result = validateFileType('test.exe', ['xlsx', 'csv']);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('should pass for small file', () => {
      const result = validateFileSize(1024 * 1024, 10); // 1MB, max 10MB
      expect(result.valid).toBe(true);
    });

    it('should fail for large file', () => {
      const result = validateFileSize(20 * 1024 * 1024, 10); // 20MB, max 10MB
      expect(result.valid).toBe(false);
    });

    it('should warn for file near limit', () => {
      const result = validateFileSize(9 * 1024 * 1024, 10); // 9MB, max 10MB
      expect(result.warnings?.length).toBeGreaterThan(0);
    });
  });

  describe('validateEmployeeData', () => {
    it('should pass for valid employee data', () => {
      const result = validateEmployeeData({
        name: '张三',
        employeeNo: 'E001',
        department: '技术部',
      });
      expect(result.valid).toBe(true);
    });

    it('should fail for empty name', () => {
      const result = validateEmployeeData({
        name: '',
        employeeNo: 'E001',
      });
      expect(result.valid).toBe(false);
    });

    it('should validate email if provided', () => {
      const result = validateEmployeeData({
        name: '张三',
        email: 'invalid',
      });
      expect(result.valid).toBe(false);
    });

    it('should validate phone if provided', () => {
      const result = validateEmployeeData({
        name: '张三',
        phone: '123',
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateAttendanceRecord', () => {
    it('should pass for valid record', () => {
      const result = validateAttendanceRecord({
        employeeId: 'E001',
        date: new Date('2024-01-15'),
        checkInTime: '09:00',
        checkOutTime: '18:00',
      });
      expect(result.valid).toBe(true);
    });

    it('should fail for missing employeeId', () => {
      const result = validateAttendanceRecord({
        date: new Date('2024-01-15'),
      });
      expect(result.valid).toBe(false);
    });

    it('should validate time format', () => {
      const result = validateAttendanceRecord({
        employeeId: 'E001',
        date: new Date('2024-01-15'),
        checkInTime: 'invalid',
      });
      expect(result.valid).toBe(false);
    });
  });
});
