# 测试与本地安装

## 自动检查

需要 Node.js 22+；无需安装依赖。

```sh
npm test
npm run check
npm run build
npm run test:ui
```

界面测试需要 Google Chrome，也可通过 `CHROME_BIN` 指定路径。87 项单元与宿主模拟测试覆盖计算、语法、预设、范围校验、失败恢复和文档参数读取。Chrome 回归覆盖中英文、窄面板、单层滚动、滑条、预览队列及会话恢复。

## 浏览器预览

运行 `npm run preview`，打开 `http://127.0.0.1:4173`。`?lang=zh` 和 `?lang=en` 切换语言。浏览器使用示例画板，不能修改 Adobe 文档。

## 开发安装

构建后执行 `npm run install:dev`。未签名开发版需要开启 CEP 12 开发模式。

macOS：

```sh
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```

Windows：

```bat
reg add HKCU\Software\Adobe\CSXS.12 /v PlayerDebugMode /t REG_SZ /d 1 /f
```

重开 Illustrator 或 InDesign，在「窗口 → 扩展功能」打开 gridloom。macOS 安装目录为 `~/Library/Application Support/Adobe/CEP/extensions/studio.gridloom.panel`；Windows 为 `%APPDATA%\Adobe\CEP\extensions\studio.gridloom.panel`。

## 实机检查

1. A2 画板，边距 24mm、12 列、间距 6mm、0 行，列宽应为 25.5mm，上下仍有边距线。
2. 应用两次，当前范围的 gridloom 网格被替换，手动画的参考线保留。
3. 选中对象使用对象边界；取消选择使用当前画板。切换范围不覆盖输入。
4. 左右或上下书籍模式分别生成两套网格，并有中线。
5. 开启底部眼睛预览，连续调整数量后应用；锁定图层会关闭预览。
6. 应用后保存文档，关闭软件再打开，首次读取对应范围应恢复参数。
7. InDesign 首次读取当前页边距和分栏；在预设页检查版面字格。InDesign 暂不支持实时预览，参考线延伸至整页。

## 0.5.0 验证范围

单元测试、宿主模拟、浏览器回归及构建检查通过。此前 InDesign 临时文档已验证原生参考线创建、替换、页边距、分栏、图层状态和对象所属页面判断。

完整保存重开实机测试尚未完成：Illustrator AppleEvent 超时；InDesign 临时文件保存失败。参数持久化目前通过宿主重载与面板新会话模拟验证。实时预览的原生崩溃修复仍需实机确认，详见 [排查记录](crash-investigation.md)。
