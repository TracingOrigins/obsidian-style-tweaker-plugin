import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { resolveAccentCss } from "../../utils/color-palette";

// ============================================================
// 文本装饰样式服务
// ------------------------------------------------------------
// 功能：自定义行内文本装饰颜色（开启后生效）
//   1. 加粗（bold）颜色
//   2. 删除线（strikethrough）颜色
//   3. 高亮（highlight）背景颜色（以 color-mix 28% 透明度着色）
// 颜色为空则回退主题强调色 --text-accent。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类、逐窗口注入 CSS
// 变量（--style-tweaker-text-bold / strikethrough / highlight），不影响
// 其他外观；仅低频事件驱动（onLayoutReady / layout-change / window-open），
// 无轮询，避免启动阶段高频变动导致 apply() 疯狂调用而卡死。
// ============================================================

const STYLE_ID = "style-tweaker-text-decoration";

// 门控类：仅 textDecorationCustom 开启时挂到各窗口文档
const TEXT_DECORATION_CLASS = "style-tweaker-text-decoration-custom";

// 文本装饰颜色 CSS 变量名
const TEXT_BOLD_VAR = "--style-tweaker-text-bold";
const TEXT_ITALIC_VAR = "--style-tweaker-text-italic";
const TEXT_ITALIC_BOLD_VAR = "--style-tweaker-text-italic-bold";
const TEXT_UNDERLINE_VAR = "--style-tweaker-text-underline";
const TEXT_STRIKETHROUGH_VAR = "--style-tweaker-text-strikethrough";
const TEXT_HIGHLIGHT_VAR = "--style-tweaker-text-highlight";

export class EditorTextDecorationService extends BaseService {
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
    doc.body.classList.toggle(TEXT_DECORATION_CLASS, s.textDecorationCustom);
  }

  private buildTokensCss(s: StyleTweakerSettings): string {
    return [
      resolveAccentCss(s.textBoldColor, TEXT_BOLD_VAR, "var(--color-accent)"),
      resolveAccentCss(s.textItalicColor, TEXT_ITALIC_VAR, "var(--color-accent)"),
      resolveAccentCss(s.textItalicBoldColor, TEXT_ITALIC_BOLD_VAR, "var(--color-accent)"),
      resolveAccentCss(s.textUnderlineColor, TEXT_UNDERLINE_VAR, "var(--color-accent)"),
      resolveAccentCss(s.textStrikethroughColor, TEXT_STRIKETHROUGH_VAR, "var(--color-accent)"),
      resolveAccentCss(s.textHighlightColor, TEXT_HIGHLIGHT_VAR, "var(--color-accent)"),
    ].join("\n");
  }

  protected clearDocument(doc: Document): void {
    this.removeStyle(doc, STYLE_ID);
    doc.body?.classList.remove(TEXT_DECORATION_CLASS);
  }
}
