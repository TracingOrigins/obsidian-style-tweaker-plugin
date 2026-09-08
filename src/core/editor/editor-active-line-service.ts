import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { resolveAccentCss } from "../../utils/color-palette";

// ============================================================
// 所在行高亮服务
// ------------------------------------------------------------
// 高亮模式（activeLineMode）：
//   none       —— 关闭
//   bg         —— 仅背景高亮
//   bg-border  —— 背景高亮 + 左侧竖边框
//   border     —— 仅左侧竖边框
//
// 设计要点：
//   - 与「编辑器背景」(EditorBackgroundService) 完全解耦，独立门控类，互不牵连。
//   - 采用 JS 逐窗口注入 <style>，与 EditorBackgroundService 同构：覆盖独立设置窗口等
//     pop-out 场景；监听 body 的 theme-dark / theme-light 类变化以重绘。
//   - CSS 规则本体放在静态 styles.css（src/styles/editor/active-line.css），以门控类
//     .style-tweaker-active-line 为前缀；本服务只注入 token 变量并挂摘门控类。
// ============================================================

const STYLE_ID = "style-tweaker-active-line";

// 门控类：仅在 activeLineMode !== "none" 时挂到各窗口文档
const ACTIVE_LINE_CLASS = "style-tweaker-active-line";
const ACTIVE_LINE_BG_CLASS = "style-tweaker-active-line-bg";
const ACTIVE_LINE_BORDER_CLASS = "style-tweaker-active-line-border";

// 所在行高亮统一使用的 CSS 变量名（值由 JS 在运行时注入到 :root）
const ACTIVE_LINE_COLOR_VAR = "--style-tweaker-active-line-color";
const ACTIVE_LINE_FOCUSED_VAR = "--style-tweaker-active-line-focused";
const ACTIVE_LINE_UNFOCUSED_VAR = "--style-tweaker-active-line-unfocused";

export class EditorActiveLineService extends BaseService {
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
    const on = s.activeLineMode !== "none";
    const withBorder = s.activeLineMode === "bg-border" || s.activeLineMode === "border";
    const withBg = s.activeLineMode === "bg" || s.activeLineMode === "bg-border";
    doc.body.classList.toggle(ACTIVE_LINE_CLASS, on);
    doc.body.classList.toggle(ACTIVE_LINE_BG_CLASS, on && withBg);
    doc.body.classList.toggle(ACTIVE_LINE_BORDER_CLASS, on && withBorder);
  }

  private buildTokensCss(s: StyleTweakerSettings): string {
    const focused = `${Math.min(100, Math.max(0, s.activeLineFocused ?? 12))}%`;
    const unfocused = `${Math.min(100, Math.max(0, s.activeLineUnfocused ?? 6))}%`;
    return [
      resolveAccentCss(s.activeLineColor, ACTIVE_LINE_COLOR_VAR, "var(--color-accent)"),
      `:root {
  ${ACTIVE_LINE_FOCUSED_VAR}: ${focused};
  ${ACTIVE_LINE_UNFOCUSED_VAR}: ${unfocused};
}`,
    ].join("\n");
  }

  protected clearDocument(doc: Document): void {
    this.removeStyle(doc, STYLE_ID);
    doc.body?.classList.remove(
      ACTIVE_LINE_CLASS,
      ACTIVE_LINE_BG_CLASS,
      ACTIVE_LINE_BORDER_CLASS,
    );
  }
}
