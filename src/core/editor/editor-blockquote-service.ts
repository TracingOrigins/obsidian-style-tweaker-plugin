import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { setAccentVar, removeDocVar } from "../../utils/doc-css-vars";

// ============================================================
// 块引用样式服务
// ------------------------------------------------------------
// 功能：
//   1. 块引用样式（blockquoteStyle）：default（Obsidian 原生）/ accent-fill（色带填充）/
//      quotation-mark（引号）/ bubble（气泡）/ frame（边框）。
//   2. 自定义颜色（blockquoteCustom）：开启后文字颜色与边框颜色选项生效。
//      文字色选「默认」= 主题强调色；但该变量只在开启自定义时被消费，关闭自定义时
//      文字一律保持 var(--text-normal)（由 blockquote.css 侧的回退保证）。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类 + CSS 变量以内联方式写入 body
// （--style-tweaker-blockquote-color / --style-tweaker-blockquote-border-color），规则本体在静态
// blockquote.css；不创建 <style> 元素。颜色随深浅主题：当前文档按 body 主题解析 hex，
// 主题切换经 css-change 重 apply 刷新。
// ============================================================

// 样式门控类前缀（default 不挂任何类，即 Obsidian 原生 blockquote）
const BLOCKQUOTE_STYLE_CLASS_PREFIX = "style-tweaker-blockquote-";
// 自定义颜色门控类
const BLOCKQUOTE_CUSTOM_CLASS = "style-tweaker-blockquote-custom";

// 风格值清单（与 blockquote.css 的门控类一一对应；default 不挂类）
const BLOCKQUOTE_STYLES = [
  "accent-fill",
  "quotation-mark",
  "bubble",
  "frame",
];

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

    // 文字色未选（default）→ 主题强调色；该变量仅在 blockquoteCustom 开启时被
    // blockquote.css 的 --blockquote-color 消费，关闭自定义时文字仍是 --text-normal。
    // 边框色未选同样回退强调色，但它始终生效（无自定义开关的额外条件）。
    setAccentVar(doc, s.blockquoteTextColor, BLOCKQUOTE_COLOR_VAR, "var(--color-accent)");
    setAccentVar(doc, s.blockquoteBorderColor, BLOCKQUOTE_BORDER_VAR, "var(--color-accent)");

    // 清除上一轮样式门控类，再挂当前样式类（default 不挂）
    for (const cls of BLOCKQUOTE_STYLES) {
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
      for (const cls of BLOCKQUOTE_STYLES) {
        doc.body.classList.remove(BLOCKQUOTE_STYLE_CLASS_PREFIX + cls);
      }
      doc.body.classList.remove(BLOCKQUOTE_CUSTOM_CLASS);
    }
  }
}
