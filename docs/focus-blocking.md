# 自用网站拦截

Chrome 构建从 `src/common/focus-policy.json` 生成固定请求规则。B 站完整屏蔽，YouTube Music 和知乎专栏放行。提醒文案在 `src/pages/focus.html`，没有临时放行入口。只拦截主页面导航；标签页监听补充已打开页面与站内 URL 变化。不拦截应用或其他浏览器，也不保证阻止嵌入其他站点的视频。

网站导航现在仅携带固定域名标识，例如 `pages/focus.html?site=bilibili.com`，不记录原始路径和搜索词。`src/pages/focus-messages.js` 维护网站分类和完整文案：B 站 6 条、知乎 5 条，其余类别及通用提醒各 3 条。每次新导航在对应组中随机选择，排除该网站上次显示的条目；刷新或后退重开沿用当前标签页的条目。直接打开无参数地址、参数未知时显示通用提醒。

最近一条的索引保存在扩展 localStorage，当前标签页的索引保存在 sessionStorage；没有访问次数统计和远程请求。存储不可用时仍显示文案，但不保证去重和刷新稳定。

运行 `bash scripts/build-chrome-local.sh` 发布到 `D:\temp\surfingkeys-build`，随后重载 Chrome 中的 `surfingkeys-ifnk`。

## 2026-10-09 测试环境

为了排除 Cold Turkey 干扰，Chrome 中的 Cold Turkey Blocker 扩展被禁用。Windows 服务 `Power_a17007` 原先为自动启动，测试时设为禁用并停止；其 `ServiceHub.Helper` 辅助进程被结束。未卸载软件，未修改其数据库。服务启动方式不自动恢复，以便继续手动测试。

需要恢复 Cold Turkey 时，在管理员 PowerShell 中运行：

```powershell
Set-Service -Name Power_a17007 -StartupType Automatic
Start-Service -Name Power_a17007
```

同时在 Chrome 扩展管理页重新启用 Cold Turkey Blocker。原屏蔽配置仍保留，恢复后可能重新生效。

## 验证

2026-10-09 后续按用户要求卸载 Cold Turkey：官方卸载程序返回 0，清理了残留的 `Power_a17007` 服务和计划任务、Edge 原生通信进程及安装目录；Chrome 扩展已移除。旧配置与统计数据目录保留，配置备份在 `D:\temp\cold-turkey-uninstall-backup`。上面的服务恢复命令已不适用，恢复软件需要重新安装。卸载后再次打开 B 站，仍跳转到 Surfingkeys 的 B 站专属提醒页。

- Chrome 实际打开 B 站首页和视频地址，跳转至本扩展提醒页。
- Chrome 实际点击关闭按钮，测试标签页关闭。
- 浏览器 `testMatchOutcome` 验证 26 条屏蔽规则、2 条例外均匹配；查询参数中出现域名不会误拦截。
- 新增 15 项域名边界和标签页重定向测试通过，原后台 246 项测试通过。
- 提醒页控制台检查无输出，1920 像素窗口无水平溢出。
- 截图保存至 `D:\temp\surfingkeys-focus-preview.png`。
