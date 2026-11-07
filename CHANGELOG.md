# Changelog / 更新记录

0.3.12 为首次公开预发布，早期版本为本地开发记录。
0.3.12 is the first public pre-release; earlier entries document local development.

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
