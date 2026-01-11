import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateEngine, TemplateContext } from '../template-engine';
import { TemplateType } from '@/types';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine();
  });

  describe('getTemplate', () => {
    it('should return daily simple template', () => {
      const template = engine.getTemplate(TemplateType.DAILY_SIMPLE);
      expect(template).toBeDefined();
      expect(template?.type).toBe(TemplateType.DAILY_SIMPLE);
    });

    it('should return daily detailed template', () => {
      const template = engine.getTemplate(TemplateType.DAILY_DETAILED);
      expect(template).toBeDefined();
      expect(template?.type).toBe(TemplateType.DAILY_DETAILED);
    });

    it('should return weekly summary template', () => {
      const template = engine.getTemplate(TemplateType.WEEKLY_SUMMARY);
      expect(template).toBeDefined();
      expect(template?.type).toBe(TemplateType.WEEKLY_SUMMARY);
    });

    it('should return monthly summary template', () => {
      const template = engine.getTemplate(TemplateType.MONTHLY_SUMMARY);
      expect(template).toBeDefined();
      expect(template?.type).toBe(TemplateType.MONTHLY_SUMMARY);
    });

    it('should return monthly detailed template', () => {
      const template = engine.getTemplate(TemplateType.MONTHLY_DETAILED);
      expect(template).toBeDefined();
      expect(template?.type).toBe(TemplateType.MONTHLY_DETAILED);
    });
  });

  describe('getAllTemplates', () => {
    it('should return all available templates', () => {
      const templates = engine.getAllTemplates();
      expect(templates).toBeDefined();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should include all default template types', () => {
      const templates = engine.getAllTemplates();
      const types = templates.map(t => t.type);
      expect(types).toContain(TemplateType.DAILY_SIMPLE);
      expect(types).toContain(TemplateType.DAILY_DETAILED);
      expect(types).toContain(TemplateType.WEEKLY_SUMMARY);
      expect(types).toContain(TemplateType.MONTHLY_SUMMARY);
      expect(types).toContain(TemplateType.MONTHLY_DETAILED);
    });
  });

  describe('registerTemplate', () => {
    it('should register custom template', () => {
      const customTemplate = {
        id: 'custom-1',
        name: '自定义模板',
        type: TemplateType.CUSTOM,
        description: '测试自定义模板',
        headers: [{ title: '姓名', field: 'name', width: 100 }],
        columns: [],
        styles: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      engine.registerTemplate(customTemplate);
      const retrieved = engine.getCustomTemplate('custom-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('自定义模板');
    });
  });

  describe('render', () => {
    const mockContext: TemplateContext = {
      title: '考勤表',
      dateRange: {
        start: new Date('2024-01-15'),
        end: new Date('2024-01-15'),
      },
      employees: [
        {
          id: '1',
          name: '张三',
          employeeNo: 'E001',
          department: '技术部',
        },
        {
          id: '2',
          name: '李四',
          employeeNo: 'E002',
          department: '技术部',
        },
      ],
      records: [
        {
          employeeId: '1',
          date: new Date('2024-01-15'),
          checkInTime: '09:00',
          checkOutTime: '18:00',
          status: '正常',
        },
        {
          employeeId: '2',
          date: new Date('2024-01-15'),
          checkInTime: '09:30',
          checkOutTime: '18:00',
          status: '迟到',
        },
      ],
    };

    it('should render daily simple template', () => {
      const template = engine.getTemplate(TemplateType.DAILY_SIMPLE);
      expect(template).toBeDefined();

      const result = engine.render(template!, mockContext);

      expect(result).toBeDefined();
      expect(result.headers).toBeDefined();
      expect(result.rows).toBeDefined();
      expect(result.headers.length).toBeGreaterThan(0);
    });

    it('should render daily detailed template', () => {
      const template = engine.getTemplate(TemplateType.DAILY_DETAILED);
      expect(template).toBeDefined();

      const result = engine.render(template!, mockContext);

      expect(result).toBeDefined();
      expect(result.headers.length).toBeGreaterThan(0);
    });

    it('should include employee data in rows', () => {
      const template = engine.getTemplate(TemplateType.DAILY_SIMPLE);
      expect(template).toBeDefined();

      const result = engine.render(template!, mockContext);

      expect(result.rows.length).toBe(mockContext.employees!.length);
    });

    it('should handle empty records', () => {
      const template = engine.getTemplate(TemplateType.DAILY_SIMPLE);
      expect(template).toBeDefined();

      const contextWithoutRecords = { ...mockContext, records: [] };
      const result = engine.render(template!, contextWithoutRecords);

      expect(result).toBeDefined();
      expect(result.rows.length).toBe(mockContext.employees!.length);
    });

    it('should handle empty employees', () => {
      const template = engine.getTemplate(TemplateType.DAILY_SIMPLE);
      expect(template).toBeDefined();

      const contextWithoutEmployees = { ...mockContext, employees: [] };
      const result = engine.render(template!, contextWithoutEmployees);

      expect(result).toBeDefined();
      expect(result.rows.length).toBe(0);
    });

    it('should include styles in result', () => {
      const template = engine.getTemplate(TemplateType.DAILY_SIMPLE);
      expect(template).toBeDefined();

      const result = engine.render(template!, mockContext);

      expect(result.styles).toBeDefined();
      expect(result.styles.size).toBeGreaterThan(0);
    });

    it('should calculate column widths', () => {
      const template = engine.getTemplate(TemplateType.DAILY_SIMPLE);
      expect(template).toBeDefined();

      const result = engine.render(template!, mockContext);

      expect(result.columnWidths).toBeDefined();
      expect(result.columnWidths.length).toBe(template!.headers.length);
    });

    it('should calculate row heights', () => {
      const template = engine.getTemplate(TemplateType.DAILY_SIMPLE);
      expect(template).toBeDefined();

      const result = engine.render(template!, mockContext);

      expect(result.rowHeights).toBeDefined();
      expect(result.rowHeights.length).toBeGreaterThan(0);
    });
  });

  describe('cloneTemplate', () => {
    it('should clone template with new id and name', () => {
      const template = engine.getTemplate(TemplateType.DAILY_SIMPLE);
      expect(template).toBeDefined();

      const cloned = engine.cloneTemplate(template!, 'cloned-1', '克隆模板');

      expect(cloned.id).toBe('cloned-1');
      expect(cloned.name).toBe('克隆模板');
      expect(cloned.type).toBe(template!.type);
      expect(cloned.headers.length).toBe(template!.headers.length);
    });

    it('should create independent copy', () => {
      const template = engine.getTemplate(TemplateType.DAILY_SIMPLE);
      expect(template).toBeDefined();

      const cloned = engine.cloneTemplate(template!, 'cloned-2', '克隆模板2');
      cloned.headers[0].title = '修改后的标题';

      expect(template!.headers[0].title).not.toBe('修改后的标题');
    });
  });
});
