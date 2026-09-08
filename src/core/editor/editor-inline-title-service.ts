import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { setAccentVar, removeDocVar } from "../../utils/doc-css-vars";

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
// 设计要点：与编辑器背景 / 所在行高亮同构，独立门控类 + CSS 变量以内联方式写入 body
// （--style-tweaker-inline-title-color），规则本体在静态 inline-title.css；
// 不创建 <style> 元素。颜色默认主题强调色（--color-accent），仅当「允许自定义标题颜色」
// 开启时写入变量。下划线颜色跟随标题色。
// ============================================================

const INLINE_TITLE_CLASS = "style-tweaker-inline-title";
const INLINE_TITLE_CENTER_CLASS = "style-tweaker-inline-title-center";
const INLINE_TITLE_RIGHT_CLASS = "style-tweaker-inline-title-right";
// 页面内标题颜色 CSS 变量（未开启自定义/未指定时 CSS 回退 --color-accent）
const INLINE_TITLE_COLOR_VAR = "--style-tweaker-inline-title-color";
const INLINE_TITLE_UL_LONG_CLASS = "style-tweaker-inline-title-underline-long";
const INLINE_TITLE_UL_SHORT_CLASS = "style-tweaker-inline-title-underline-short";

// 长下划线支持的线型（与设置选项一致）
const UNDERLINE_STYLE_CLASSES = ["solid", "dashed", "double"] as const;

export class EditorInlineTitleService extends BaseService {
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

    // 仅当「允许自定义标题颜色」开启时才写入颜色变量；未开启/未指定时
    // CSS 用 var(--color-accent) 回退（与静态默认一致）。
    if (s.inlineTitleColorEnabled === true) {
      setAccentVar(doc, s.inlineTitleColor, INLINE_TITLE_COLOR_VAR, "var(--color-accent)");
    } else {
      removeDocVar(doc, INLINE_TITLE_COLOR_VAR);
    }

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

  protected clearDocument(doc: Document): void {
    removeDocVar(doc, INLINE_TITLE_COLOR_VAR);
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
