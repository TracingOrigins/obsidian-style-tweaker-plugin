import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { resolveAccentCss } from "../../utils/color-palette";

// ============================================================
// 块引用样式服务
// ------------------------------------------------------------
// 功能：
//   1. 块引用样式（blockquoteStyle）：default（Obsidian 原生）/ accent-fill（色带填充）/
//      quotation-mark（引号）。
//   2. 自定义颜色（blockquoteCustom）：开启后文字颜色与边框颜色选项生效。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类、逐窗口注入 CSS
// 变量（--style-tweaker-blockquote-color / --blockquote-border-color）；
// 仅低频事件驱动（onLayoutReady / layout-change / window-open），无轮询，避免卡死。
// ============================================================

const STYLE_ID = "style-tweaker-blockquote";

// 样式门控类前缀（default 不挂任何类，即 Obsidian 原生 blockquote）
const BLOCKQUOTE_STYLE_CLASS_PREFIX = "style-tweaker-blockquote-";
// 自定义颜色门控类
const BLOCKQUOTE_CUSTOM_CLASS = "style-tweaker-blockquote-custom";

// 块引用 CSS 变量
const BLOCKQUOTE_COLOR_VAR = "--style-tweaker-blockquote-color";
const BLOCKQUOTE_BORDER_VAR = "--style-tweaker-blockquote-border-color";

export class EditorBlockquoteService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.head) return;
    const s = this.getSettings();

    const tokens = this.buildTokensCss(s);
    let styleEl = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      const win = doc.defaultView;
      if (!win) return;
      styleEl = win.createEl("style");
      styleEl.id = STYLE_ID;
      doc.head.appendChild(styleEl);
    }
    styleEl.textContent = tokens;

    if (!doc.body) return;
    // 清除上一轮样式门控类，再挂当前样式类（default 不挂）
    for (const cls of ["accent-fill", "quotation-mark"]) {
      doc.body.classList.remove(BLOCKQUOTE_STYLE_CLASS_PREFIX + cls);
    }
    if (s.blockquoteStyle && s.blockquoteStyle !== "default") {
      doc.body.classList.add(
        BLOCKQUOTE_STYLE_CLASS_PREFIX + s.blockquoteStyle
      );
    }
    doc.body.classList.toggle(BLOCKQUOTE_CUSTOM_CLASS, s.blockquoteCustom);
  }

  private buildTokensCss(s: StyleTweakerSettings): string {
    return [
      resolveAccentCss(s.blockquoteTextColor, BLOCKQUOTE_COLOR_VAR, "var(--color-accent)"),
      resolveAccentCss(s.blockquoteBorderColor, BLOCKQUOTE_BORDER_VAR, "var(--color-accent)"),
    ].join("\n");
  }

  protected clearDocument(doc: Document): void {
    this.removeStyle(doc, STYLE_ID);
    if (doc.body) {
      for (const cls of ["accent-fill", "quotation-mark"]) {
        doc.body.classList.remove(BLOCKQUOTE_STYLE_CLASS_PREFIX + cls);
      }
      doc.body.classList.remove(BLOCKQUOTE_CUSTOM_CLASS);
    }
  }
}
