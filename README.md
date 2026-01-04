# 📊 Office 考勤表生成器

一个基于自然语言的 Office 插件，能够智能生成各种格式的考勤表。支持 Excel 和 Word 双平台。

---

## 📋 目录

- [功能特性](#-功能特性)
- [环境要求](#-环境要求)
- [快速开始](#-快速开始)
  - [1. 克隆项目](#1-克隆项目)
  - [2. 安装依赖](#2-安装依赖)
  - [3. 配置环境变量](#3-配置环境变量)
  - [4. 生成开发证书](#4-生成开发证书)
  - [5. 启动开发服务器](#5-启动开发服务器)
- [Office Add-in 部署说明](#-office-add-in-部署说明)
  - [方式一：使用命令行自动加载（推荐）](#方式一使用命令行自动加载推荐)
  - [方式二：手动旁加载插件](#方式二手动旁加载插件)
- [使用示例](#-使用示例)
- [项目结构](#-项目结构)
- [npm 脚本命令说明](#-npm-脚本命令说明)
- [常见问题解答（FAQ）](#-常见问题解答faq)
- [技术栈](#-技术栈)
- [文档](#-文档)
- [贡献](#-贡献)
- [许可证](#-许可证)

---

## ✨ 功能特性

- 🗣️ **自然语言生成** - 用中文描述需求，自动生成考勤表
- 📋 **多种模板** - 支持日报、周报、月报、汇总表等多种格式
- 📁 **文件导入** - 支持从 CSV/Excel 文件导入考勤数据
- 📊 **图表生成** - 自动生成出勤率、趋势等统计图表
- 📝 **双平台支持** - 同时支持 Excel 和 Word

---

## 💻 环境要求

在开始之前，请确保您的开发环境满足以下要求：

### 必需软件

| 软件 | 最低版本 | 推荐版本 | 说明 |
|------|---------|---------|------|
| **Node.js** | 18.0.0 | 20.x LTS | [下载地址](https://nodejs.org/) |
| **npm** | 9.0.0 | 10.x | 随 Node.js 一起安装 |
| **Microsoft Office** | Office 2016 | Microsoft 365 | 需要 Excel 或 Word |

### 检查版本

打开终端/命令提示符，运行以下命令检查版本：

```bash
# 检查 Node.js 版本
node --version
# 应显示 v18.0.0 或更高

# 检查 npm 版本
npm --version
# 应显示 9.0.0 或更高
```

### 操作系统支持

- ✅ Windows 10/11
- ✅ macOS 10.15+
- ⚠️ Linux（仅支持 Web 版 Office）

### 浏览器要求（用于 Office Web 版）

- Microsoft Edge（推荐）
- Google Chrome
- Safari（macOS）

---

## 🚀 快速开始

### 1. 克隆项目

```bash
# 使用 Git 克隆项目
git clone https://github.com/your-username/attendance-office-addin.git

# 进入项目目录
cd attendance-office-addin
```

> 💡 **提示**：如果没有安装 Git，可以直接从 GitHub 下载 ZIP 文件并解压。

### 2. 安装依赖

```bash
# 安装项目依赖（可能需要几分钟）
npm install
```

如果安装过程中遇到网络问题，可以尝试使用国内镜像：

```bash
# 使用淘宝镜像
npm install --registry=https://registry.npmmirror.com
```

### 3. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env
```

在 Windows 上使用：
```cmd
copy .env.example .env
```

打开 `.env` 文件，根据需要修改配置：

```env
# 开发服务器端口（默认 3000）
VITE_DEV_PORT=3000

# NLP 模式：local（本地）| api（API）| hybrid（混合）
# 新手建议使用 local 模式，无需额外配置
VITE_NLP_MODE=local

# 调试模式（开发时建议开启）
VITE_DEBUG=true

# 以下为可选配置，使用 API 模式时需要
# VITE_OPENAI_API_KEY=your-api-key-here
# VITE_OPENAI_API_BASE=https://api.openai.com/v1
```

> 📝 **说明**：本地模式（local）使用内置的规则引擎处理自然语言，无需任何 API 密钥即可使用。

### 4. 生成开发证书

Office Add-in 需要 HTTPS 连接，首次运行需要生成开发证书：

```bash
# 生成并信任开发证书
npx office-addin-dev-certs install
```

> ⚠️ **Windows 用户注意**：运行此命令时可能会弹出 UAC 提示，请点击"是"允许安装证书。

> ⚠️ **macOS 用户注意**：可能需要输入系统密码来安装证书到钥匙串。

### 5. 启动开发服务器

```bash
# 启动 Vite 开发服务器
npm run dev
```

成功启动后，您会看到类似以下输出：

```
  VITE v5.0.10  ready in 500 ms

  ➜  Local:   https://localhost:3000/
  ➜  Network: https://192.168.x.x:3000/
```

> 🎉 **恭喜！** 开发服务器已启动，现在可以在 Office 中加载插件了。

---

## 📦 Office Add-in 部署说明

### 方式一：使用命令行自动加载（推荐）

这是最简单的方式，会自动打开 Office 应用并加载插件。

#### 在 Excel 中调试

```bash
# 确保开发服务器正在运行（npm run dev）
# 打开新终端窗口，运行：
npm run start:excel
```

#### 在 Word 中调试

```bash
# 确保开发服务器正在运行（npm run dev）
# 打开新终端窗口，运行：
npm run start:word
```

#### 停止调试

```bash
npm run stop
```

### 方式二：手动旁加载插件

如果自动加载失败，可以手动加载插件。

#### Excel 桌面版（Windows）

1. 打开 Excel
2. 点击 **文件** → **选项** → **信任中心** → **信任中心设置**
3. 点击 **受信任的加载项目录**
4. 在"目录 URL"中添加：`https://localhost:3000`
5. 勾选"在菜单中显示"
6. 点击确定，重启 Excel
7. 点击 **插入** → **我的加载项** → **共享文件夹**
8. 选择"考勤表生成器"

#### Excel 桌面版（macOS）

1. 打开 Excel
2. 点击 **插入** → **加载项** → **我的加载项**
3. 点击 **管理我的加载项**（右上角齿轮图标）
4. 选择 **上传我的加载项**
5. 浏览并选择项目根目录下的 `manifest.xml` 文件
6. 点击上传

#### Excel/Word 网页版

1. 打开 [Office 网页版](https://www.office.com)
2. 新建或打开一个 Excel/Word 文档
3. 点击 **插入** → **加载项** → **上传我的加载项**
4. 选择项目根目录下的 `manifest.xml` 文件
5. 点击上传

### 验证插件加载成功

插件加载成功后，您会在 **开始** 选项卡看到"考勤表"组，其中包含"考勤表生成器"按钮。

点击该按钮，右侧会打开任务窗格，显示插件界面。

---

## 📖 使用示例

### 自然语言输入示例

在插件的输入框中，您可以用自然语言描述需要的考勤表：

```
生成2024年1月的考勤表
```

```
创建一个周考勤表，从1月1日到1月7日，包含张三、李四、王五
```

```
做一个部门月度考勤汇总表，统计迟到早退次数和出勤率
```

```
生成本月考勤表并创建出勤率饼图
```

### 支持的考勤表类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| 简单日报 | 基础打卡记录 | 日常考勤记录 |
| 详细日报 | 包含工时计算 | 需要统计工时 |
| 标准周报 | 一周考勤汇总 | 周度汇报 |
| 标准月报 | 月度考勤明细 | 月度存档 |
| 月度汇总 | 统计数据汇总 | 管理层查看 |

---

## 📁 项目结构

```
attendance-office-addin/
├── 📄 manifest.xml          # Office 插件清单文件
├── 📄 package.json          # 项目配置和依赖
├── 📄 vite.config.ts        # Vite 构建配置
├── 📄 tsconfig.json         # TypeScript 配置
├── 📄 .env.example          # 环境变量示例
├── 📄 taskpane.html         # 任务窗格 HTML
│
├── 📂 src/                  # 源代码目录
│   ├── 📄 main.tsx          # 应用入口
│   ├── 📄 App.tsx           # 根组件
│   │
│   ├── 📂 components/       # UI 组件
│   │   ├── 📂 common/       # 通用组件（按钮、输入框等）
│   │   ├── 📂 NLPInput/     # 自然语言输入组件
│   │   ├── 📂 AttendanceTable/  # 考勤表组件
│   │   ├── 📂 TemplateSelector/ # 模板选择器
│   │   └── 📂 StatisticsPanel/  # 统计面板
│   │
│   ├── 📂 core/             # 核心业务逻辑
│   │   ├── 📂 nlp/          # 自然语言处理引擎
│   │   ├── 📂 template/     # 模板引擎
│   │   ├── 📂 generator/    # 表格/图表生成器
│   │   └── 📂 data/         # 数据处理
│   │
│   ├── 📂 adapters/         # Office 适配器
│   │   ├── 📄 excel-adapter.ts  # Excel API 封装
│   │   └── 📄 word-adapter.ts   # Word API 封装
│   │
│   ├── 📂 hooks/            # React Hooks
│   ├── 📂 store/            # 状态管理（Zustand）
│   ├── 📂 types/            # TypeScript 类型定义
│   ├── 📂 utils/            # 工具函数
│   └── 📂 styles/           # 样式文件
│
├── 📂 public/               # 静态资源
│   └── 📂 templates/        # 考勤表模板 JSON
│
├── 📂 docs/                 # 项目文档
│   ├── 📄 ARCHITECTURE.md   # 架构设计
│   ├── 📄 DATA_MODELS.md    # 数据模型
│   ├── 📄 DEVELOPMENT.md    # 开发指南
│   ├── 📄 PROJECT_STRUCTURE.md  # 项目结构
│   └── 📄 USER_GUIDE.md     # 用户指南
│
└── 📂 .vscode/              # VS Code 配置
```

---

## 📜 npm 脚本命令说明

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器（HTTPS，端口 3000） |
| `npm run build` | 构建生产版本到 `dist` 目录 |
| `npm run preview` | 预览生产构建 |
| `npm run start:excel` | 在 Excel 中启动调试 |
| `npm run start:word` | 在 Word 中启动调试 |
| `npm run stop` | 停止 Office 调试会话 |
| `npm run test` | 运行单元测试 |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |
| `npm run lint` | 运行 ESLint 代码检查 |
| `npm run lint:fix` | 自动修复 ESLint 问题 |
| `npm run format` | 使用 Prettier 格式化代码 |
| `npm run type-check` | TypeScript 类型检查 |
| `npm run validate` | 运行 lint + 类型检查 + 测试 |

---

## ❓ 常见问题解答（FAQ）

### 安装相关

#### Q: `npm install` 失败，提示网络错误？

**A:** 尝试使用国内镜像：
```bash
npm install --registry=https://registry.npmmirror.com
```

或者配置永久镜像：
```bash
npm config set registry https://registry.npmmirror.com
```

#### Q: 安装时提示 Node.js 版本过低？

**A:** 请升级 Node.js 到 18.0.0 或更高版本。推荐使用 [nvm](https://github.com/nvm-sh/nvm)（macOS/Linux）或 [nvm-windows](https://github.com/coreybutler/nvm-windows)（Windows）管理 Node.js 版本。

### 证书相关

#### Q: 浏览器提示"您的连接不是私密连接"？

**A:** 这是因为使用了自签名证书。请运行以下命令安装并信任开发证书：
```bash
npx office-addin-dev-certs install
```

如果已经安装过，可以尝试重新安装：
```bash
npx office-addin-dev-certs install --force
```

#### Q: macOS 上证书安装失败？

**A:** 尝试手动信任证书：
1. 打开"钥匙串访问"应用
2. 找到 "localhost" 证书
3. 双击打开，展开"信任"
4. 将"使用此证书时"改为"始终信任"

### 插件加载相关

#### Q: `npm run start:excel` 报错？

**A:** 请确保：
1. 开发服务器正在运行（`npm run dev`）
2. 已安装 Microsoft Office（不是 WPS）
3. 尝试以管理员身份运行命令提示符

#### Q: 插件加载后显示空白？

**A:** 请检查：
1. 开发服务器是否正在运行
2. 浏览器控制台是否有错误（按 F12 打开）
3. 尝试清除 Office 缓存后重新加载

清除 Office 缓存（Windows）：
```
%LOCALAPPDATA%\Microsoft\Office\16.0\Wef\
```

清除 Office 缓存（macOS）：
```
~/Library/Containers/com.microsoft.Excel/Data/Documents/wef
```

#### Q: 在 Office 中找不到"考勤表生成器"按钮？

**A:** 
1. 确保插件已正确加载
2. 检查是否在"开始"选项卡
3. 尝试重启 Office 应用
4. 检查 manifest.xml 文件路径是否正确

### 功能相关

#### Q: 自然语言识别不准确？

**A:** 
1. 尝试使用更明确的描述，如"生成2024年1月的月度考勤表"
2. 可以在 `.env` 中开启调试模式查看识别结果：
   ```env
   VITE_DEBUG=true
   ```
3. 如果需要更智能的识别，可以配置 OpenAI API（可选）

#### Q: 如何导入已有的考勤数据？

**A:** 
1. 准备 CSV 或 Excel 格式的考勤数据
2. 在插件界面点击"导入数据"
3. 选择文件并确认导入

### 开发相关

#### Q: 如何添加新的考勤表模板？

**A:** 
1. 在 `public/templates/` 目录下创建新的 JSON 模板文件
2. 参考现有模板的格式
3. 在模板引擎中注册新模板

#### Q: 如何调试 Office.js API？

**A:** 
1. 在 Office 应用中按 F12 打开开发者工具
2. 在 Console 中可以直接调用 `Office.context` 等 API
3. 使用 `console.log` 输出调试信息

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────┐
│           用户界面 (React)               │
├─────────────────────────────────────────┤
│           业务逻辑层                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │   NLP   │ │  模板   │ │  生成器  │   │
│  └─────────┘ └─────────┘ └─────────┘   │
├─────────────────────────────────────────┤
│         Office.js 适配层                 │
│  ┌─────────────┐ ┌─────────────┐       │
│  │   Excel     │ │    Word     │       │
│  └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────┘
```

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0 | 前端框架 |
| TypeScript | 5.3.3 | 类型安全 |
| Fluent UI | 9.46.0 | UI 组件库（微软风格） |
| Office.js | 1.1.86 | Office 集成 API |
| Vite | 5.0.10 | 构建工具 |
| Vitest | 1.1.0 | 测试框架 |
| Chart.js | 4.4.1 | 图表生成 |
| Zustand | 4.4.7 | 状态管理 |
| date-fns | 3.2.0 | 日期处理 |
| Tailwind CSS | - | 样式框架 |

---

## 📚 文档

更多详细文档请查看 `docs` 目录：

- [架构设计](./docs/ARCHITECTURE.md) - 系统架构和技术选型
- [项目结构](./docs/PROJECT_STRUCTURE.md) - 详细的目录结构说明
- [数据模型](./docs/DATA_MODELS.md) - 核心数据类型定义
- [用户指南](./docs/USER_GUIDE.md) - 使用说明和示例
- [开发指南](./docs/DEVELOPMENT.md) - 开发环境和规范

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件