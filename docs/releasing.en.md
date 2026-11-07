# GitHub repository and distribution

[中文](releasing.md) · [Back to README](../README.en.md)

Local Git has been initialized on `main`, with no commits or remote configured yet. These are instructions to follow, not a record of an upload or release.

## 1. Create the repository

Create an empty GitHub repository named `gridloom`, without generating a README, LICENSE, or .gitignore. Choose public or private visibility.

Inspect the project, commit it, and connect the remote. Replace `YOUR_ACCOUNT` with your GitHub username or organization:

```sh
git status --short
git add LICENSE README.md README.en.md CHANGELOG.md .gitignore AGENTS.md package.json index.html CSXS assets src host scripts test docs
git diff --cached --stat
git commit -m "Initial gridloom preview"
git remote add origin https://github.com/YOUR_ACCOUNT/gridloom.git
git push -u origin main
```

If `origin` already exists, inspect `git remote -v` instead of adding it again. Do not commit generated `dist/`, signing certificates, passwords, or local environment files. Include `LICENSE` with source and release packages.

## 2. Validate before release

1. Synchronize versions in `package.json` and `CSXS/manifest.xml`, both READMEs, and CHANGELOG.
2. Run the checks below.
3. Test installation, restart/loading, creation, replacement, clearing, locking, and visibility on the intended platforms. Identify untested systems and versions.

```sh
npm test
npm run check
npm run build
npm run test:ui
```

Browser tests require Google Chrome. See README for environment details and implementation limits. The project uses GPL-3.0-only; distribute corresponding source alongside release packages.

## 3. Build and sign

Developers can install from source using README. For end users, sign `dist/` into a `.zxp` using Adobe's `ZXPSignCmd`; renaming a ZIP is not signing.

Download the platform-specific tool from [Adobe CEP Resources](https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD). Prepare a signing certificate (the tool can create a self-signed certificate), stored outside the repository. Follow [Adobe's packaging guide](https://github.com/Adobe-CEP/Getting-Started-guides/blob/master/Package%20Distribute%20Install/readme.md) for certificate and timestamp-service setup.

For the macOS / Linux shell example below, set `GRIDLOOM_CERT_PATH`, `GRIDLOOM_CERT_PASSWORD`, and `GRIDLOOM_TSA_URL` to the local certificate path, password, and timestamp service URL, and put the tool on PATH. Never put the actual password in documentation, scripts, or Git.

```sh
mkdir -p release
ZXPSignCmd -sign dist release/gridloom-0.3.10.zxp "$GRIDLOOM_CERT_PATH" "$GRIDLOOM_CERT_PASSWORD" -tsa "$GRIDLOOM_TSA_URL"
ZXPSignCmd -verify release/gridloom-0.3.10.zxp
```

Signature verification is not functional testing. Install the package using a compatible CEP ZXP installer in a test environment with `PlayerDebugMode` disabled. Include the tested installer's name and official link in the release notes. The project currently has no bundled installer, automatic updates, or verified signed package.

## 4. Upload a GitHub Release

1. Commit validated source and tag that commit `v0.3.10`.
2. Open **Releases → Draft a new release** and choose the tag and intended commit.
3. Provide Chinese and English release notes, installation steps, supported / tested environments, and known limitations.
4. Attach `gridloom-0.3.10.zxp`. Optionally add SHA-256 checksums. Label any unsigned ZIP as development-only.
5. Select **This is a pre-release** for the initial release, review the draft, and publish.

GitHub's generated source ZIP is not an extension installer. Release packages should correspond to a fixed source commit; later fixes need a new version and tag. See [GitHub's release guide](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository).

## 5. Maintenance

Keep both language versions synchronized. Record native testing separately from simulations. A future signing workflow can use GitHub Secrets for credentials; there is currently no automatic signing or publishing workflow. Build release packages only from reviewed source.
