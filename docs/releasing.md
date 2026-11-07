# GitHub 仓库与分发

[English](releasing.en.md) · [返回 README](../README.md)

源码仓库：`https://github.com/Minuszh/gridloom`。发布时从已提交的源码构建安装包。

## 1. 首次创建仓库（已创建时跳过）

在 GitHub 新建空仓库 `gridloom`，不要自动生成 README、LICENSE 或 .gitignore。选择公开或私有仓库。

在项目目录检查文件后提交，再关联远程。将 `YOUR_ACCOUNT` 换成你的 GitHub 用户名或组织名：

```sh
git status --short
git add LICENSE README.md README.en.md CHANGELOG.md .gitignore AGENTS.md package.json index.html CSXS assets src host scripts test docs
git diff --cached --stat
git commit -m "Initial gridloom preview"
git remote add origin https://github.com/YOUR_ACCOUNT/gridloom.git
git push -u origin main
```

如果 `origin` 已存在，先用 `git remote -v` 检查，不要重复添加。`dist/` 由构建生成，不提交；签名证书、密码与本地环境文件也不提交。源码和安装包都包含 `LICENSE`。

## 2. 发布前验证

1. 同步 `package.json` 和 `CSXS/manifest.xml` 中的版本，并更新双语 README 与 CHANGELOG。
2. 执行下列检查。
3. 在计划支持的平台上实测安装、重启加载、创建、替换、清理、锁定和显示。注明未测试的系统或版本。

```sh
npm test
npm run check
npm run build
npm run test:ui
```

浏览器测试需要 Google Chrome；运行环境与实现范围见 README。项目采用 GPL-3.0-only，发布安装包时一并提供对应源码。

## 3. 构建与签名

开发测试可以按 README 从源码安装。面向普通用户，使用 Adobe 的 `ZXPSignCmd` 把 `dist/` 签名为 `.zxp`，不要仅把 ZIP 改后缀。

从 [Adobe CEP Resources](https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD) 获取适合平台的签名工具。准备签名证书（可使用工具创建自签名证书），将证书保存在仓库外。按 [Adobe 打包指南](https://github.com/Adobe-CEP/Getting-Started-guides/blob/master/Package%20Distribute%20Install/readme.md) 配置证书与可用时间戳服务。

下面是 macOS / Linux shell 的签名示例：先将 `GRIDLOOM_CERT_PATH`、`GRIDLOOM_CERT_PASSWORD`、`GRIDLOOM_TSA_URL` 设为本地证书路径、密码和时间戳服务地址，确保工具在 PATH 中。不要将实际密码写入文档、脚本或 Git。

```sh
mkdir -p release
ZXPSignCmd -sign dist release/gridloom-0.3.12.zxp "$GRIDLOOM_CERT_PATH" "$GRIDLOOM_CERT_PASSWORD" -tsa "$GRIDLOOM_TSA_URL"
ZXPSignCmd -verify release/gridloom-0.3.12.zxp
```

签名验证不等于功能验证。使用兼容的 CEP ZXP 安装器在关闭 `PlayerDebugMode` 的测试环境中验证该包，再在发布说明中写明所用安装器及其官方地址。当前项目没有内置安装器或自动更新功能，0.3.12 安装包已通过签名和时间戳验证，安装器实机验收待完成。

## 4. 上传 GitHub Release

1. 提交已验证的源代码，用其提交创建 `v0.3.12` 标签。
2. 打开仓库 **Releases → Draft a new release**，选定标签与对应提交。
3. 填写中英文更新说明、安装步骤、支持 / 已验证环境和已知限制。
4. 附加 `gridloom-0.3.12.zxp`。可同时附上 SHA-256 校验文件；如提供未签名 ZIP，明确标注仅供开发测试。
5. 首轮勾选 **This is a pre-release**，检查草稿后发布。

GitHub 自动生成的源码 ZIP 不是扩展安装包。发布后的包对应固定源码提交；后续修复使用新版本和新标签。参见 [GitHub 官方 Release 指南](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)。

## 5. 后续维护

每次发布同步中英文文档；把实际宿主测试与模拟测试分别记录。证书密码可在未来签名工作流中通过 GitHub Secrets 注入，但当前仓库没有自动签名或发布工作流。发布包必须从已检查的源码构建。
