<div align="center">
    <h1>Style Tweaker</h1>
    <p>
        <img src="https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22style-tweaker%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json" alt="Obsidian Downloads">
        <img src="https://img.shields.io/github/downloads/TracingOrigins/obsidian-style-tweaker-plugin/total?logo=github" alt="GitHub Downloads">
    </p>
    <p>[中文 | <a href="https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/blob/master/README.md">English</a> | <a href="https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/blob/master/README.ru.md">Русский</a>]</p>
    <p><a href="https://community.obsidian.md/plugins/style-tweaker" target="_blank">Style Tweaker</a> 是一个让你对 Obsidian 外观进行精细化调整的 Obsidian 插件——无需编写 CSS 代码片段，即可调整颜色、间距、字体与布局。</p>
</div>

## 功能特性

- **无需编写 CSS** — 从设置界面即可调整颜色、间距、字体与布局，不必手写代码片段
- **实时预览** — 调整即时生效，所见即所得
- **零依赖** — 运行时无外部库，仅使用 Obsidian API
- **多语言界面** — 支持 English、中文、Русский

## 可调整范围

设置界面按以下分组组织，所有更改即时生效：

- **外观** — 界面背景（纯色或壁纸图片）与主题强调色。壁纸按桌面端/移动端、深色/浅色主题分别独立配置，支持逐主题的不透明度、磨砂玻璃模糊与自动切换。
- **界面** — 整体布局（默认 / 边框 / 卡片）、标签栏高亮、桌面与移动端侧边栏、状态栏。
- **编辑器** — 17 组笔记样式：编辑器背景、所在行高亮、页面内标题、属性、标题、内联代码、代码块、分隔线、引用、链接、嵌入、表格、标注、列表、待办与标签。
- **新标签页** — 自定义新标签页：徽标、标题与可交互的粒子徽标特效。
- **插件** — 为内置文件管理器提供样式增强（彩色文件夹、文件/文件夹图标、文件夹徽标），并支持 **Recent Files** 社区插件（文件图标与彩色行）。
- **重置** — 一键将所有设置恢复为默认值。

> **系统要求：** Obsidian 1.13.0 或更高版本。

## 安装

### 从 Obsidian 社区插件安装

1. 打开 **设置 → 第三方插件**
2. 关闭**安全模式**
3. 点击**浏览**，搜索 "Style Tweaker"
4. 安装并启用

### 手动安装

```bash
cd /path/to/vault/.obsidian/plugins
git clone https://github.com/TracingOrigins/obsidian-style-tweaker-plugin.git style-tweaker
cd style-tweaker
npm install && npm run build
```

然后在 **设置 → 第三方插件** 中启用该插件。

## 开发

1. 将 `.env.example` 复制为 `.env`，并设置 `VAULT_PATH` 为你的 Obsidian Vault 路径：
   ```
   VAULT_PATH=C:/Users/YourName/Documents/MyVault
   ```
2. 安装依赖并开始开发：

```bash
npm install        # 安装依赖
npm run dev        # 监听模式（自动部署到 Vault）
npm run build      # 生产构建（自动部署到 Vault）
npm run lint       # 运行 eslint
```

## 支持与帮助

如果这个插件对您有帮助，请考虑：

- ⭐ **给仓库“点星”**
- 🐛 使用 [bug 报告模板](https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/issues/new?template=bug_report.md) 提交错误报告
- 💡 使用 [功能请求模板](https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/issues/new?template=feature_request.md) 提交功能建议
- ❓ 在 [GitHub Issues](https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/issues) 提问或分享想法
- 📝 参阅 [贡献指南](https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/blob/master/docs/contributing/contributing.zh.md)，为本项目贡献代码或文档
- 💰 为开发者提供[赞助](https://support.tracingorigins.top/zh)（如果可用）

## 致谢

本插件的设计与实现参考了以下优秀的开源项目，在此向它们的作者致以诚挚感谢：

| 项目 | 作者 | GitHub | 打赏 |
|------|------|--------|------|
| **Blue Topaz** 主题 | WhyI（[whyt-byte](https://github.com/whyt-byte)） | [PKM-er/Blue-Topaz_Obsidian-css](https://github.com/PKM-er/Blue-Topaz_Obsidian-css) | [Buy Me a Coffee](https://www.buymeacoffee.com/whyi) |
| **AnuPpuccin** 主题 | Anubis（[AnubisNekhet](https://github.com/AnubisNekhet)） | [AnubisNekhet/anuppuccin](https://github.com/AnubisNekhet/anuppuccin) | [Buy Me a Coffee](https://www.buymeacoffee.com/anubisnekhet) |
| **Home Tab Plus** 插件 | Moyf（[Moyf](https://github.com/Moyf)） | [Moyf/home-tab-plus](https://github.com/Moyf/home-tab-plus) | 作者未提供 |
| **Style Context** 插件 | Moyf（[Moyf](https://github.com/Moyf)） | [Moyf/style-context](https://github.com/Moyf/style-context) | 作者未提供 |
| **File Explorer Note Count** 插件 | Ozan Tellioglu（[ozntel](https://github.com/ozntel)） | [ozntel/file-explorer-note-count](https://github.com/ozntel/file-explorer-note-count) | [Ko-fi](https://ko-fi.com/ozante) |
