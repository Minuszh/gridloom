# Changelog / 更新记录

历史条目记录当时行为，不代表当前界面。此前公开包已由本次测试版替代。
Historical entries describe behavior at the time. The previous package is superseded by this pre-release.

## 0.5.0 Pre-release / 测试版 — 2026-11-12

- Illustrator 与 InDesign 共用实时预览流程；InDesign 原生预览更新、应用和取消恢复通过临时文档测试。
  Shared live-preview workflow; native InDesign update, commit and cancellation checks passed on temporary documents.
- 添加水平 / 垂直中心线、镜像内外边距，以及中心线与网格位置的紧凑分割布局。
  Add horizontal/vertical center lines, mirrored book margins, and a compact split control row.
- 面板高度包含书籍模式与底部操作，切换标签不再缩短。
  Include book controls and footer in panel height; do not shrink on tab changes.
- 使用新图标，停靠栏图形缩至 85%；签名包在开发模式关闭时安装到两个宿主。
  New icon at 85% scale; signed package installed for both hosts with debug mode off.
- 重写中英文 README 和安装、测试、签名文档，使用同一组中文实机截图，归档旧包和旧截图。
  Rewrite bilingual documentation, share Chinese native screenshots, and archive old packages and images.

## 0.5.0 — 2026-11-07（已撤回 / withdrawn）

- 紧凑面板、单层预设滚动、中英文自动匹配，英文简写语法标注维护中。
  Compact panel, one preset scroll area, automatic Chinese/English UI, and English shorthand notation marked under maintenance.
- 网格参数随文档保存；会话内切换画板保留输入。
  Store applied grid settings in the document and preserve inputs when switching artboards within a session.
- InDesign 测试支持，读取页边距、分栏及版面字格。
  Experimental InDesign support with page margin, column, and layout grid import.
- 实时预览默认关闭，合并连续修改；锁定时关闭预览。原生崩溃修复仍待验证。
  Live preview starts off, coalesces edits, and stops when locking. Native crash resolution remains unverified.
- 清理废弃表单恢复分支、旧工具栏样式、重复包装与过时注释。
  Remove unused form restoration branches, toolbar styles, redundant wrappers, and outdated comments.

## 0.3.17 — 2026-11-07

- 位置改为九宫格，书籍模式改为分段按钮；设置固定展开。
  Use a nine-point position control and segmented book buttons in a fixed settings section.
- 默认窗口高度增加到 540，移除设置标题下横线。
  Increase the default panel height to 540 and remove the divider below the settings heading.

## 0.3.16 — 2026-11-07

- 书籍模式自动添加中间分隔参考线，重合线去重。
  Add a deduplicated central guide in book mode.
- 默认展开位置与设置，移除生成方式、取消和外边界选项。
  Expand settings by default and remove write mode, Cancel, and outer-edge controls.

## 0.3.15 — 2026-11-07

- 参数变化时自动实时编辑，移除勾选框；错误提示不再预留空白。
  Start live editing on parameter changes, remove the checkbox and unused status space.
- 尺寸输入支持方向键增减 1，并保留单位和边距联动。
  Arrow keys step dimensions by 1, preserving units and linked margins.

## 0.3.14 — 2026-11-07

- 数量框支持直接输入，点击滑条图标展开灰度滑条。
  Enter counts directly or expand a grayscale slider with the slider icon.
- 添加实时编辑、应用与取消；拖动复用参考线，并合并连续更新。
  Add live editing, Apply, and Cancel; reuse guides and coalesce rapid updates.
- 支持普通网格、书籍模式与自定义语法的实时调整。
  Live editing supports regular grids, book layouts, and custom notation.

## 0.3.13 — 2026-11-07

- 添加左右 / 上下双页书籍模式，支持普通网格、自定义语法、快捷线与预设。
  Add left/right and top/bottom book layouts for grids, notation, quick guides, and presets.
- 移除小数位数、参考线长度、对象边界与清理对象设置。
  Remove precision, guide length, object bounds, and clear target controls.

## 0.3.12 — 2026-11-07

- 分组名称仅保留画板名，移除时间。
  Use artboard names for groups, without timestamps.
- 预设首次打开时绘制；复用状态图标，合并预设加载逻辑，清理重复样式。
  Render presets on first visit, reuse state icons, share preset loading, and remove redundant styles.
- 更新双语 README 排版。
  Refresh both README layouts.

## 0.3.11 — 2026-11-07

- 每次生成独立分组，以画板名和时间命名。替换和清理自动移除空分组。
  Each generation creates an artboard-named, timestamped group. Replacement and clearing remove empty groups.
- 精简 README，Codex 开发说明移到简介前。
  Shorten both READMEs and move the Codex credit above the introduction.

## 0.3.10 — 2026-11-07

- 采用 GPL-3.0-only，精简中英文 README。
  Adopt GPL-3.0-only and simplify both READMEs.

- 仅显示错误状态，隐藏普通计数、处理中和成功消息；保留固定状态区高度，避免消息变化导致布局跳动。
  Show errors only; hide routine counts, progress text, and success messages. Preserve status-area height to avoid layout shifts.
- 维护中英文 README、GitHub 分发指南和 Codex 协作开发说明。
  Add bilingual READMEs, GitHub distribution guides, and Codex development attribution.

## 0.3.9 — 2026-11-07

- 图层锁定 / 显示按钮反映真实状态，灰度和图标区分，聚焦同步。
  Layer lock / visibility controls reflect actual state through grayscale and icons, refreshed on focus.
- 追加跳过已有路径扫描，复用未变化的几何结果，合并重复刷新。
  Skip existing-path scans when appending, reuse unchanged geometry, and coalesce refreshes.

## 0.3.8 — 2026-11-07

- 中间内容独立滚动，顶部工具和底部操作固定。
  Scroll middle content independently while keeping top tools and bottom actions fixed.

## 0.3.7 — 2026-11-07

- 预设卡片与第一格添加入口；加入锁定操作（0.3.9 改为图层控制）。
  Preset cards with an add tile; lock action added (changed to layer control in 0.3.9).

## 0.3.1–0.3.6 — 2026-11-07

- 修正零行列边距、原生参考线检查、名称小写、标签稳定性和自动绘制范围；完善语法说明与经典预设。
  Improve zero-count margins, native-guide checks, lowercase naming, stable tabs, automatic scope, notation help, and classic presets.
