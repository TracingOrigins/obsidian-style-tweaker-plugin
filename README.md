<div align="center">
    <h1>Style Tweaker</h1>
    <p>
        <img src="https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22style-tweaker%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json" alt="Obsidian Downloads">
        <img src="https://img.shields.io/github/downloads/TracingOrigins/obsidian-style-tweaker-plugin/total?logo=github" alt="GitHub Downloads">
    </p>
    <p>[<a href="https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/blob/master/README.zh.md">中文</a> | English | <a href="https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/blob/master/README.ru.md">Русский</a>]</p>
    <p><a href="https://community.obsidian.md/plugins/style-tweaker" target="_blank">Style Tweaker</a> is an Obsidian plugin that lets you fine-tune and customize the app's appearance with fine-grained style adjustments — tweak colors, spacing, fonts, and layout without writing your own CSS snippets.</p>
</div>

## Features

- **No CSS required** — tweak colors, spacing, fonts and layout from the settings UI instead of writing snippets
- **Live preview** — every change applies instantly as you adjust it
- **Zero dependencies** — no runtime libraries, only Obsidian APIs
- **Multi-language UI** — English, 中文, Русский

## What you can tweak

The settings tab is grouped into the following pages:

- **Appearance** — interface background (solid colors or wallpaper images) and theme accent colors. Wallpapers are configured independently for desktop/mobile and dark/light themes, with per-theme opacity, frosted-glass blur and automatic switching.
- **Interface** — overall layout (default / border / cards), tab-bar highlighting, desktop and mobile sidebars, and status bar.
- **Editor** — 17 style groups for notes, including editor background, active-line highlight, page title, properties, headings, inline code, code blocks, dividers, blockquotes, links, embeds, tables, callouts, lists, tasks and tags.
- **New tab** — a custom new-tab page with a logo, a title and an interactive particle wordmark.
- **Plugins** — style enhancements for the built-in file explorer (colorful folders, file/folder icons, folder badges) and for the **Recent Files** community plugin (file icons and colorful rows).
- **Reset** — restore every setting to its default with a single click.

All changes take effect immediately from **Settings → Style Tweaker**.

> **Requirements:** Obsidian 1.13.0 or later.

## Installation

### From Obsidian Community Plugins

1. Open **Settings → Community plugins**
2. Disable **Safe mode**
3. Click **Browse** and search for "Style Tweaker"
4. Install and enable

### Manual

```bash
cd /path/to/vault/.obsidian/plugins
git clone https://github.com/TracingOrigins/obsidian-style-tweaker-plugin.git style-tweaker
cd style-tweaker
npm install && npm run build
```

Then enable the plugin in **Settings → Community plugins**.

## Development

1. Copy `.env.example` to `.env` and set `VAULT_PATH` to your Obsidian vault path:
   ```
   VAULT_PATH=C:/Users/YourName/Documents/MyVault
   ```
2. Install dependencies and start developing:

```bash
npm install        # install dependencies
npm run dev        # watch mode (auto-deploys to vault)
npm run build      # production build (auto-deploys to vault)
npm run lint       # run eslint
```

## Support & Feedback

If this plugin helps you, please consider:

- ⭐ **Star the repository**
- 🐛 Report bugs using the [bug report template](https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/issues/new?template=bug_report.md)
- 💡 Request features using the [feature request template](https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/issues/new?template=feature_request.md)
- ❓ Ask questions or share ideas in [GitHub Issues](https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/issues)
- 📝 Read the [contributing guide](https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/blob/master/docs/contributing/contributing.md) and contribute code or docs
- 💰 Donate to the developer at the [support page](https://support.tracingorigins.top/) (if available)

## Credits

This plugin's design and implementation draw inspiration from the following great open-source projects. Special thanks to their authors:

| Project | Author | GitHub | Support |
|---------|--------|--------|---------|
| **Blue Topaz** theme | WhyI ([whyt-byte](https://github.com/whyt-byte)) | [PKM-er/Blue-Topaz_Obsidian-css](https://github.com/PKM-er/Blue-Topaz_Obsidian-css) | [Buy Me a Coffee](https://www.buymeacoffee.com/whyi) |
| **AnuPpuccin** theme | Anubis ([AnubisNekhet](https://github.com/AnubisNekhet)) | [AnubisNekhet/anuppuccin](https://github.com/AnubisNekhet/anuppuccin) | [Buy Me a Coffee](https://www.buymeacoffee.com/anubisnekhet) |
| **Home Tab Plus** plugin | Moyf ([Moyf](https://github.com/Moyf)) | [Moyf/home-tab-plus](https://github.com/Moyf/home-tab-plus) | Not provided by the author |
| **Style Context** plugin | Moyf ([Moyf](https://github.com/Moyf)) | [Moyf/style-context](https://github.com/Moyf/style-context) | Not provided by the author |
| **File Explorer Note Count** plugin | Ozan Tellioglu ([ozntel](https://github.com/ozntel)) | [ozntel/file-explorer-note-count](https://github.com/ozntel/file-explorer-note-count) | [Ko-fi](https://ko-fi.com/ozante) |
