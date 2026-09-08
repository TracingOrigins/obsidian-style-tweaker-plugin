import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { resolveAccentCss } from "../../utils/color-palette";

// ============================================================
// 章节标题样式服务
// ------------------------------------------------------------
// 功能：
//   1. 标题悬浮级别标识（headingHover）：悬停 H1–H6 时，在左侧显示
//      "H1"…"H6" 级别徽标（纯 CSS，无额外变量）。
//   2. 自定义章节标题颜色（headingCustomColors）：开启后，H1–H6 各自
//      颜色选项生效；颜色为空则回退主题强调色 --text-accent。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类、逐窗口注入 CSS
// 变量（--style-tweaker-heading-h1..h6），不影响其他外观。
// 仅低频事件驱动（onLayoutReady / layout-change / window-open），无轮询，
// 避免启动阶段高频变动导致 apply() 疯狂调用而卡死。
// ============================================================

const STYLE_ID = "style-tweaker-heading";

// 门控类
const HEADING_HOVER_CLASS = "style-tweaker-heading-hover";
const HEADING_CUSTOM_CLASS = "style-tweaker-heading-custom";

// H1–H6 颜色 CSS 变量前缀
const HEADING_COLOR_PREFIX = "--style-tweaker-heading-h";

export class EditorHeadingService extends BaseService {
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
    doc.body.classList.toggle(HEADING_HOVER_CLASS, s.headingHover);
    doc.body.classList.toggle(HEADING_CUSTOM_CLASS, s.headingCustomColors);
  }

  private buildTokensCss(s: StyleTweakerSettings): string {
    const colorKeys: (keyof StyleTweakerSettings)[] = [
      "headingH1",
      "headingH2",
      "headingH3",
      "headingH4",
      "headingH5",
      "headingH6",
    ];
    return colorKeys
      .map(
        (key, i) =>
          resolveAccentCss(
            s[key] as string,
            `${HEADING_COLOR_PREFIX}${i + 1}`,
            "var(--color-accent)",
          ),
      )
      .join("\n");
  }

  protected clearDocument(doc: Document): void {
    this.removeStyle(doc, STYLE_ID);
    doc.body?.classList.remove(HEADING_HOVER_CLASS, HEADING_CUSTOM_CLASS);
  }
}
