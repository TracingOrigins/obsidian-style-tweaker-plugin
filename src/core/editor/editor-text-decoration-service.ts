import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { setAccentVar, removeDocVar } from "../../utils/doc-css-vars";

// ============================================================
// 文本装饰样式服务
// ------------------------------------------------------------
// 功能：自定义行内文本装饰颜色（开启后生效）
//   1. 加粗（bold）颜色
//   2. 删除线（strikethrough）颜色
//   3. 高亮（highlight）背景颜色（以 color-mix 28% 透明度着色）
// 颜色为空则回退主题强调色 --text-accent。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类 + CSS 变量以内联方式写入 body
// （--style-tweaker-text-bold / italic / underline / strikethrough / highlight），
// 规则本体在静态 text-decoration.css；不创建 <style> 元素。
// 颜色随深浅主题：当前文档按 body 主题解析 hex，主题切换经 css-change 重 apply 刷新。
// 仅低频事件驱动（onLayoutReady / layout-change / window-open），无轮询。
// ============================================================

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

  /** 主题切换时重 apply，刷新随深浅色解析的变量。 */
  protected registerExtraListeners(): void {
    this.plugin.registerEvent(
      this.app.workspace.on("css-change", () => this.apply()),
    );
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();

    // 各装饰色；default/空值回退主题强调色（--color-accent）
    setAccentVar(doc, s.textBoldColor, TEXT_BOLD_VAR, "var(--color-accent)");
    setAccentVar(doc, s.textItalicColor, TEXT_ITALIC_VAR, "var(--color-accent)");
    setAccentVar(doc, s.textItalicBoldColor, TEXT_ITALIC_BOLD_VAR, "var(--color-accent)");
    setAccentVar(doc, s.textUnderlineColor, TEXT_UNDERLINE_VAR, "var(--color-accent)");
    setAccentVar(doc, s.textStrikethroughColor, TEXT_STRIKETHROUGH_VAR, "var(--color-accent)");
    setAccentVar(doc, s.textHighlightColor, TEXT_HIGHLIGHT_VAR, "var(--color-accent)");

    doc.body?.classList.toggle(TEXT_DECORATION_CLASS, s.textDecorationCustom);
  }

  protected clearDocument(doc: Document): void {
    removeDocVar(doc, TEXT_BOLD_VAR);
    removeDocVar(doc, TEXT_ITALIC_VAR);
    removeDocVar(doc, TEXT_ITALIC_BOLD_VAR);
    removeDocVar(doc, TEXT_UNDERLINE_VAR);
    removeDocVar(doc, TEXT_STRIKETHROUGH_VAR);
    removeDocVar(doc, TEXT_HIGHLIGHT_VAR);
    doc.body?.classList.remove(TEXT_DECORATION_CLASS);
  }
}
