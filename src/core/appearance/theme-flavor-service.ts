import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { buildFlavorVarsCss } from "../../utils/color-palette";

const STYLE_ID = "style-tweaker-theme-flavor";

/**
 * 主题风味服务。
 *
 * 职责：让完整 `--style-tweaker-*` 变量（27 个 RGB 三元组）在**默认/纯色背景下都始终存在**，
 * 从而 border/cards 布局（layout.css 引用 var(--style-tweaker-*)）不依赖纯色背景也能正常工作。
 *
 * 取值：
 *   - 深色主题：默认风味 = mocha
 *   - 浅色主题：默认风味 = latte
 * 通过 body.theme-dark / body.theme-light 两段注入，随主题自动切换。
 *
 * 注意：本服务只注入 `--style-tweaker-*` 变量，**不**注入界面配色（--background-* 等），
 * 以免改变默认背景的观感。纯色模式下 BackgroundService 会用所选风味覆盖
 * `--style-tweaker-*` 及完整界面配色（其 gating 特异性更高，可覆盖本服务）。
 */
export class ThemeFlavorService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.head) return;
    // 深色用 mocha、浅色用 latte 作为默认风味
    const darkCss = buildFlavorVarsCss("mocha", "body.theme-dark");
    const lightCss = buildFlavorVarsCss("latte", "body.theme-light");
    if (!darkCss && !lightCss) {
      this.removeStyle(doc, STYLE_ID);
      return;
    }

    let styleEl = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      const win = doc.defaultView;
      if (!win) return;
      styleEl = win.createEl("style");
      styleEl.id = STYLE_ID;
      doc.head.appendChild(styleEl);
    }
    styleEl.textContent = `/* Style Tweaker flavor：默认风味（深=mocha / 浅=latte） */
${darkCss}
${lightCss}`;
    this.touchedDocuments.add(doc);
  }

  protected clearDocument(doc: Document): void {
    this.removeStyle(doc, STYLE_ID);
  }
}
