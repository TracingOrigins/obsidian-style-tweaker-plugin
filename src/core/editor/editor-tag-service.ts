import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { setAccentVar, removeDocVar } from "../../utils/doc-css-vars";

// ============================================================
// 标签样式服务
// ------------------------------------------------------------
// 功能：
//   1. 取消实时预览点击跳转（tagDisableTextClick）：点击标签文本不跳转，保留 # 跳转。
//   2. 标签样式（tagStyle）：default / custom（自定义色）/ rainbow（彩虹）。
//   3. 自定义标签颜色（tagColor）：仅 tagStyle=custom 时生效；空=主题强调色。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类 + CSS 变量以内联方式写入 body
// （--style-tweaker-tag-bg-color），规则本体在静态 tag.css；不创建 <style> 元素。
// 颜色随深浅主题：当前文档按 body 主题解析 hex，主题切换经 css-change 重 apply 刷新。
// ============================================================

// 门控类
const TAG_CLICK_CLASS = "style-tweaker-tag-click";
const TAG_COLOR_RAINBOW_CLASS = "style-tweaker-tag-color-rainbow";
const TAG_COLOR_CUSTOM_CLASS = "style-tweaker-tag-color-custom";

// 自定义标签颜色 CSS 变量
const TAG_BG_COLOR_VAR = "--style-tweaker-tag-bg-color";

export class EditorTagService extends BaseService {
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
    setAccentVar(doc, s.tagColor, TAG_BG_COLOR_VAR, "var(--color-accent)");

    doc.body.classList.toggle(TAG_CLICK_CLASS, s.tagDisableTextClick);
    doc.body.classList.toggle(TAG_COLOR_RAINBOW_CLASS, s.tagStyle === "rainbow");
    doc.body.classList.toggle(TAG_COLOR_CUSTOM_CLASS, s.tagStyle === "custom");
  }

  protected clearDocument(doc: Document): void {
    removeDocVar(doc, TAG_BG_COLOR_VAR);
    doc.body?.classList.remove(
      TAG_CLICK_CLASS,
      TAG_COLOR_RAINBOW_CLASS,
      TAG_COLOR_CUSTOM_CLASS,
    );
  }
}
