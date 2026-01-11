import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tableGenerationService } from '../services/table-generation-service';
import { excelAdapter } from '../adapters/excel-adapter';

// Mock Excel global object
global.Excel = {
  run: vi.fn(async callback => {
    const context = {
      workbook: {
        worksheets: {
          add: vi.fn(() => ({
            activate: vi.fn(),
            getRangeByIndexes: vi.fn(() => ({
              values: [],
              format: {
                font: {},
                fill: {},
                borders: { getItem: vi.fn(() => ({})) },
                horizontalAlignment: 'General',
                verticalAlignment: 'Center',
                autofitColumns: vi.fn(),
              },
              getEntireColumn: vi.fn(() => ({ format: { columnWidth: 0 } })),
            })),
            tables: {
              add: vi.fn(() => ({
                name: '',
                style: '',
                showTotalsRow: false,
              })),
            },
          })),
          items: [],
          load: vi.fn(),
          getActiveWorksheet: vi.fn(),
        },
      },
      sync: vi.fn(),
    };
    await callback(context);
  }),
  // @ts-ignore
  BorderIndex: {
    edgeTop: 'EdgeTop',
    edgeBottom: 'EdgeBottom',
    edgeLeft: 'EdgeLeft',
    edgeRight: 'EdgeRight',
    insideHorizontal: 'InsideHorizontal',
    insideVertical: 'InsideVertical',
  },
  // @ts-ignore
  BorderLineStyle: {
    thin: 'Thin',
  },
  // @ts-ignore
  HorizontalAlignment: {
    center: 'Center',
  },
  // @ts-ignore
  VerticalAlignment: {
    center: 'Center',
  },
} as any;

// Mock Office global object
global.Office = {
  context: {
    host: 'Excel',
  },
  HostType: {
    Excel: 'Excel',
  },
} as any;

describe('Integration Flow: NL to Excel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process natural language, generate table data, and write to Excel', async () => {
    // 1. Mock AI Response
    const mockAIResponse = JSON.stringify({
      tableName: 'ProjectSchedule',
      columns: [
        { name: 'Task', type: 'text' },
        { name: 'DueDate', type: 'date' },
        { name: 'Progress', type: 'percentage' },
      ],
      rows: [
        { Task: 'Design', DueDate: '2023-12-01', Progress: 100 },
        { Task: 'Development', DueDate: '2023-12-15', Progress: 50 },
      ],
      style: {
        colorTheme: 'professional',
      },
    });

    // Mock the fetch call inside TableGenerationService
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => {
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ choices: [{ delta: { content: mockAIResponse } }] })}\n\n`
                )
              );
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            },
          });
          return stream.getReader();
        },
      },
    });

    // 2. Call TableGenerationService
    const result = await tableGenerationService.generateStyledTable({
      prompt: 'Create a project schedule',
      options: { rowCount: 2 },
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.tableName).toBe('ProjectSchedule');
    expect(result.data!.rows.length).toBe(2);

    // 3. Call ExcelAdapter
    await excelAdapter.writeStyledTable(result.data!);

    // 4. Verify Excel.run was called
    expect(Excel.run).toHaveBeenCalled();
  });

  it('should handle date and time formatting correctly', async () => {
    // 1. Mock AI Response with mixed date formats
    const mockAIResponse = JSON.stringify({
      tableName: 'TimeLog',
      columns: [
        { name: 'Date', type: 'date' },
        { name: 'Time', type: 'time' },
      ],
      rows: [
        { Date: '2023-10-25T00:00:00.000Z', Time: '14:30:00' }, // ISO format
        { Date: '2023-10-26', Time: '09:00' }, // Correct format
      ],
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => {
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ choices: [{ delta: { content: mockAIResponse } }] })}\n\n`
                )
              );
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            },
          });
          return stream.getReader();
        },
      },
    });

    // 2. Generate Table
    const result = await tableGenerationService.generateStyledTable({
      prompt: 'Log times',
    });

    expect(result.success).toBe(true);
    const rows = result.data!.rows;

    // TableGenerationService should have cleaned these up
    expect(rows[0]['Date']).toBe('2023-10-25');
    expect(rows[0]['Time']).toBe('14:30');
    expect(rows[1]['Date']).toBe('2023-10-26');
    expect(rows[1]['Time']).toBe('09:00');

    // 3. Write to Excel (Mock verification)
    // We can't easily verify the exact values passed to range.values inside the mock without more complex mocking,
    // but we verified the data *before* it went in, and we verified ExcelAdapter's formatting logic in previous steps.
    await excelAdapter.writeStyledTable(result.data!);
    expect(Excel.run).toHaveBeenCalled();
  });
});
