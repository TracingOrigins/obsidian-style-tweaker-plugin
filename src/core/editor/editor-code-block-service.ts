import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";

// ============================================================
// 代码块样式服务
// ------------------------------------------------------------
// 功能：
//   1. 显示行号（codeBlockLineNumbers）：编辑模式代码块每行左侧显示行号。
//   2. 显示语言标签（codeBlockShowLang）：代码块右上角显示语言徽标。
//   3. 自定义圆角（codeBlockCustomRadius + codeBlockRadius）：
//      开关开启后按 codeBlockRadius（px）设置代码块圆角。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类、逐窗口注入；
// 仅低频事件驱动（onLayoutReady / layout-change / window-open），无轮询，
// 避免启动阶段高频变动导致 apply() 疯狂调用而卡死。
// ============================================================

// 门控类
const CODE_BLOCK_LINE_NUMBERS_CLASS = "style-tweaker-code-block-line-numbers";
const CODE_BLOCK_SHOW_LANG_CLASS = "style-tweaker-code-block-show-lang";
const CODE_BLOCK_CUSTOM_RADIUS_CLASS = "style-tweaker-code-block-custom-radius";

// 圆角 CSS 变量
const CODE_BLOCK_RADIUS_VAR = "--style-tweaker-code-block-radius";

const STYLE_ID = "style-tweaker-code-block";

// 圆角有效范围（px）
const RADIUS_MIN = 4;
const RADIUS_MAX = 16;

export class EditorCodeBlockService extends BaseService {
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
    doc.body.classList.toggle(
      CODE_BLOCK_LINE_NUMBERS_CLASS,
      s.codeBlockLineNumbers
    );
    doc.body.classList.toggle(CODE_BLOCK_SHOW_LANG_CLASS, s.codeBlockShowLang);
    doc.body.classList.toggle(CODE_BLOCK_CUSTOM_RADIUS_CLASS, s.codeBlockCustomRadius);
  }

  private buildTokensCss(s: StyleTweakerSettings): string {
    const radius = Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, s.codeBlockRadius ?? 8));
    return `:root {
  ${CODE_BLOCK_RADIUS_VAR}: ${radius}px;
}`;
  }

  protected clearDocument(doc: Document): void {
    this.removeStyle(doc, STYLE_ID);
    doc.body?.classList.remove(
      CODE_BLOCK_LINE_NUMBERS_CLASS,
      CODE_BLOCK_SHOW_LANG_CLASS,
      CODE_BLOCK_CUSTOM_RADIUS_CLASS
    );
  }
}
