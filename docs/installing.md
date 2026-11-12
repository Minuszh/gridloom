# 安装 gridloom

[English](installing.en.md) · [README](../README.md)

## 签名安装包

1. 将收到的 `.zxp` 交给支持 CEP 的 ZXP 安装器安装。
2. 保存文档，退出并重新打开 Adobe 软件。
3. 打开「窗口 → 扩展功能 → gridloom」。

Illustrator 和 InDesign 使用同一安装包。macOS 与 Windows 均使用 ZXP；当前实机安装验证在 macOS 上完成。签名包无需开启 CEP 开发模式。当前没有自动更新功能。

## 从源码安装

安装 Node.js 22 或更新版本，在仓库目录运行；无需 `npm install`：

```sh
npm run build
npm run install:dev
```

安装脚本把 `dist/` 复制到当前用户的 CEP 扩展目录。未签名源码构建需要开发模式。

### macOS · Illustrator / InDesign

```sh
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```

开发版位置：`~/Library/Application Support/Adobe/CEP/extensions/studio.gridloom.panel`。

### Windows · Illustrator / InDesign

在命令提示符运行：

```bat
reg add HKCU\Software\Adobe\CSXS.12 /v PlayerDebugMode /t REG_SZ /d 1 /f
```

开发版位置：`%APPDATA%\Adobe\CEP\extensions\studio.gridloom.panel`。

两种系统都需重启宿主。Illustrator 与 InDesign 分别从各自的「窗口 → 扩展功能」打开面板。已有的开发版与签名版不要并存；切换到签名包前移走上述开发目录，以免加载到旧文件。

## 关闭开发模式

macOS：

```sh
defaults write com.adobe.CSXS.12 PlayerDebugMode 0
```

Windows：

```bat
reg add HKCU\Software\Adobe\CSXS.12 /v PlayerDebugMode /t REG_SZ /d 0 /f
```

重启后使用签名安装包。开发模式是 CEP 12 的全局开关，不只影响 gridloom。

## 本地安装记录

2026-11-12：签名包通过 Adobe UnifiedPluginInstallerAgent 安装，Illustrator 30.8.2 与 InDesign 21.6.0 均登记为启用。开发模式关闭。安装目录为 `/Library/Application Support/Adobe/CEP/extensions/gridloom`，已逐文件核对与构建一致。

安装器可能不覆盖同版本包。更新后仍显示旧界面时，用安装器移除 gridloom，再安装新包并重启软件。
