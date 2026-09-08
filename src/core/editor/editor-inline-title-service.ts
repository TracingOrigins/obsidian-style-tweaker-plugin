import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { resolveAccentCss } from "../../utils/color-palette";

// ============================================================
// 页面内标题样式服务
// ------------------------------------------------------------
// 作用于 .inline-title（文档 H1 标题，源码视图与阅读视图均渲染）。
//
// 门控类：
//   .style-tweaker-inline-title            —— 总开关（inlineTitleEnabled 时）
//   .style-tweaker-inline-title-center     —— 标题居中
//   .style-tweaker-inline-title-right      —— 标题右对齐
//   .style-tweaker-inline-title-underline-long   —— 整行下划线
//   .style-tweaker-inline-title-underline-short  —— 文字宽度下划线
//   .style-tweaker-inline-title-underline-<style> —— 整行下划线线型（仅 long 时挂载）
//
// 设计要点：与编辑器背景 / 所在行高亮同构，独立门控类、逐窗口注入覆盖规则，
// 不影响其他外观；监听主题切换以重绘。颜色默认主题强调色（--color-accent），
// 不透明度无需（标题始终可见）。下划线颜色跟随标题色（默认 --color-accent）。
// ============================================================

const STYLE_ID = "style-tweaker-inline-title";

const INLINE_TITLE_CLASS = "style-tweaker-inline-title";
const INLINE_TITLE_CENTER_CLASS = "style-tweaker-inline-title-center";
const INLINE_TITLE_RIGHT_CLASS = "style-tweaker-inline-title-right";
// 页面内标题颜色 CSS 变量（深浅两段由 resolveAccentCss 注入）
const INLINE_TITLE_COLOR_VAR = "--style-tweaker-inline-title-color";
const INLINE_TITLE_UL_LONG_CLASS = "style-tweaker-inline-title-underline-long";
const INLINE_TITLE_UL_SHORT_CLASS = "style-tweaker-inline-title-underline-short";

// 长下划线支持的线型（与设置选项一致）
const UNDERLINE_STYLE_CLASSES = ["solid", "dashed", "double"] as const;

export class EditorInlineTitleService extends BaseService {
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
    const on = s.inlineTitleEnabled;
    doc.body.classList.toggle(INLINE_TITLE_CLASS, on);
    doc.body.classList.toggle(INLINE_TITLE_CENTER_CLASS, on && s.inlineTitleAlign === "center");
    doc.body.classList.toggle(INLINE_TITLE_RIGHT_CLASS, on && s.inlineTitleAlign === "right");
    doc.body.classList.toggle(
      INLINE_TITLE_UL_LONG_CLASS,
      on && s.inlineTitleUnderline === "long",
    );
    doc.body.classList.toggle(
      INLINE_TITLE_UL_SHORT_CLASS,
      on && s.inlineTitleUnderline === "short",
    );
    // 下划线线型仅对「长下划线」生效（样式类须叠加 long）。
    // 先移除所有线型类再加当前选中项，避免切换（尤其虚线/双线切回实线）时残留旧类
    // 导致不生效——实线为 long 默认样式，残留的虚线/双线类会覆盖它。
    for (const style of UNDERLINE_STYLE_CLASSES) {
      doc.body.classList.remove(`style-tweaker-inline-title-underline-${style}`);
    }
    if (on && s.inlineTitleUnderline === "long") {
      doc.body.classList.add(`style-tweaker-inline-title-underline-${s.inlineTitleUnderlineStyle}`);
    }
  }

  private buildTokensCss(s: StyleTweakerSettings): string {
    // 仅当「允许自定义标题颜色」开启时才注入；default/未指定时变量回退主题色。
    const enabled = s.inlineTitleColorEnabled === true;
    if (!enabled) return "";
    const colorToken = resolveAccentCss(
      s.inlineTitleColor,
      INLINE_TITLE_COLOR_VAR,
      "var(--color-accent)",
    );
    // 覆盖 .inline-title 的 color；下划线颜色需带上 underline-long 类以提高特异性，
    // 才能压过 CSS 默认规则。短下划线颜色随标题 color，覆盖 color 即可。
    const rules = `body.style-tweaker-inline-title .inline-title {
  color: var(${INLINE_TITLE_COLOR_VAR}) !important;
}
body.style-tweaker-inline-title.style-tweaker-inline-title-underline-long .inline-title {
  border-bottom-color: var(${INLINE_TITLE_COLOR_VAR}) !important;
}`;
    return `${colorToken}\n${rules}`;
  }

  protected clearDocument(doc: Document): void {
    this.removeStyle(doc, STYLE_ID);
    doc.body?.classList.remove(
      INLINE_TITLE_CLASS,
      INLINE_TITLE_CENTER_CLASS,
      INLINE_TITLE_RIGHT_CLASS,
      INLINE_TITLE_UL_LONG_CLASS,
      INLINE_TITLE_UL_SHORT_CLASS,
      ...UNDERLINE_STYLE_CLASSES.map(
        (st) => `style-tweaker-inline-title-underline-${st}`,
      ),
    );
  }
}
