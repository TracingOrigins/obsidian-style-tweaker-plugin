import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";

// ============================================================
// 属性区域样式服务
// ------------------------------------------------------------
// 功能：
//   1. 属性名称输入框背景透明（静态样式，无开关，见 metadata.css）。
//   2. 属性分栏布局（metadataColumnLayout）：将笔记顶部属性区域
//      按多栏排列，栏间以虚线分隔；栏数由 metadataColumnCount（2–6）控制。
//
// 设计要点：与编辑器背景 / 所在行高亮 / 文档标题同构，独立门控类、
// 逐窗口注入 CSS 变量（--style-tweaker-metadata-column-count），
// 不影响其他外观；监听主题切换以重绘。仅低频事件驱动，避免卡死。
// ============================================================

const STYLE_ID = "style-tweaker-metadata";

// 门控类：仅 metadataColumnLayout 开启时挂到各窗口文档
const METADATA_COLUMN_CLASS = "style-tweaker-metadata-column";

// 属性分栏布局统一使用的 CSS 变量名（值由 JS 在运行时注入到 :root）
const METADATA_COLUMN_COUNT_VAR = "--style-tweaker-metadata-column-count";

export class EditorPropertiesService extends BaseService {
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
    doc.body.classList.toggle(METADATA_COLUMN_CLASS, s.metadataColumnLayout);
  }

  private buildTokensCss(s: StyleTweakerSettings): string {
    const count = Math.min(6, Math.max(2, s.metadataColumnCount ?? 2));
    return `:root {
  ${METADATA_COLUMN_COUNT_VAR}: ${count};
}`;
  }

  protected clearDocument(doc: Document): void {
    this.removeStyle(doc, STYLE_ID);
    doc.body?.classList.remove(METADATA_COLUMN_CLASS);
  }
}
