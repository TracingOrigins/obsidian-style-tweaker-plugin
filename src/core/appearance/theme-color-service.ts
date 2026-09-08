import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { MOCHA_ACCENTS, LATTE_ACCENTS } from "../../utils/color-palette";

// ============================================================
// 主题色服务：把设置中选中的 accent 覆盖到 Obsidian 全局强调色变量。
// ------------------------------------------------------------
// 深浅色分开取色：深色模式用 Mocha 系 accent，浅色模式用 Latte 系 accent。
// accent 色值表复用 color-palette.ts 中从 FLAVORS（AnuPpuccin）推导的单一数据源，
// 避免在此重复定义另一套、导致同一 accent 在不同功能下色值不一致。
// 通过注入 <style> 定义 body.theme-dark / body.theme-light 两套 CSS 变量，
// 主题切换时变量自动随 body 类切换，无需 MutationObserver。
// 选 "default"（跟随原生）时不注入覆盖，沿用 Obsidian 原生强调色。
// ============================================================

const STYLE_ID = "style-tweaker-theme-color";

/**
 * 主题色样式服务：按深浅色各自选中的 accent 覆盖全局强调色变量。
 */
export class ThemeColorService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.head) return;
    const s = this.getSettings();
    // 深色主题色：用户选色（非 default）用 Mocha 系；default 时不注入、沿用 Obsidian 原生强调色。
    // 注意：纯色模式下也不回退到纯色 flavor 的 accent——纯色模式只改变中性色（背景/文字/边框），
    // accent 应保持「用户选择 or Obsidian 原生」，否则会冒出既非所选也非原生的第三种颜色。
    const dark: string | null = MOCHA_ACCENTS[s.themeDark] ?? null;
    const light: string | null = LATTE_ACCENTS[s.themeLight] ?? null;

    // 深/浅色都为跟随主题（或无匹配）时不注入，移除已注入的 <style>。
    if (!dark && !light) {
      this.removeStyle(doc, STYLE_ID);
      return;
    }

    const darkBlock = dark
      ? `body.theme-dark {
  --color-accent: ${dark};
  --color-accent-1: ${dark};
  --color-accent-2: ${dark};
  --text-accent: ${dark};
  --text-accent-hover: ${dark};
  --interactive-accent: ${dark};
  --interactive-accent-hover: ${dark};
}`
      : "";
    const lightBlock = light
      ? `body.theme-light {
  --color-accent: ${light};
  --color-accent-1: ${light};
  --color-accent-2: ${light};
  --text-accent: ${light};
  --text-accent-hover: ${light};
  --interactive-accent: ${light};
  --interactive-accent-hover: ${light};
}`
      : "";

    let styleEl = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      const win = doc.defaultView;
      if (!win) return;
      styleEl = win.createEl("style");
      styleEl.id = STYLE_ID;
      doc.head.appendChild(styleEl);
    }
    styleEl.textContent = `/* Style Tweaker 主题色：覆盖全局强调色变量 */
${darkBlock}
${lightBlock}`;
    this.touchedDocuments.add(doc);
  }

  protected clearDocument(doc: Document): void {
    this.removeStyle(doc, STYLE_ID);
  }
}
