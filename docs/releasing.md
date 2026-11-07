# 发布

[English](releasing.en.md) · [README](../README.md)

当前公开版本为 **0.5.0**，旧测试 Releases 已撤下。历史提交和标签保留。

1. 同步 `package.json`、`CSXS/manifest.xml`、中英文 README 与 CHANGELOG。
2. 运行 `npm test`、`npm run check`、`npm run build`、`npm run test:ui`。
3. 用 Adobe ZXPSignCmd 对 `dist/` 签名，输出 `gridloom-0.5.0.zxp`，并执行签名验证。
4. 提交源码，创建对应版本标签，从该提交导出源码 ZIP。
5. Release 附加 ZXP、源码 ZIP 和 SHA256SUMS，说明实际测试范围。

签名工具来自 [Adobe CEP Resources](https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD)。证书保存在仓库外，安装包从已提交源码构建。没有自动发布或自动更新流程；后续发布由维护者主动执行。
