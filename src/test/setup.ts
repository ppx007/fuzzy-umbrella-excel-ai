import '@testing-library/jest-dom';

// Mock Office.js - using any to avoid type conflicts with actual Office.js types
const mockWorksheet = {
  getRange: () => ({
    values: [] as unknown[][],
    format: {
      fill: { color: '' },
      font: { bold: false, color: '', size: 11 },
      borders: {
        getItem: () => ({ style: '', color: '' }),
      },
    },
    load: () => Promise.resolve(),
    merge: () => {},
  }),
  getUsedRange: () => ({
    values: [] as unknown[][],
    load: () => Promise.resolve(),
  }),
};

const mockContext = {
  workbook: {
    worksheets: {
      getActiveWorksheet: () => mockWorksheet,
    },
    charts: {
      add: () => ({
        setData: () => {},
        title: { text: '' },
        legend: { visible: true },
      }),
    },
    names: {},
    tables: {},
  },
  document: {
    body: {
      insertTable: () => ({
        getBorder: () => ({
          set: () => {},
        }),
        getCell: () => ({
          body: {
            insertParagraph: () => ({ font: {} }),
          },
        }),
      }),
      insertParagraph: () => ({
        font: { bold: false, size: 11, color: '' },
      }),
    },
    sections: {},
    contentControls: {},
    save: () => Promise.resolve(),
    load: () => Promise.resolve(),
  },
  sync: () => Promise.resolve(),
};

// Mock Excel global
(globalThis as Record<string, unknown>).Excel = {
  run: async <T>(callback: (context: unknown) => Promise<T>): Promise<T> => {
    return callback(mockContext);
  },
  ChartType: {
    pie: 'Pie',
    columnClustered: 'ColumnClustered',
    line: 'Line',
  },
};

// Mock Word global
(globalThis as Record<string, unknown>).Word = {
  run: async <T>(callback: (context: unknown) => Promise<T>): Promise<T> => {
    return callback(mockContext);
  },
  InsertLocation: {
    end: 'End',
  },
  BorderLocation: {
    all: 'All',
  },
};

// Mock Office global
(globalThis as Record<string, unknown>).Office = {
  onReady: (callback: (info: { host: string; platform: string }) => void) => {
    callback({ host: 'Excel', platform: 'PC' });
    return Promise.resolve();
  },
  HostType: {
    Excel: 'Excel',
    Word: 'Word',
  },
  context: {
    host: 'Excel',
  },
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});