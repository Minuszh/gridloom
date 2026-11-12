# Install gridloom

[中文](installing.md) · [README](../README.en.md)

## Signed package

1. Install the supplied `.zxp` with a CEP-compatible ZXP installer.
2. Save your documents and restart the Adobe application.
3. Open **Window → Extensions → gridloom**.

One package serves Illustrator and InDesign on macOS and Windows. Native installation has been tested on macOS. Signed packages do not need CEP debug mode. There is no automatic updater.

## Install from source

Use Node.js 22 or newer. Run these commands in the repository; no dependency installation is needed:

```sh
npm run build
npm run install:dev
```

The script copies `dist/` into the current user's CEP extension directory. Unsigned source builds require debug mode.

### macOS · Illustrator / InDesign

```sh
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```

Development folder: `~/Library/Application Support/Adobe/CEP/extensions/studio.gridloom.panel`.

### Windows · Illustrator / InDesign

Run in Command Prompt:

```bat
reg add HKCU\Software\Adobe\CSXS.12 /v PlayerDebugMode /t REG_SZ /d 1 /f
```

Development folder: `%APPDATA%\Adobe\CEP\extensions\studio.gridloom.panel`.

Restart each host and open its Extensions menu. Move the development folder out before switching to a signed installation, so an older copy cannot shadow it.

## Turn debug mode off

macOS:

```sh
defaults write com.adobe.CSXS.12 PlayerDebugMode 0
```

Windows:

```bat
reg add HKCU\Software\Adobe\CSXS.12 /v PlayerDebugMode /t REG_SZ /d 0 /f
```

Restart and use the signed package. Debug mode applies to all CEP 12 extensions, not only gridloom.

## Local installation record

On 2026-11-12 Adobe UnifiedPluginInstallerAgent installed the signed package and listed gridloom as enabled in Illustrator 30.8.2 and InDesign 21.6.0. Debug mode was off. Every file under `/Library/Application Support/Adobe/CEP/extensions/gridloom` matched the build.

An installer may leave a same-version package unchanged. If the old interface persists, remove gridloom through the installer, install the new package, and restart.
