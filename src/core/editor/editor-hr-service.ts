import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";

// ============================================================
// 分隔线样式服务
// ------------------------------------------------------------
// 功能：
//   1. 分隔线样式（hrStyle）：default（Obsidian 原生）/ icon（带中间图标）/ no-icon（无图标渐变）。
//   2. 中间图标（hrCenterIcon）：仅 icon 样式生效，支持 emoji 或字符。
//   3. 图标旋转（hrIconRotate）：仅 icon 样式生效，单位 deg。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类、逐窗口注入 CSS
// 变量（--style-tweaker-hr-center-icon / --style-tweaker-hr-icon-rotate）；
// 仅低频事件驱动（onLayoutReady / layout-change / window-open），无轮询，避免卡死。
// ============================================================

const STYLE_ID = "style-tweaker-hr";

// 门控类
const HR_ICON_CLASS = "style-tweaker-hr-icon";
const HR_NO_ICON_CLASS = "style-tweaker-hr-no-icon";

// 分隔线 CSS 变量
const HR_CENTER_ICON_VAR = "--style-tweaker-hr-center-icon";
const HR_ICON_ROTATE_VAR = "--style-tweaker-hr-icon-rotate";

export class EditorHrService extends BaseService {
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
    // "default" 不挂任何门控类（即 Obsidian 原生 hr）；
    // "icon" / "no-icon" 分别挂对应门控类。
    doc.body.classList.toggle(HR_ICON_CLASS, s.hrStyle === "icon");
    doc.body.classList.toggle(HR_NO_ICON_CLASS, s.hrStyle === "no-icon");
  }

  private buildTokensCss(s: StyleTweakerSettings): string {
    const icon = s.hrCenterIcon?.trim() ? s.hrCenterIcon : "⚡️";
    const rotate = `${Math.round(s.hrIconRotate ?? 0)}deg`;
    return `:root {
  ${HR_CENTER_ICON_VAR}: "${icon}";
  ${HR_ICON_ROTATE_VAR}: ${rotate};
}`;
  }

  protected clearDocument(doc: Document): void {
    this.removeStyle(doc, STYLE_ID);
    doc.body?.classList.remove(HR_ICON_CLASS, HR_NO_ICON_CLASS);
  }
}
