# 项目结构说明文档

## 目录结构总览

```
attendance-office-addin/
├── manifest.xml                    # Office Add-in 清单文件
├── package.json                    # 项目配置和依赖
├── tsconfig.json                   # TypeScript配置
├── vite.config.ts                  # Vite构建配置
├── .env.example                    # 环境变量示例
├── .gitignore                      # Git忽略文件
├── README.md                       # 项目说明
│
├── src/                            # 源代码目录
├── public/                         # 静态资源
├── tests/                          # 测试文件
└── docs/                           # 文档目录
```

## 核心目录详解

### 1. src/components/ - UI组件

```
components/
├── common/                         # 通用基础组件
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.styles.ts
│   │   └── index.ts
│   ├── Input/
│   │   ├── TextInput.tsx
│   │   ├── TextArea.tsx
│   │   └── index.ts
│   ├── Modal/
│   │   ├── Modal.tsx
│   │   ├── ConfirmModal.tsx
│   │   └── index.ts
│   └── Loading/
│       ├── Spinner.tsx
│       ├── Skeleton.tsx
│       └── index.ts
│
├── panels/                         # 功能面板组件
│   ├── InputPanel/                 # 自然语言输入面板
│   │   ├── InputPanel.tsx
│   │   ├── VoiceInput.tsx          # 语音输入（可选）
│   │   ├── SuggestionList.tsx      # 输入建议
│   │   └── index.ts
│   │
│   ├── PreviewPanel/               # 预览面板
│   │   ├── PreviewPanel.tsx
│   │   ├── TablePreview.tsx        # 表格预览
│   │   ├── ChartPreview.tsx        # 图表预览
│   │   └── index.ts
│   │
│   ├── TemplatePanel/              # 模板选择面板
│   │   ├── TemplatePanel.tsx
│   │   ├── TemplateCard.tsx        # 模板卡片
│   │   ├── TemplateGrid.tsx        # 模板网格
│   │   └── index.ts
│   │
│   ├── ImportPanel/                # 文件导入面板
│   │   ├── ImportPanel.tsx
│   │   ├── FileUploader.tsx        # 文件上传
│   │   ├── ColumnMapper.tsx        # 列映射配置
│   │   ├── DataPreview.tsx         # 数据预览
│   │   └── index.ts
│   │
│   ├── ChartPanel/                 # 图表面板
│   │   ├── ChartPanel.tsx
│   │   ├── ChartTypeSelector.tsx   # 图表类型选择
│   │   ├── ChartOptions.tsx        # 图表选项
│   │   └── index.ts
│   │
│   └── SettingsPanel/              # 设置面板
│       ├── SettingsPanel.tsx
│       ├── APISettings.tsx         # API配置
│       ├── DefaultSettings.tsx     # 默认设置
│       └── index.ts
│
└── attendance/                     # 考勤专用组件
    ├── AttendanceTable/
    │   ├── AttendanceTable.tsx     # 考勤表格
    │   ├── TableHeader.tsx         # 表头
    │   ├── TableRow.tsx            # 行
    │   ├── TableCell.tsx           # 单元格
    │   └── index.ts
    │
    ├── AttendanceChart/
    │   ├── AttendanceChart.tsx     # 考勤图表
    │   ├── PieChart.tsx            # 饼图
    │   ├── BarChart.tsx            # 柱状图
    │   ├── LineChart.tsx           # 折线图
    │   └── index.ts
    │
    └── AttendanceStats/
        ├── AttendanceStats.tsx     # 统计面板
        ├── StatCard.tsx            # 统计卡片
        └── index.ts
```

### 2. src/core/ - 核心业务逻辑

```
core/
├── nlp/                            # 自然语言处理模块
│   ├── index.ts                    # 模块导出
│   ├── processor.ts                # NLP处理器主类
│   ├── tokenizer.ts                # 中文分词器
│   ├── api-client.ts               # OpenAI API客户端
│   │
│   └── rules/                      # 规则引擎
│       ├── index.ts
│       ├── intents.ts              # 意图识别规则
│       ├── entities.ts             # 实体提取规则
│       ├── patterns.ts             # 正则模式库
│       └── keywords.ts             # 关键词词典
│
├── templates/                      # 模板引擎模块
│   ├── index.ts
│   ├── engine.ts                   # 模板引擎
│   ├── renderer.ts                 # 模板渲染器
│   ├── validator.ts                # 模板验证器
│   │
│   └── presets/                    # 预设模板
│       ├── index.ts
│       ├── daily.ts                # 日报模板
│       ├── weekly.ts               # 周报模板
│       ├── monthly.ts              # 月报模板
│       └── summary.ts              # 汇总模板
│
├── generator/                      # 生成器模块
│   ├── index.ts
│   ├── attendance-generator.ts     # 考勤表生成器
│   ├── chart-generator.ts          # 图表生成器
│   ├── style-manager.ts            # 样式管理器
│   └── formula-builder.ts          # 公式构建器
│
└── data/                           # 数据处理模块
    ├── index.ts
    ├── processor.ts                # 数据处理器
    ├── validator.ts                # 数据验证器
    ├── transformer.ts              # 数据转换器
    └── statistics.ts               # 统计计算
```

### 3. src/adapters/ - Office适配器

```
adapters/
├── index.ts                        # 适配器工厂
├── base.ts                         # 基础适配器接口
├── excel-adapter.ts                # Excel适配器
│   ├── ExcelAdapter class
│   ├── createWorksheet()
│   ├── createTable()
│   ├── createChart()
│   ├── applyStyles()
│   └── addFormulas()
│
├── word-adapter.ts                 # Word适配器
│   ├── WordAdapter class
│   ├── createTable()
│   ├── applyStyles()
│   └── insertContent()
│
└── utils.ts                        # 适配器工具函数
    ├── rangeToAddress()
    ├── colorToOffice()
    └── styleToOffice()
```

