# Markdown Viewer 集成

此目录是 Surfingkeys 内部 Markdown 阅读器的源码。Mermaid 配置及交互位于 `content/mermaid.js`；Markdown 页面的识别、配置和脚本注入位于 `../../src/background/markdown-viewer.js`。

从仓库根目录运行 `bash scripts/build-chrome-local.sh`，脚本会在本目录生成 `vendor/`、`themes/` 等构建产物，再将整个 Chrome 扩展发布到 `D:\temp\surfingkeys-build`。构建不读取仓库外的 `markdown-viewer-custom`。

本目录保留原 Markdown Viewer 的许可证 `LICENSE`。原始项目：https://github.com/simov/markdown-viewer
