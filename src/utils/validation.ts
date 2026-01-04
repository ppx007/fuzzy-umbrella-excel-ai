/**
 * 验证工具函数
 */

import { ValidationResult } from '@/types';

/**
 * 创建验证结果
 */
export function createValidationResult(
  errors: string[] = [],
  warnings: string[] = []
): ValidationResult {
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 合并多个验证结果
 */
export function mergeValidationResults(
  ...results: ValidationResult[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  for (const result of results) {
    errors.push(...result.errors);
    if (result.warnings) {
      warnings.push(...result.warnings);
    }
  }
  
  return createValidationResult(errors, warnings);
}

/**
 * 验证必填字段
 */
export function validateRequired(
  value: unknown,
  fieldName: string
): ValidationResult {
  const errors: string[] = [];
  
  if (value === undefined || value === null || value === '') {
    errors.push(`${fieldName}不能为空`);
  }
  
  return createValidationResult(errors);
}

/**
 * 验证字符串长度
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): ValidationResult {
  const errors: string[] = [];
  
  if (minLength !== undefined && value.length < minLength) {
    errors.push(`${fieldName}长度不能少于${minLength}个字符`);
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    errors.push(`${fieldName}长度不能超过${maxLength}个字符`);
  }
  
  return createValidationResult(errors);
}

/**
 * 验证数字范围
 */
export function validateNumberRange(
  value: number,
  fieldName: string,
  min?: number,
  max?: number
): ValidationResult {
  const errors: string[] = [];
  
  if (isNaN(value)) {
    errors.push(`${fieldName}必须是有效的数字`);
    return createValidationResult(errors);
  }
  
  if (min !== undefined && value < min) {
    errors.push(`${fieldName}不能小于${min}`);
  }
  
  if (max !== undefined && value > max) {
    errors.push(`${fieldName}不能大于${max}`);
  }
  
  return createValidationResult(errors);
}

/**
 * 验证日期
 */
export function validateDate(
  value: unknown,
  fieldName: string
): ValidationResult {
  const errors: string[] = [];
  
  if (value === undefined || value === null) {
    errors.push(`${fieldName}不能为空`);
    return createValidationResult(errors);
  }
  
  const date = value instanceof Date ? value : new Date(value as string);
  
  if (isNaN(date.getTime())) {
    errors.push(`${fieldName}不是有效的日期`);
  }
  
  return createValidationResult(errors);
}

/**
 * 验证日期范围
 */
export function validateDateRange(
  startDate: Date,
  endDate: Date,
  fieldName: string = '日期范围'
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (startDate > endDate) {
    errors.push(`${fieldName}的开始日期不能晚于结束日期`);
  }
  
  // 检查范围是否过大
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysDiff > 365) {
    warnings.push(`${fieldName}跨度超过一年，可能影响性能`);
  }
  
  return createValidationResult(errors, warnings);
}

/**
 * 验证时间格式 (HH:mm)
 */
export function validateTimeFormat(
  value: string,
  fieldName: string
): ValidationResult {
  const errors: string[] = [];
  
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  
  if (!timeRegex.test(value)) {
    errors.push(`${fieldName}格式不正确，应为 HH:mm 格式`);
  }
  
  return createValidationResult(errors);
}

/**
 * 验证邮箱格式
 */
export function validateEmail(
  value: string,
  fieldName: string = '邮箱'
): ValidationResult {
  const errors: string[] = [];
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(value)) {
    errors.push(`${fieldName}格式不正确`);
  }
  
  return createValidationResult(errors);
}

/**
 * 验证手机号格式
 */
export function validatePhone(
  value: string,
  fieldName: string = '手机号'
): ValidationResult {
  const errors: string[] = [];
  
  const phoneRegex = /^1[3-9]\d{9}$/;
  
  if (!phoneRegex.test(value)) {
    errors.push(`${fieldName}格式不正确`);
  }
  
  return createValidationResult(errors);
}

/**
 * 验证数组非空
 */
export function validateArrayNotEmpty<T>(
  value: T[],
  fieldName: string
): ValidationResult {
  const errors: string[] = [];
  
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${fieldName}不能为空`);
  }
  
  return createValidationResult(errors);
}

/**
 * 验证文件类型
 */
export function validateFileType(
  fileName: string,
  allowedExtensions: string[],
  fieldName: string = '文件'
): ValidationResult {
  const errors: string[] = [];
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (!extension || !allowedExtensions.includes(extension)) {
    errors.push(
      `${fieldName}类型不支持，允许的类型: ${allowedExtensions.join(', ')}`
    );
  }
  
  return createValidationResult(errors);
}

/**
 * 验证文件大小
 */
export function validateFileSize(
  fileSize: number,
  maxSizeInMB: number,
  fieldName: string = '文件'
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  
  if (fileSize > maxSizeInBytes) {
    errors.push(`${fieldName}大小不能超过 ${maxSizeInMB}MB`);
  } else if (fileSize > maxSizeInBytes * 0.8) {
    warnings.push(`${fieldName}大小接近限制 (${maxSizeInMB}MB)`);
  }
  
  return createValidationResult(errors, warnings);
}

/**
 * 验证员工数据
 */
export function validateEmployeeData(data: {
  name?: string;
  employeeNo?: string;
  department?: string;
  email?: string;
  phone?: string;
}): ValidationResult {
  const results: ValidationResult[] = [];
  
  // 验证姓名
  if (data.name !== undefined) {
    results.push(validateRequired(data.name, '员工姓名'));
    if (data.name) {
      results.push(validateStringLength(data.name, '员工姓名', 2, 20));
    }
  }
  
  // 验证工号
  if (data.employeeNo !== undefined && data.employeeNo) {
    results.push(validateStringLength(data.employeeNo, '员工工号', 1, 20));
  }
  
  // 验证邮箱
  if (data.email !== undefined && data.email) {
    results.push(validateEmail(data.email));
  }
  
  // 验证手机号
  if (data.phone !== undefined && data.phone) {
    results.push(validatePhone(data.phone));
  }
  
  return mergeValidationResults(...results);
}

/**
 * 验证考勤记录数据
 */
export function validateAttendanceRecord(data: {
  employeeId?: string;
  date?: Date | string;
  checkInTime?: string;
  checkOutTime?: string;
}): ValidationResult {
  const results: ValidationResult[] = [];
  
  // 验证员工ID
  results.push(validateRequired(data.employeeId, '员工ID'));
  
  // 验证日期
  if (data.date !== undefined) {
    results.push(validateDate(data.date, '考勤日期'));
  }
  
  // 验证签到时间
  if (data.checkInTime !== undefined && data.checkInTime) {
    results.push(validateTimeFormat(data.checkInTime, '签到时间'));
  }
  
  // 验证签退时间
  if (data.checkOutTime !== undefined && data.checkOutTime) {
    results.push(validateTimeFormat(data.checkOutTime, '签退时间'));
  }
  
  return mergeValidationResults(...results);
}