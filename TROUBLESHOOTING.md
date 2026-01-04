# Office Add-in 故障排除指南

## 常见错误："无法加载该加载项，请确保你具有网络和Internet连接"

这个错误通常由以下原因之一引起：

### 1. 开发服务器未运行

**问题**: 加载项尝试从 `https://localhost:3000` 加载，但开发服务器没有运行。

**解决方案**:

```bash
# 首先安装依赖
npm install

# 生成 SSL 证书（首次运行需要）
npm run certs

# 启动开发服务器
npm run dev
```

### 2. SSL 证书问题

**问题**: Office Add-ins 需要 HTTPS，但 SSL 证书未正确配置。

**解决方案**:

```bash
# 安装开发证书
npm run certs

# 验证证书是否正确安装
npm run certs:verify
```

证书将安装到 `~/.office-addin-dev-certs/` 目录。

### 3. Loopback 豁免问题（Windows）

**问题**: Windows 上的 Edge WebView 需要 loopback 豁免才能访问 localhost。

**解决方案**（需要管理员权限）:

**方法 1: 使用 npm 脚本**

```bash
# 以管理员身份运行 PowerShell 或命令提示符
npm run loopback
```

**方法 2: 手动添加豁免**
以管理员身份运行 PowerShell：

```powershell
CheckNetIsolation.exe LoopbackExempt -a -n="microsoft.win32webviewhost_cw5n1h2txyewy"
```

**方法 3: 使用 Windows 设置**

1. 打开 Windows 设置
2. 搜索 "开发人员设置"
3. 启用 "开发人员模式"

### 4. 防火墙阻止连接

**问题**: Windows 防火墙可能阻止对 localhost:3000 的访问。

**解决方案**:

1. 打开 Windows Defender 防火墙
2. 点击 "允许应用或功能通过 Windows Defender 防火墙"
3. 确保 Node.js 被允许

### 5. 端口被占用

**问题**: 端口 3000 可能被其他应用程序占用。

**解决方案**:

```bash
# Windows - 查找占用端口的进程
netstat -ano | findstr :3000

# 终止进程（替换 PID 为实际进程 ID）
taskkill /PID <PID> /F
```

或者修改 `vite.config.ts` 中的端口号，并同步更新 `manifest.xml`。

## 完整启动流程

### 首次设置

1. **安装依赖**

   ```bash
   npm install
   ```

2. **生成 SSL 证书**

   ```bash
   npm run certs
   ```

3. **添加 Loopback 豁免**（以管理员身份运行）
   ```bash
   npm run loopback
   ```

### 日常开发

**方法 1: 分步启动**

```bash
# 终端 1: 启动开发服务器
npm run dev

# 终端 2: 加载到 Excel（服务器启动后）
npm run sideload:excel
```

**方法 2: 一键启动（推荐）**

```bash
# 启动服务器并自动加载到 Excel
npm run start:excel

# 或者加载到 Word
npm run start:word
```

### 验证服务器运行

在浏览器中访问：

- https://localhost:3000 - 应显示主页
- https://localhost:3000/taskpane.html - 应显示任务窗格

**注意**: 首次访问时浏览器可能显示证书警告，点击 "高级" -> "继续访问" 即可。

## 调试技巧

### 查看控制台日志

1. 在 Excel 中，按 `F12` 打开开发者工具
2. 切换到 "Console" 标签查看日志

### 清除缓存

如果加载项行为异常，尝试清除 Office 缓存：

**Windows**:

```
%LOCALAPPDATA%\Microsoft\Office\16.0\Wef\
```

删除此目录下的所有文件。

### 重新加载加载项

1. 在 Excel 中，转到 "插入" -> "我的加载项"
2. 点击加载项旁边的 "..." 菜单
3. 选择 "删除"
4. 重新运行 `npm run sideload:excel`

## 环境要求

- Node.js 16.x 或更高版本
- npm 8.x 或更高版本
- Microsoft Excel 2016 或更高版本（桌面版）
- Windows 10/11 或 macOS

## 获取帮助

如果以上方法都无法解决问题，请：

1. 检查 [Office Add-ins 官方文档](https://docs.microsoft.com/office/dev/add-ins/)
2. 在项目 Issues 中报告问题，并附上：
   - 错误信息截图
   - 控制台日志
   - 操作系统版本
   - Office 版本

## 在 VS Code 中调试

本项目已配置为可直接在 VS Code 中进行调试，支持 Excel 和 Word 桌面版，并可附加到 Edge WebView 进程。

### 如何开始调试

1.  **启动开发服务器**:
    在开始调试之前，请确保开发服务器正在运行。

    ```bash
    npm run dev
    ```

2.  **打开“运行和调试”视图**:
    - 点击 VS Code 活动栏中的“运行和调试”图标（播放按钮带有一个小虫子）。
    - 或者使用快捷键 `Ctrl+Shift+D`。

3.  **选择并启动调试配置**:
    - 在“运行和调试”视图顶部的下拉菜单中，您会看到以下选项：
      - `Excel Desktop (Windows)`: 启动 Excel 并加载您的加载项。
      - `Word Desktop (Windows)`: 启动 Word 并加载您的加载项。
      - `Edge WebView (Attach)`: 附加到已在运行的加载项的 WebView 进程。
    - 选择您需要的配置，然后点击旁边的绿色“播放”按钮或按 `F5` 启动调试。

4.  **设置断点**:
    - 在您的 TypeScript 代码（例如 `src/taskpane.tsx`）中，点击行号左侧的空白区域即可设置断点。
    - 当代码执行到断点处时，调试器将暂停，您可以检查变量、调用堆栈等。

### 调试场景

- **对于 `Excel Desktop` 或 `Word Desktop`**:
  - 选择相应的配置并按 `F5`。
  - VS Code 将自动打开 Excel 或 Word，并加载您的加载项。
  - 在您的代码中设置的断点将被命中。

- **对于 `Edge WebView (Attach)`**:
  - 此方法用于附加到已在 Office 应用程序中运行的加载项。
  - 首先，通过 `npm run start:excel` 或 `npm run start:word` 启动加载项。
  - 然后，在 VS Code 中选择 `Edge WebView (Attach)` 配置并按 `F5`。
  - 调试器将附加到正在运行的 WebView 实例，允许您调试已加载的代码。这对于在不重启 Office 应用程序的情况下进行快速调试非常有用。
