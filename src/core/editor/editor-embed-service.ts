import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";

// ============================================================
// 编辑器嵌入样式服务
// ------------------------------------------------------------
//
// 功能：
//   1. 图片居中（embedImageCenter）：图片在行内/阅读模式居中。
//   2. 无缝嵌入（embedMarkdownSeamless）：去掉嵌入的边框、标题、跳转链接。
//   3. 图片边框（embedImageBorder）：给图片加 1px 边框 + 阴影。
//   4. 图片圆角（embedImageCustomRadius + embedImageRadius）：
//      开关开启后按 embedImageRadius（px）设置嵌入图片圆角。
//
// 设计要点：均为门控类（true=启用），圆角值通过注入 CSS 变量控制；
// 低频事件驱动，与编辑器其他样式服务同构。
// ============================================================

// 门控类
const EMBED_IMAGE_CENTER_CLASS = "style-tweaker-embed-image-center";
const EMBED_MARKDOWN_SEAMLESS_CLASS = "style-tweaker-embed-markdown-seamless";
const EMBED_IMAGE_BORDER_CLASS = "style-tweaker-embed-image-border";
const EMBED_IMAGE_CUSTOM_RADIUS_CLASS = "style-tweaker-embed-image-custom-radius";

// 圆角 CSS 变量
const EMBED_IMAGE_RADIUS_VAR = "--style-tweaker-embed-image-radius";

const STYLE_ID = "style-tweaker-embed";

// 圆角有效范围（px）
const RADIUS_MIN = 4;
const RADIUS_MAX = 16;

export class EditorEmbedService extends BaseService {
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
    doc.body.classList.toggle(EMBED_IMAGE_CENTER_CLASS, s.embedImageCenter);
    doc.body.classList.toggle(EMBED_MARKDOWN_SEAMLESS_CLASS, s.embedMarkdownSeamless);
    doc.body.classList.toggle(EMBED_IMAGE_BORDER_CLASS, s.embedImageBorder);
    doc.body.classList.toggle(EMBED_IMAGE_CUSTOM_RADIUS_CLASS, s.embedImageCustomRadius);
  }

  private buildTokensCss(s: StyleTweakerSettings): string {
    const radius = Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, s.embedImageRadius ?? 8));
    return `:root {
  ${EMBED_IMAGE_RADIUS_VAR}: ${radius}px;
}`;
  }

  protected clearDocument(doc: Document): void {
    this.removeStyle(doc, STYLE_ID);
    doc.body?.classList.remove(
      EMBED_IMAGE_CENTER_CLASS,
      EMBED_MARKDOWN_SEAMLESS_CLASS,
      EMBED_IMAGE_BORDER_CLASS,
      EMBED_IMAGE_CUSTOM_RADIUS_CLASS,
    );
  }
}
