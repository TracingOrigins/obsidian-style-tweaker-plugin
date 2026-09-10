import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { setAccentVar, removeDocVar } from "../../utils/doc-css-vars";

// ============================================================
// 所在行高亮服务
// ------------------------------------------------------------
// 结构（总开关 + 三个独立子开关，子开关互不依赖）：
//   activeLineEnabled —— 总开关，关闭时各子项一并失效
//   activeLineGutter  —— 行号高亮（活动行行号文字色）
//   activeLineBorder  —— 左侧边框高亮（活动行左侧竖线）
//   activeLineBg      —— 背景高亮（配聚焦/失焦两级强度）
//
// 设计要点：
//   - 与「编辑器背景」(EditorBackgroundService) 完全解耦，独立门控类，互不牵连。
//   - 采用门控类 + CSS 变量以内联方式写入 body，规则本体在静态
//     src/styles/editor/active-line.css，不创建 <style> 元素。
//   - 颜色随深浅主题：当前文档按 body 主题解析 hex，主题切换经 css-change 重 apply 刷新。
// ============================================================

// 门控类：总开关挂 ACTIVE_LINE_CLASS，各子开关挂各自门控类
const ACTIVE_LINE_CLASS = "style-tweaker-active-line";
const ACTIVE_LINE_BG_CLASS = "style-tweaker-active-line-bg";
const ACTIVE_LINE_GUTTER_CLASS = "style-tweaker-active-line-gutter";
const ACTIVE_LINE_BORDER_CLASS = "style-tweaker-active-line-border";

// 所在行高亮统一使用的 CSS 变量名（值由 JS 在运行时注入到 body）
const ACTIVE_LINE_COLOR_VAR = "--style-tweaker-active-line-color";
const ACTIVE_LINE_FOCUSED_VAR = "--style-tweaker-active-line-focused";
const ACTIVE_LINE_UNFOCUSED_VAR = "--style-tweaker-active-line-unfocused";

export class EditorActiveLineService extends BaseService {
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

    // 高亮色；default/空值回退主题强调色（--color-accent）
    setAccentVar(doc, s.activeLineColor, ACTIVE_LINE_COLOR_VAR, "var(--color-accent)");
    // 聚焦/失焦背景强度（百分比）
    const focused = Math.min(100, Math.max(0, s.activeLineFocused ?? 12));
    const unfocused = Math.min(100, Math.max(0, s.activeLineUnfocused ?? 6));
    doc.body.setCssProps({
      [ACTIVE_LINE_FOCUSED_VAR]: `${focused}%`,
      [ACTIVE_LINE_UNFOCUSED_VAR]: `${unfocused}%`,
    });

    const on = !!s.activeLineEnabled;
    doc.body.classList.toggle(ACTIVE_LINE_CLASS, on);
    doc.body.classList.toggle(ACTIVE_LINE_BG_CLASS, on && !!s.activeLineBg);
    doc.body.classList.toggle(
      ACTIVE_LINE_GUTTER_CLASS,
      on && !!s.activeLineGutter,
    );
    doc.body.classList.toggle(
      ACTIVE_LINE_BORDER_CLASS,
      on && !!s.activeLineBorder,
    );
  }

  protected clearDocument(doc: Document): void {
    removeDocVar(doc, ACTIVE_LINE_COLOR_VAR);
    doc.body?.style.removeProperty(ACTIVE_LINE_FOCUSED_VAR);
    doc.body?.style.removeProperty(ACTIVE_LINE_UNFOCUSED_VAR);
    doc.body?.classList.remove(
      ACTIVE_LINE_CLASS,
      ACTIVE_LINE_BG_CLASS,
      ACTIVE_LINE_GUTTER_CLASS,
      ACTIVE_LINE_BORDER_CLASS,
    );
  }
}