### 4. src/services/ - 服务层

```
services/
├── import-service.ts               # 文件导入服务
│   ├── parseCSV()
│   ├── parseExcel()
│   ├── validateData()
│   └── transformData()
│
├── export-service.ts               # 导出服务
│   ├── exportToPDF()
│   ├── exportToImage()
│   └── exportToJSON()
│
├── storage-service.ts              # 本地存储服务
│   ├── saveTemplate()
│   ├── loadTemplate()
│   ├── saveSettings()
│   └── loadSettings()
│
└── config-service.ts               # 配置管理服务
    ├── getConfig()
    ├── setConfig()
    └── resetConfig()
```

### 5. src/types/ - 类型定义

```
types/
├── attendance.ts                   # 考勤相关类型
│   ├── Employee
│   ├── AttendanceRecord
│   ├── AttendanceStatus
│   ├── AttendanceSheet
│   └── AttendanceStatistics
│
├── template.ts                     # 模板相关类型
│   ├── AttendanceTemplate
│   ├── TemplateType
│   ├── HeaderDefinition
│   ├── RowDefinition
│   └── StyleConfig
│
├── nlp.ts                          # NLP相关类型
│   ├── NLPResult
│   ├── AttendanceIntent
│   ├── EntityType
│   ├── IntentRule
│   └── EntityRule
│
├── office.ts                       # Office相关类型
│   ├── OfficeAdapter
│   ├── TableConfig
│   ├── ChartConfig
│   ├── TableReference
│   └── ChartReference
│
└── common.ts                       # 通用类型
    ├── DateRange
    ├── ValidationResult
    └── ApiResponse
```

### 6. src/hooks/ - React Hooks

```
hooks/
├── useOffice.ts                    # Office相关Hook
│   ├── useOfficeReady()            # Office初始化状态
│   ├── useActiveDocument()         # 当前文档信息
│   └── useOfficeAdapter()          # 获取适配器
│
├── useNLP.ts                       # NLP相关Hook
│   ├── useNLPProcessor()           # NLP处理器
│   └── useNLPResult()              # NLP结果状态
│
├── useTemplate.ts                  # 模板相关Hook
│   ├── useTemplates()              # 模板列表
│   ├── useSelectedTemplate()       # 选中模板
│   └── useTemplateEngine()         # 模板引擎
│
├── useImport.ts                    # 导入相关Hook
│   ├── useFileImport()             # 文件导入
│   └── useImportPreview()          # 导入预览
│
└── useAttendance.ts                # 考勤相关Hook
    ├── useAttendanceSheet()        # 考勤表数据
    ├── useAttendanceStats()        # 统计数据
    └── useAttendanceChart()        # 图表数据
```

### 7. src/store/ - 状态管理

```
store/
├── index.ts                        # Store配置
│
├── attendance-store.ts             # 考勤状态
│   ├── currentSheet                # 当前考勤表
│   ├── employees                   # 员工列表
│   ├── records                     # 考勤记录
│   └── statistics                  # 统计数据
│
├── template-store.ts               # 模板状态
│   ├── templates                   # 模板列表
│   ├── selectedTemplate            # 选中模板
│   └── customTemplates             # 自定义模板
│
├── settings-store.ts               # 设置状态
│   ├── apiConfig                   # API配置
│   ├── defaultTemplate             # 默认模板
│   └── uiPreferences               # UI偏好
│
└── ui-store.ts                     # UI状态
    ├── activePanel                 # 当前面板
    ├── isLoading                   # 加载状态
    └── notifications               # 通知消息
```

### 8. public/ - 静态资源

```
public/
├── icons/                          # 插件图标
│   ├── icon-16.png                 # 16x16
│   ├── icon-32.png                 # 32x32
│   ├── icon-80.png                 # 80x80
│   └── icon-128.png                # 128x128
│
├── templates/                      # 模板JSON文件
│   ├── daily-simple.json
│   ├── daily-detailed.json
│   ├── weekly-standard.json
│   ├── monthly-standard.json
│   └── monthly-summary.json
│
└── locales/                        # 国际化文件（可选）
    ├── zh-CN.json
    └── en-US.json
```

### 9. tests/ - 测试文件

```
tests/
├── unit/                           # 单元测试
│   ├── nlp/
│   │   ├── processor.test.ts
│   │   ├── tokenizer.test.ts
│   │   └── rules.test.ts
│   │
│   ├── templates/
│   │   ├── engine.test.ts
│   │   └── renderer.test.ts
│   │
│   ├── adapters/
│   │   ├── excel-adapter.test.ts
│   │   └── word-adapter.test.ts
│   │
│   └── services/
│       ├── import-service.test.ts
│       └── storage-service.test.ts
│
├── integration/                    # 集成测试
│   ├── nlp-to-generator.test.ts
│   └── import-to-output.test.ts
│
└── mocks/                          # 测试模拟
    ├── office-mock.ts
    └── data-mock.ts
```

## 关键文件说明

### manifest.xml
Office Add-in的清单文件，定义插件的基本信息、权限和入口点。

### package.json 主要依赖
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@fluentui/react-components": "^9.x",
    "@microsoft/office-js": "^1.1.x",
    "chart.js": "^4.x",
    "xlsx": "^0.18.x",
    "papaparse": "^5.x",
    "zustand": "^4.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "vitest": "^1.x",
    "@testing-library/react": "^14.x"
  }
}
```

### vite.config.ts 配置要点
- 配置HTTPS（Office Add-in要求）
- 配置代理（开发环境）
- 配置构建输出

### tsconfig.json 配置要点
- 启用严格模式
- 配置路径别名
- 包含Office.js类型定义