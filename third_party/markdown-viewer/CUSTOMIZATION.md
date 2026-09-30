# 自用版 Markdown Viewer

基于 [simov/markdown-viewer](https://github.com/simov/markdown-viewer) 5.3，保留原项目的 MIT 许可证。

## 改动

- 内置 Mermaid 12.0.0，使用 `redux-color` / `redux-dark-color` 主题与 `neo` 外观。
- 流程图用 Dagre 排版，节点间距 30、层级间距 35、图外边距 8；时序图参与者间距 20、最小宽度 120。
- 修复原构建脚本中 `node-sass` 与新 Node 版本不兼容的问题，改用 Dart Sass。
- 在页面 `<html>` 的 `data-markdown-viewer-mermaid-*` 属性中记录版本、主题、外观、布局、密度、状态、图数量和错误，便于 CDP 查看。

## 构建与加载

需要 Node.js 22.12 或更高版本、npm、zip、unzip、rsync。执行 `bash scripts/publish-chrome-local.sh`，会构建并复制到 `D:\temp\markdown-viewer-mermaid12`，供 Chrome 手动加载；同时生成同名 ZIP。可用 `MARKDOWN_VIEWER_CHROME_BUILD_DIR` 修改目标目录。`sh build/package.sh chrome` 只构建项目根目录下的 `markdown-viewer.zip`，其中包含可加载的 `markdown-viewer/` 目录。

在 `chrome://extensions` 开启开发者模式，选择“加载已解压的扩展程序”，指向解压后的 `markdown-viewer` 目录，并允许访问文件网址。测试同一个 `.md` 文件时，先停用原版 Markdown Viewer，以免两个扩展同时处理页面。

加载后可在浏览器控制台读取 `document.documentElement.dataset` 中以 `markdownViewerMermaid` 开头的字段，或通过 CDP 读取同一 DOM 属性。`ready` 表示 Mermaid 返回 SVG；它不代表已确认每张图的排版都符合阅读需要。
