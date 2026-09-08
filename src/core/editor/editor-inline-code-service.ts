import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { resolveAccentCss } from "../../utils/color-palette";

// ============================================================
// 内联代码样式服务
// ------------------------------------------------------------
// 功能：
//   1. 增强样式（inlineCodeStyle）：圆角、内边距、边框、阴影、等宽字体。
//   2. 自定义颜色（inlineCodeCustom）：内联代码文字与背景跟随一个强调色
//      （inlineCodeColor，空则回退 --text-accent）。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类、逐窗口注入 CSS
// 变量（--style-tweaker-inline-code-accent）；仅低频事件驱动
// （onLayoutReady / layout-change / window-open），无轮询，避免卡死。
// ============================================================

const STYLE_ID = "style-tweaker-inline-code";

// 门控类
const INLINE_CODE_STYLE_CLASS = "style-tweaker-inline-code-style";
const INLINE_CODE_CUSTOM_CLASS = "style-tweaker-inline-code-custom";

// 内联代码强调色 CSS 变量（原始用户色，由 custom 门控类决定是否启用）
const INLINE_CODE_COLOR_VAR = "--style-tweaker-inline-code-color";

export class EditorInlineCodeService extends BaseService {
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
    doc.body.classList.toggle(INLINE_CODE_STYLE_CLASS, s.inlineCodeStyle);
    doc.body.classList.toggle(INLINE_CODE_CUSTOM_CLASS, s.inlineCodeCustom);
  }

  private buildTokensCss(s: StyleTweakerSettings): string {
    return resolveAccentCss(s.inlineCodeColor, INLINE_CODE_COLOR_VAR, "var(--color-accent)");
  }

  protected clearDocument(doc: Document): void {
    this.removeStyle(doc, STYLE_ID);
    doc.body?.classList.remove(
      INLINE_CODE_STYLE_CLASS,
      INLINE_CODE_CUSTOM_CLASS
    );
  }
}
