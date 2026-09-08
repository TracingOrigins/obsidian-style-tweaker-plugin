import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { setAccentVar, removeDocVar } from "../../utils/doc-css-vars";

// ============================================================
// 编辑器链接样式服务
// ------------------------------------------------------------
// 功能：
//   1. 内部链接颜色（linkInternalColor）：渲染/实时预览内部链接颜色；默认=Obsidian 原生链接色。
//   2. 外部链接颜色（linkExternalColor）：外部链接颜色；默认=Obsidian 原生外部链接色。
//   3. 内部链接下划线（linkUnderlineInternal）：true=去除内部链接下划线。
//   4. 未创建链接下划线（linkUnderlineUnresolved）：true=去除未创建链接下划线。
//   5. 外部链接下划线（linkUnderlineExternal）：true=去除外部链接下划线。
//   6. 去除外部链接图标（linkRemoveExternalIcon）：true=去掉外部链接后的箭头图标。
//   7. 彩色链接悬浮动画（linkColorfulAnimation）：true=内部/外部链接悬浮时彩色动画。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类 + CSS 变量以内联方式写入 body
// （--style-tweaker-link-internal / --style-tweaker-link-external），规则本体在静态
// link.css；不创建 <style> 元素。颜色随深浅主题：当前文档按 body 主题解析 hex，
// 主题切换经 css-change 重 apply 刷新。仅低频事件驱动，无轮询。
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

    // default/空值回退 Obsidian 原生链接色（--link-color / --link-external-color），
    // 而非主题强调色，使未选择颜色时链接保持原生外观。
    setAccentVar(doc, s.linkInternalColor, LINK_INTERNAL_VAR, "var(--link-color)");
    setAccentVar(doc, s.linkExternalColor, LINK_EXTERNAL_VAR, "var(--link-external-color)");

    if (!doc.body) return;
    // 颜色自定义门控：仅当内部或外部链接颜色被自定义（非 default）时挂载，
    // 使 link.css 的颜色规则只在用户选色时生效，default 时链接完全用 Obsidian 原生。
    const colorCustom = this.isColorCustom(s.linkInternalColor) || this.isColorCustom(s.linkExternalColor);
    doc.body.classList.toggle(LINK_COLOR_CUSTOM_CLASS, colorCustom);
    // 开关类：true 才挂（true=去除/增强；false/默认=原生行为）。
    doc.body.classList.toggle(LINK_UNDERLINE_INTERNAL_CLASS, s.linkUnderlineInternal);
    doc.body.classList.toggle(LINK_UNDERLINE_UNRESOLVED_CLASS, s.linkUnderlineUnresolved);
    doc.body.classList.toggle(LINK_UNDERLINE_EXTERNAL_CLASS, s.linkUnderlineExternal);
    doc.body.classList.toggle(LINK_REMOVE_ICON_CLASS, s.linkRemoveExternalIcon);
    doc.body.classList.toggle(LINK_COLORFUL_CLASS, s.linkColorfulAnimation);
  }

  /** 颜色是否被自定义（非 default / 非空），用于决定是否挂载颜色门控类。 */
  private isColorCustom(value: string | undefined): boolean {
    const v = (value ?? "").trim().toLowerCase();
    return v !== "" && v !== "default";
  }

  protected clearDocument(doc: Document): void {
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
