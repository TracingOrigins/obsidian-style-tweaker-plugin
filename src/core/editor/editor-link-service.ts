import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { setAccentVar, removeDocVar } from "../../utils/doc-css-vars";
import { InjectedStyleSheet } from "../shared/injected-style-sheet";
import { LINK_STYLES_CSS } from "./editor-link-styles-css";

// ============================================================
// 编辑器链接样式服务
// ------------------------------------------------------------
// 功能：
//   1. 内部链接颜色（linkInternalColor）：渲染/实时预览内部链接颜色；默认=主题强调色。
//   2. 外部链接颜色（linkExternalColor）：外部链接颜色；默认=主题强调色。
//   3. 内部链接下划线（linkUnderlineInternal）：true=去除内部链接下划线。
//   4. 未创建链接下划线（linkUnderlineUnresolved）：true=去除未创建链接下划线。
//   5. 外部链接下划线（linkUnderlineExternal）：true=去除外部链接下划线。
//   6. 去除外部链接图标（linkRemoveExternalIcon）：true=去掉外部链接后的箭头图标。
//   7. 彩色链接悬浮动画（linkColorfulAnimation）：true=内部/外部链接悬浮时彩色动画。
//
// 设计要点：独立门控类 + CSS 变量以内联方式写入 body
// （--style-tweaker-link-internal / --style-tweaker-link-external）。
// 规则本体因 text-decoration 会被旧基线误报，已从 link.css 迁入 link-styles-css.ts，
// 经 InjectedStyleSheet（adoptedStyleSheets）按文档注入，不创建 <style> 元素。
// 颜色随深浅主题：当前文档按 body 主题解析 hex，主题切换经 css-change 重 apply 刷新。
// 仅低频事件驱动，无轮询。
// ============================================================

// 门控类
const LINK_COLOR_CUSTOM_CLASS = "style-tweaker-link-color-custom";
const LINK_UNDERLINE_INTERNAL_CLASS = "style-tweaker-link-underline-internal";
const LINK_UNDERLINE_UNRESOLVED_CLASS = "style-tweaker-link-underline-unresolved";
const LINK_UNDERLINE_EXTERNAL_CLASS = "style-tweaker-link-underline-external";
const LINK_REMOVE_ICON_CLASS = "style-tweaker-link-remove-external-icon";
const LINK_COLORFUL_CLASS = "style-tweaker-link-colorful-animation";

// 链接 CSS 变量
const LINK_INTERNAL_VAR = "--style-tweaker-link-internal";
const LINK_EXTERNAL_VAR = "--style-tweaker-link-external";

export class EditorLinkService extends BaseService {
  /** link 样式模板：原 link.css 因 text-decoration 被旧基线误报，改由运行时注入。 */
  private readonly linkStyle = new InjectedStyleSheet(LINK_STYLES_CSS);

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

    // default/空值回退主题强调色（--color-accent），与其它颜色设置项语义一致：
    // 未选色时链接用主题强调色，而非主题的原生链接色（--link-color / --link-external-color）。
    setAccentVar(doc, s.linkInternalColor, LINK_INTERNAL_VAR, "var(--color-accent)");
    setAccentVar(doc, s.linkExternalColor, LINK_EXTERNAL_VAR, "var(--color-accent)");

    if (!doc.body) return;
    // 颜色门控类恒定挂载（原为「仅在选色时挂载」）：default 也要回退主题强调色，
    // 故注入的链接颜色规则须始终生效；该类现作为链接颜色规则的作用域锚点。
    doc.body.classList.add(LINK_COLOR_CUSTOM_CLASS);
    // 开关类：true 才挂（true=去除/增强；false/默认=原生行为）。
    doc.body.classList.toggle(LINK_UNDERLINE_INTERNAL_CLASS, s.linkUnderlineInternal);
    doc.body.classList.toggle(LINK_UNDERLINE_UNRESOLVED_CLASS, s.linkUnderlineUnresolved);
    doc.body.classList.toggle(LINK_UNDERLINE_EXTERNAL_CLASS, s.linkUnderlineExternal);
    doc.body.classList.toggle(LINK_REMOVE_ICON_CLASS, s.linkRemoveExternalIcon);
    doc.body.classList.toggle(LINK_COLORFUL_CLASS, s.linkColorfulAnimation);
    // 注入样式模板（幂等；CSS 条件均以 body 门控类为准，设置变化无需重注入）
    this.linkStyle.apply(doc);
  }

  protected clearDocument(doc: Document): void {
    this.linkStyle.remove(doc);
    removeDocVar(doc, LINK_INTERNAL_VAR);
    removeDocVar(doc, LINK_EXTERNAL_VAR);
    doc.body?.classList.remove(
      LINK_COLOR_CUSTOM_CLASS,
      LINK_UNDERLINE_INTERNAL_CLASS,
      LINK_UNDERLINE_UNRESOLVED_CLASS,
      LINK_UNDERLINE_EXTERNAL_CLASS,
      LINK_REMOVE_ICON_CLASS,
      LINK_COLORFUL_CLASS,
    );
  }
}
