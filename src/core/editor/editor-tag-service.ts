import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { resolveAccentCss } from "../../utils/color-palette";

// ============================================================
// 标签样式服务
// ------------------------------------------------------------
// 功能：
//   1. 取消实时预览点击跳转（tagDisableTextClick）：点击标签文本不跳转，保留 # 跳转。
//   2. 标签样式（tagStyle）：default / custom（自定义色）/ rainbow（彩虹）。
//   3. 自定义标签颜色（tagColor）：仅 tagStyle=custom 时生效；空=主题强调色。
//
// 设计要点：与编辑器其他样式服务同构，独立门控类 + 逐窗口注入 CSS
// 变量（--style-tweaker-tag-bg-color）；仅低频事件驱动，无轮询。
// ============================================================

const STYLE_ID = "style-tweaker-tag";

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
    doc.body.classList.toggle(TAG_CLICK_CLASS, s.tagDisableTextClick);
    doc.body.classList.toggle(TAG_COLOR_RAINBOW_CLASS, s.tagStyle === "rainbow");
    doc.body.classList.toggle(TAG_COLOR_CUSTOM_CLASS, s.tagStyle === "custom");
  }

  private buildTokensCss(s: StyleTweakerSettings): string {
    // 自定义色；default/空值回退主题强调色（--color-accent）
    return resolveAccentCss(s.tagColor, TAG_BG_COLOR_VAR, "var(--color-accent)");
  }

  protected clearDocument(doc: Document): void {
    this.removeStyle(doc, STYLE_ID);
    doc.body?.classList.remove(
      TAG_CLICK_CLASS,
      TAG_COLOR_RAINBOW_CLASS,
      TAG_COLOR_CUSTOM_CLASS,
    );
  }
}
