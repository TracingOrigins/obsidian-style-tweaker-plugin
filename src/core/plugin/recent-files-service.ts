/**
 * Recent Files 样式服务：为「社区插件 → Recent Files」提供样式能力。
 *
 * 功能：
 *   rfAddFileIcon        → 给 recent-files 文件列表加文件类型图标
 *   rfColorfulEnabled    → recent-files 彩色化总开关（标题文字/行背景 + 图标同色）
 *   rfColorfulMode{Dark,Light} → 彩色化类型：title（仅标题色）/ background（行背景色块）
 *   rfColorfulPalette{Dark,Light} → 配色方案（one~six + custom）
 *   rfColorfulColor{Dark,Light}   → 自定义配色基色（palette === custom 时使用）
 *
 * 设计要点：
 *   - 与 FileExplorerService 的彩色文件夹系统同构，但门控类用独立前缀
 *     `style-tweaker-rf-*`，色变量用 `--style-tweaker-rf-*`，二者互不干扰、
 *     各自独立开关（可只开 recent-files、不动 file-explorer）。
 *   - 深浅色各一套 mode/palette：apply 时读当前文档 body 的 theme-dark/light
 *     决定挂哪套门控类；主题切换经 css-change 事件重 apply。
 *   - 仅挂摘 body 门控类 + 设 CSS 变量，图标/色块/着色全部由 CSS 完成，无轮询。
 */

import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { resolveAccentValue } from "../../utils/color-palette";

// 总开关
const COLORFUL_ENABLED_CLASS = "style-tweaker-rf-colorful-enabled";
const FILE_ICONS_CLASS = "style-tweaker-rf-file-icons";
// mode 门控前缀（真实类 …colorful-mode-{title|background}）
const MODE_PREFIX = "style-tweaker-rf-colorful-mode-";
// palette 门控前缀（真实类 …colorful-palette-{one..six|custom}）
const PALETTE_PREFIX = "style-tweaker-rf-colorful-palette-";
// 自定义配色基色变量（深浅各一套，CSS 按 .theme-dark/.theme-light 取用）
const CUSTOM_COLOR_DARK_VAR = "--style-tweaker-rf-colorful-custom-color-dark";
const CUSTOM_COLOR_LIGHT_VAR = "--style-tweaker-rf-colorful-custom-color-light";

export class RecentFilesService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  /** 主题（深色/浅色）切换时按最新 theme 重挂对应门控类。 */
  protected registerExtraListeners(): void {
    this.plugin.registerEvent(
      this.app.workspace.on("css-change", () => this.apply()),
    );
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();
    const body = doc.body;
    const isDark = body.classList.contains("theme-dark");

    // 文件图标门控
    body.classList.toggle(FILE_ICONS_CLASS, s.rfAddFileIcon === true);

    // 彩色化总开关
    body.classList.toggle(COLORFUL_ENABLED_CLASS, s.rfColorfulEnabled === true);

    // 先清除旧的 mode / palette 门控类，避免切换残留叠加导致特异性冲突
    for (let i = body.classList.length - 1; i >= 0; i--) {
      const cls = body.classList[i];
      if (cls.startsWith(MODE_PREFIX) || cls.startsWith(PALETTE_PREFIX)) {
        body.classList.remove(cls);
      }
    }

    // 按当前主题取对应一套 mode / palette
    const mode = isDark ? s.rfColorfulModeDark : s.rfColorfulModeLight;
    const palette = isDark ? s.rfColorfulPaletteDark : s.rfColorfulPaletteLight;

    if (s.rfColorfulEnabled === true) {
      body.classList.add(MODE_PREFIX + mode);
      body.classList.add(PALETTE_PREFIX + palette);
      // 自定义配色基色：深浅各写一套，CSS 按主题取用（仅 custom 配色会用到）
      body.style.setProperty(
        CUSTOM_COLOR_DARK_VAR,
        resolveAccentValue(s.rfColorfulColorDark, "#ef8c3a"),
      );
      body.style.setProperty(
        CUSTOM_COLOR_LIGHT_VAR,
        resolveAccentValue(s.rfColorfulColorLight, "#ef8c3a"),
      );
    } else {
      body.style.removeProperty(CUSTOM_COLOR_DARK_VAR);
      body.style.removeProperty(CUSTOM_COLOR_LIGHT_VAR);
    }
  }

  protected clearDocument(doc: Document): void {
    doc.body?.classList.remove(FILE_ICONS_CLASS, COLORFUL_ENABLED_CLASS);
    if (!doc.body) return;
    for (let i = doc.body.classList.length - 1; i >= 0; i--) {
      const cls = doc.body.classList[i];
      if (cls.startsWith(MODE_PREFIX) || cls.startsWith(PALETTE_PREFIX)) {
        doc.body.classList.remove(cls);
      }
    }
    doc.body.style.removeProperty(CUSTOM_COLOR_DARK_VAR);
    doc.body.style.removeProperty(CUSTOM_COLOR_LIGHT_VAR);
  }
}
