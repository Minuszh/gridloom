# 构建、签名与发布

[English](releasing.en.md) · [README](../README.md)

源码版本仍为 `0.5.0`。2026-11-12 构建作为 v0.5.0 测试版发布，替代此前撤下的包。更新源码、签名、安装和公开发布是分别执行的步骤。

## 准备

1. 同步 `package.json` 与 `CSXS/manifest.xml` 版本。
2. 更新两份 README、文档和 CHANGELOG；中英文 README 共用 `docs/images/` 三张实机截图。
3. 执行 `npm test`、`npm run check`、`npm run build`、`npm run test:ui`。
4. 确认待打包内容与计划分发的源码一致。

## 签名

工具：[Adobe ZXPSignCmd](https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD)。对 `dist/` 签名，使用仓库外保存的证书和密码，输出到 `release/`。发布包名为 `gridloom-0.5.0.zxp`，`SHA256SUMS.txt` 记录安装包与源码 ZIP 的校验值。

签名时使用可用的时间戳服务。完成后执行：

```sh
ZXPSignCmd -verify release/gridloom-0.5.0.zxp -certinfo
```

当前证书为自签名，签名和时间戳验证通过；这不代表经过 Adobe Marketplace 审核。

## 安装验证

关闭 CEP 12 开发模式，移走旧开发目录，用 ZXP 安装器安装，重启两个宿主。逐文件核对安装目录与 `dist/`，检查面板加载、图标、生成、预览和书籍边距。同版本未被覆盖时，先卸载再安装。

## 公开发布

维护者明确决定发布后，再提交源码、创建或核对标签、导出对应源码 ZIP，将 ZXP、源码和校验值上传 Release。发布说明写明实际测试平台。没有自动发布或自动更新流程。

`release/` 只保留当前本地包；旧包归档在仓库外，不作为当前下载入口。
