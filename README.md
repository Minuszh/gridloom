# gridloom

**中文 · [English](README.en.md)**

本插件使用 Codex 完成开发。

为 Adobe Illustrator 绘制网格与参考线的紧凑面板。

**0.3.11** · CEP 12 · 中文 / English · GPL-3.0

## 功能

- 选中对象时，以对象为范围；没有选区时，使用当前画板。
- 设置边距、行列、固定尺寸、间距和对齐，生成 Illustrator 原生参考线。
- 直接输入 `10px`、`3mm`、`5%`，不写单位时跟随文档标尺单位。
- 每次生成独立分组，以画板名称和时间命名，统一放在 `gridloom` 图层下。
- 追加或替换网格，快速添加边界线、中心线，清理当前范围的参考线。
- 13 个内置网格预设；自存预设支持编辑、删除、导入和导出。
- 自定义语法支持变量、弹性空间、重复和分组，见 [语法说明](docs/notation.md)。
- 锁和眼睛控制 `gridloom` 图层，亮色表示锁定 / 显示，灰色表示解锁 / 隐藏。

界面跟随 Illustrator 的语言、字体和主题，使用灰度图标。只有错误显示文字提示，没有悬停提示和常驻计数。

行列数量填 `0` 时仍绘制边距；数量留空并填写固定尺寸时自动填满。`1 px = 1 pt`。若 Illustrator 全局隐藏了参考线，需要在 Illustrator 中重新显示。

## 安装

当前为 CEP 面板版，需要 Illustrator 29.5.1–30.x。已在 macOS Apple Silicon / Illustrator 30.8.2 上测试部分文档操作，其他平台的测试记录见 [测试文档](docs/testing.md)。

本地构建需要 Node.js 22 或更新版本，无需安装依赖。在项目目录运行：

```sh
npm run build
npm run install:dev
```

本地未签名版本需要打开 CEP 12 开发模式。

macOS：

```sh
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```

Windows（命令提示符）：

```bat
reg add HKCU\Software\Adobe\CSXS.12 /v PlayerDebugMode /t REG_SZ /d 1 /f
```

重启 Illustrator，在「窗口 → 扩展」中打开 gridloom。

## 开源协议

采用 [GNU GPL v3.0](LICENSE)（`GPL-3.0-only`）。可以使用、修改和分发，包括商业用途；分发修改版时，需要提供对应源码，并继续使用 GPL-3.0。只在自己电脑上修改和使用，不要求公开代码。
