<!--
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2026-01-02 23:43:52
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
-->

# 解决 "Skip debugging because there is already a debug session" 问题的方案

这个问题很可能是由于 "Office Add-ins Development Kit" 扩展的缓存或内部状态损坏导致的。以下是解决此问题的两种方案。

---

## 方案一：彻底卸载并重新安装扩展

这是首选方案，因为它能彻底清除扩展的残留数据。

### 步骤 1：卸载扩展

1.  在 VS Code 中，打开 **扩展** 视图（快捷键 `Ctrl+Shift+X`）。
2.  搜索 "Office Add-ins Development Kit"。
3.  点击该扩展旁边的 **卸载** 按钮。
4.  **完全关闭所有 VS Code 窗口** 以确保扩展进程完全终止。

### 步骤 2：手动清除扩展缓存

为了确保完全清除，需要手动删除扩展的缓存文件夹。

1.  打开文件资源管理器。
2.  在地址栏输入 `%USERPROFILE%\.vscode\extensions` 并按回车。
3.  在此文件夹中，查找并 **删除** 任何与 `msoffice.microsoft-office-add-in-debugger` 相关的文件夹。文件夹名称可能包含版本号。

### 步骤 3：重新安装扩展

1.  重新打开 VS Code。
2.  返回 **扩展** 视图。
3.  再次搜索 "Office Add-ins Development Kit" 并点击 **安装**。
4.  重新启动 VS Code。

完成这些步骤后，再次尝试启动调试会话。

---

## 方案二：使用纯命令行进行开发和调试（替代方案）

如果方案一无法解决问题，或者您希望摆脱对该扩展的依赖，可以完全通过命令行来管理您的 Office 加载项。

### 步骤 1：启动开发服务器

在您的项目根目录下，打开终端并运行以下命令来启动开发服务器：

```bash
npm run dev
```

### 步骤 2：旁加载加载项

为了让 Office 客户端（如 Excel, Word）能加载您的开发版本加载项，您需要使用 `office-addin-dev-settings` 工具。

1.  打开 **另一个** 终端窗口。
2.  运行以下命令来旁加载您的加载项清单文件：

    ```bash
    npx office-addin-dev-settings sideload manifest.xml
    ```

    **注意：**
    - `manifest.xml` 是您的加载项清单文件，请确保路径正确。
    - 此命令会将您的加载项注册到 Office 客户端中。

### 如何停止旁加载

当您完成开发后，可以使用以下命令移除旁加载的加载项：

```bash
npx office-addin-dev-settings remove manifest.xml
```

这个方案完全绕过了 VS Code 扩展，因此不会受到扩展本身问题的干扰。
