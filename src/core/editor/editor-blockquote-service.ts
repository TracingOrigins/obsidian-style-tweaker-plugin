import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { setAccentVar, removeDocVar } from "../../utils/doc-css-vars";

// ============================================================
// 块引用样式服务
// ------------------------------------------------------------
// 功能：
//   1. 块引用样式（blockquoteStyle）：default（Obsidian 原生）/ accent-fill（色带填充）/
//      quotation-mark（引号）。
//   2. 自定义颜色（blockquoteCustom）：开启后文字颜色与边框颜色选项生效。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类 + CSS 变量以内联方式写入 body
// （--style-tweaker-blockquote-color / --blockquote-border-color），规则本体在静态
// blockquote.css；不创建 <style> 元素。颜色随深浅主题：当前文档按 body 主题解析 hex，
// 主题切换经 css-change 重 apply 刷新。
// ============================================================

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

  /** 主题切换时重 apply，刷新随深浅色解析的变量。 */
  protected registerExtraListeners(): void {
    this.plugin.registerEvent(
      this.app.workspace.on("css-change", () => this.apply()),
    );
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();

    setAccentVar(doc, s.blockquoteTextColor, BLOCKQUOTE_COLOR_VAR, "var(--color-accent)");
    setAccentVar(doc, s.blockquoteBorderColor, BLOCKQUOTE_BORDER_VAR, "var(--color-accent)");

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

  protected clearDocument(doc: Document): void {
    removeDocVar(doc, BLOCKQUOTE_COLOR_VAR);
    removeDocVar(doc, BLOCKQUOTE_BORDER_VAR);
    if (doc.body) {
      for (const cls of ["accent-fill", "quotation-mark"]) {
        doc.body.classList.remove(BLOCKQUOTE_STYLE_CLASS_PREFIX + cls);
      }
      doc.body.classList.remove(BLOCKQUOTE_CUSTOM_CLASS);
    }
  }
}
