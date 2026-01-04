import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDateTime,
  parseDate,
  getTodayRange,
  getThisWeekRange,
  getThisMonthRange,
  getLastMonthRange,
  getMonthRange,
  getWeekRange,
  getDatesInRange,
  getDaysBetween,
  getHoursBetween,
  getMinutesBetween,
  isWeekendDay,
  isWorkday,
  getWorkdaysCount,
  getWeekendsCount,
  isDateInRange,
  getWeekdayName,
  getWeekdayNumber,
  addDaysToDate,
  addWeeksToDate,
  addMonthsToDate,
  isSameDayDate,
  getMonthName,
  parseChineseDateDescription,
  calculateWorkHours,
  isLate,
  isEarlyLeave,
  calculateLateMinutes,
  calculateEarlyLeaveMinutes,
} from '../date';

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toBe('2024-01-15');
    });

    it('should format date with custom format', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date, 'yyyy年MM月dd日');
      expect(result).toBe('2024年01月15日');
    });

    it('should handle single digit month and day', () => {
      const date = new Date('2024-01-05');
      const result = formatDate(date);
      expect(result).toBe('2024-01-05');
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2024-01-15T09:30:00');
      const result = formatTime(date);
      expect(result).toBe('09:30');
    });

    it('should format time with custom format', () => {
      const date = new Date('2024-01-15T09:30:45');
      const result = formatTime(date, 'HH:mm:ss');
      expect(result).toBe('09:30:45');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const date = new Date('2024-01-15T09:30:00');
      const result = formatDateTime(date);
      expect(result).toContain('2024-01-15');
      expect(result).toContain('09:30');
    });
  });

  describe('parseDate', () => {
    it('should parse date string', () => {
      const result = parseDate('2024-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(15);
    });
  });

  describe('getTodayRange', () => {
    it('should return today range', () => {
      const range = getTodayRange();
      expect(range.start).toBeDefined();
      expect(range.end).toBeDefined();
      expect(isSameDayDate(range.start, range.end)).toBe(true);
    });
  });

  describe('getThisWeekRange', () => {
    it('should return this week range', () => {
      const range = getThisWeekRange();
      expect(range.start).toBeDefined();
      expect(range.end).toBeDefined();
      expect(getDaysBetween(range.start, range.end)).toBe(6);
    });
  });

  describe('getThisMonthRange', () => {
    it('should return this month range', () => {
      const range = getThisMonthRange();
      expect(range.start).toBeDefined();
      expect(range.end).toBeDefined();
      expect(range.start.getDate()).toBe(1);
    });
  });

  describe('getLastMonthRange', () => {
    it('should return last month range', () => {
      const range = getLastMonthRange();
      expect(range.start).toBeDefined();
      expect(range.end).toBeDefined();
      expect(range.start.getDate()).toBe(1);
    });
  });

  describe('getMonthRange', () => {
    it('should return month range for January', () => {
      const range = getMonthRange(2024, 1);
      expect(range.start.getDate()).toBe(1);
      expect(range.end.getDate()).toBe(31);
    });

    it('should return month range for February in leap year', () => {
      const range = getMonthRange(2024, 2);
      expect(range.start.getDate()).toBe(1);
      expect(range.end.getDate()).toBe(29);
    });
  });

  describe('getWeekRange', () => {
    it('should return week range', () => {
      const date = new Date('2024-01-15');
      const range = getWeekRange(date);
      expect(range.start).toBeDefined();
      expect(range.end).toBeDefined();
      expect(getDaysBetween(range.start, range.end)).toBe(6);
    });
  });

  describe('getDatesInRange', () => {
    it('should return all dates in range', () => {
      const range = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-05'),
      };
      const dates = getDatesInRange(range);
      expect(dates.length).toBe(5);
    });
  });

  describe('getDaysBetween', () => {
    it('should calculate difference in days', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-20');
      expect(getDaysBetween(date1, date2)).toBe(5);
    });
  });

  describe('getHoursBetween', () => {
    it('should calculate difference in hours', () => {
      const date1 = new Date('2024-01-15T09:00:00');
      const date2 = new Date('2024-01-15T18:00:00');
      expect(getHoursBetween(date1, date2)).toBe(9);
    });
  });

  describe('getMinutesBetween', () => {
    it('should calculate difference in minutes', () => {
      const date1 = new Date('2024-01-15T09:00:00');
      const date2 = new Date('2024-01-15T09:30:00');
      expect(getMinutesBetween(date1, date2)).toBe(30);
    });
  });

  describe('isWeekendDay', () => {
    it('should return true for Saturday', () => {
      const saturday = new Date('2024-01-13'); // Saturday
      expect(isWeekendDay(saturday)).toBe(true);
    });

    it('should return true for Sunday', () => {
      const sunday = new Date('2024-01-14'); // Sunday
      expect(isWeekendDay(sunday)).toBe(true);
    });

    it('should return false for weekday', () => {
      const monday = new Date('2024-01-15'); // Monday
      expect(isWeekendDay(monday)).toBe(false);
    });
  });

  describe('isWorkday', () => {
    it('should return true for weekday', () => {
      const monday = new Date('2024-01-15');
      expect(isWorkday(monday)).toBe(true);
    });

    it('should return false for weekend', () => {
      const saturday = new Date('2024-01-13');
      expect(isWorkday(saturday)).toBe(false);
    });

    it('should return false for holiday', () => {
      const holiday = new Date('2024-01-15');
      expect(isWorkday(holiday, [holiday])).toBe(false);
    });
  });

  describe('getWorkdaysCount', () => {
    it('should count workdays in range', () => {
      const range = {
        start: new Date('2024-01-15'), // Monday
        end: new Date('2024-01-21'), // Sunday
      };
      const count = getWorkdaysCount(range);
      expect(count).toBe(5);
    });
  });

  describe('getWeekendsCount', () => {
    it('should count weekends in range', () => {
      const range = {
        start: new Date('2024-01-15'), // Monday
        end: new Date('2024-01-21'), // Sunday
      };
      const count = getWeekendsCount(range);
      expect(count).toBe(2);
    });
  });

  describe('isDateInRange', () => {
    it('should return true for date in range', () => {
      const date = new Date('2024-01-15');
      const range = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      };
      expect(isDateInRange(date, range)).toBe(true);
    });

    it('should return false for date outside range', () => {
      const date = new Date('2024-02-15');
      const range = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      };
      expect(isDateInRange(date, range)).toBe(false);
    });
  });

  describe('getWeekdayName', () => {
    it('should return Chinese weekday name', () => {
      const monday = new Date('2024-01-15');
      expect(getWeekdayName(monday)).toBe('周一');
    });
  });

  describe('getWeekdayNumber', () => {
    it('should return 1 for Monday', () => {
      const monday = new Date('2024-01-15');
      expect(getWeekdayNumber(monday)).toBe(1);
    });

    it('should return 7 for Sunday', () => {
      const sunday = new Date('2024-01-14');
      expect(getWeekdayNumber(sunday)).toBe(7);
    });
  });

  describe('addDaysToDate', () => {
    it('should add days to date', () => {
      const date = new Date('2024-01-15');
      const result = addDaysToDate(date, 5);
      expect(result.getDate()).toBe(20);
    });

    it('should handle negative days', () => {
      const date = new Date('2024-01-15');
      const result = addDaysToDate(date, -5);
      expect(result.getDate()).toBe(10);
    });
  });

  describe('addWeeksToDate', () => {
    it('should add weeks to date', () => {
      const date = new Date('2024-01-15');
      const result = addWeeksToDate(date, 1);
      expect(result.getDate()).toBe(22);
    });
  });

  describe('addMonthsToDate', () => {
    it('should add months to date', () => {
      const date = new Date('2024-01-15');
      const result = addMonthsToDate(date, 1);
      expect(result.getMonth()).toBe(1);
    });
  });

  describe('isSameDayDate', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2024-01-15T09:00:00');
      const date2 = new Date('2024-01-15T18:00:00');
      expect(isSameDayDate(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-16');
      expect(isSameDayDate(date1, date2)).toBe(false);
    });
  });

  describe('getMonthName', () => {
    it('should return Chinese month name', () => {
      expect(getMonthName(1)).toBe('一月');
      expect(getMonthName(12)).toBe('十二月');
    });
  });

  describe('parseChineseDateDescription', () => {
    it('should parse 今天', () => {
      const result = parseChineseDateDescription('今天');
      expect(result).toBeDefined();
    });

    it('should parse 本周', () => {
      const result = parseChineseDateDescription('本周');
      expect(result).toBeDefined();
    });

    it('should parse 本月', () => {
      const result = parseChineseDateDescription('本月');
      expect(result).toBeDefined();
    });

    it('should parse year and month', () => {
      const result = parseChineseDateDescription('2024年1月');
      expect(result).toBeDefined();
      expect(result?.start.getFullYear()).toBe(2024);
      expect(result?.start.getMonth()).toBe(0);
    });
  });

  describe('calculateWorkHours', () => {
    it('should calculate work hours', () => {
      const checkIn = new Date('2024-01-15T09:00:00');
      const checkOut = new Date('2024-01-15T18:00:00');
      const hours = calculateWorkHours(checkIn, checkOut);
      expect(hours).toBe(8); // 9 hours - 1 hour lunch
    });
  });

  describe('isLate', () => {
    it('should return true for late check-in', () => {
      const checkIn = new Date('2024-01-15T09:30:00');
      expect(isLate(checkIn, '09:00')).toBe(true);
    });

    it('should return false for on-time check-in', () => {
      const checkIn = new Date('2024-01-15T09:00:00');
      expect(isLate(checkIn, '09:00')).toBe(false);
    });
  });

  describe('isEarlyLeave', () => {
    it('should return true for early leave', () => {
      const checkOut = new Date('2024-01-15T17:30:00');
      expect(isEarlyLeave(checkOut, '18:00')).toBe(true);
    });

    it('should return false for normal leave', () => {
      const checkOut = new Date('2024-01-15T18:00:00');
      expect(isEarlyLeave(checkOut, '18:00')).toBe(false);
    });
  });

  describe('calculateLateMinutes', () => {
    it('should calculate late minutes', () => {
      const checkIn = new Date('2024-01-15T09:30:00');
      expect(calculateLateMinutes(checkIn, '09:00')).toBe(30);
    });
  });

  describe('calculateEarlyLeaveMinutes', () => {
    it('should calculate early leave minutes', () => {
      const checkOut = new Date('2024-01-15T17:30:00');
      expect(calculateEarlyLeaveMinutes(checkOut, '18:00')).toBe(30);
    });
  });
});