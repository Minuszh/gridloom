# Illustrator 实时预览排查记录

[测试说明](testing.md) · 更新于 2026-11-12

2026-11-07 22:28 的报告：Illustrator 30.8.2 / Apple Silicon，主线程 EXC_BAD_ACCESS，调用链经过 PlugPlugOwl、AdobeExtendScript、ScriptingSupport 和 Illustrator 原生代码。用户确认触发动作是拖动滑条或修改参数。报告不包含 JavaScript 行号，不能据此确定唯一根因。

检查发现旧实时预览跨 CEP 调用保存原生 PathItem 和 GroupItem 引用，并重复调用 setEntirePath。已改为保存 UUID、每次查找对象，以及移动已有路径的端点。取消和组清理重新查询对象，跳过已删除对象；文档关闭后丢弃会话。预览默认关闭，用户点击底部眼睛后开启，300ms 合并更新。0.5.0 包含该修改。

当前自动测试覆盖 89 项及浏览器交互；尚未在原生 Illustrator 上重现和确认修复。验证时先使用空白测试文档，打开面板后默认不修改文档；开启预览后测试数量增减、应用、关闭预览。若仍崩溃，保留触发动作与新报告继续定位。

InDesign 的预览使用独立宿主实现：记录普通数据和页面 / 文档 ID，每次重新读取原生对象，显式分派更新、提交、取消。临时文档已验证连续预览与取消恢复；这些结果不等同于 Illustrator 崩溃已彻底消除。
