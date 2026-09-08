import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { setAccentVar, removeDocVar } from "../../utils/doc-css-vars";

// ============================================================
// 章节标题样式服务
// ------------------------------------------------------------
// 功能：
//   1. 标题悬浮级别标识（headingHover）：悬停 H1–H6 时，在左侧显示
//      "H1"…"H6" 级别徽标（纯 CSS，无额外变量）。
//   2. 自定义章节标题颜色（headingCustomColors）：开启后，H1–H6 各自
//      颜色选项生效；颜色为空则回退主题强调色 --text-accent。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类 + CSS 变量以内联方式写入 body
// （--style-tweaker-heading-h1..h6），规则本体在静态 heading.css；不创建 <style> 元素。
// 颜色随深浅主题：当前文档按 body 主题解析 hex，主题切换经 css-change 重 apply 刷新。
// 仅低频事件驱动（onLayoutReady / layout-change / window-open），无轮询。
// ============================================================

// 门控类
const HEADING_HOVER_CLASS = "style-tweaker-heading-hover";
const HEADING_CUSTOM_CLASS = "style-tweaker-heading-custom";

// H1–H6 颜色 CSS 变量前缀
const HEADING_COLOR_PREFIX = "--style-tweaker-heading-h";

export class EditorHeadingService extends BaseService {
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

    const colorKeys: (keyof StyleTweakerSettings)[] = [
      "headingH1",
      "headingH2",
      "headingH3",
      "headingH4",
      "headingH5",
      "headingH6",
    ];
    colorKeys.forEach((key, i) => {
      // default/空值回退主题强调色（--color-accent）
      setAccentVar(
        doc,
        s[key] as string,
        `${HEADING_COLOR_PREFIX}${i + 1}`,
        "var(--color-accent)",
      );
    });

    doc.body?.classList.toggle(HEADING_HOVER_CLASS, s.headingHover);
    doc.body?.classList.toggle(HEADING_CUSTOM_CLASS, s.headingCustomColors);
  }

  protected clearDocument(doc: Document): void {
    for (let i = 1; i <= 6; i++) {
      removeDocVar(doc, `${HEADING_COLOR_PREFIX}${i}`);
    }
    doc.body?.classList.remove(HEADING_HOVER_CLASS, HEADING_CUSTOM_CLASS);
  }
}
