import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { setAccentVar, removeDocVar } from "../../utils/doc-css-vars";

// ============================================================
// 内联代码样式服务
// ------------------------------------------------------------
// 功能：
//   1. 增强样式（inlineCodeStyle）：圆角、内边距、边框、阴影、等宽字体。
//   2. 自定义颜色（inlineCodeCustom）：内联代码文字与背景跟随一个强调色
//      （inlineCodeColor，空则回退 --text-accent）。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类 + CSS 变量以内联方式写入 body
// （--style-tweaker-inline-code-color），规则本体在静态 inline-code.css；
// 不创建 <style> 元素。颜色随深浅主题：当前文档按 body 主题解析 hex，
// 主题切换经 css-change 重 apply 刷新。
// ============================================================

// 门控类
const INLINE_CODE_STYLE_CLASS = "style-tweaker-inline-code-style";
const INLINE_CODE_CUSTOM_CLASS = "style-tweaker-inline-code-custom";

// 内联代码强调色 CSS 变量（原始用户色，由 custom 门控类决定是否启用）
const INLINE_CODE_COLOR_VAR = "--style-tweaker-inline-code-color";

export class EditorInlineCodeService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  /** 主题切换时重 apply，刷新随深浅色解析的变量。 */
  protected registerExtraListeners(): void {
    this.plugin.registerEvent(
      this.app.workspace.on("css-change", () => this.apply()),
    );
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();

    // 自定义色；default/空值回退主题强调色（--color-accent）
    setAccentVar(doc, s.inlineCodeColor, INLINE_CODE_COLOR_VAR, "var(--color-accent)");

    doc.body.classList.toggle(INLINE_CODE_STYLE_CLASS, s.inlineCodeStyle);
    doc.body.classList.toggle(INLINE_CODE_CUSTOM_CLASS, s.inlineCodeCustom);
  }

  protected clearDocument(doc: Document): void {
    removeDocVar(doc, INLINE_CODE_COLOR_VAR);
    doc.body?.classList.remove(
      INLINE_CODE_STYLE_CLASS,
      INLINE_CODE_CUSTOM_CLASS
    );
  }
}
