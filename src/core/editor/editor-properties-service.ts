import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { InjectedStyleSheet } from "../shared/injected-style-sheet";
import { PROPERTIES_STYLES_CSS } from "./editor-properties-styles-css";

// ============================================================
// 属性区域样式服务
// ------------------------------------------------------------
// 功能：
//   1. 属性名称输入框背景透明（静态样式，无开关）。
//   2. 属性分栏布局（metadataColumnLayout）：将笔记顶部属性区域
//      按多栏排列，栏间以虚线分隔；栏数由 metadataColumnCount（2–6）控制。
//
// 设计要点：独立门控类 + 以 setCssProps 把 CSS 变量
// （--style-tweaker-metadata-column-count）写入 body。
// 规则本体因 column-count / column-rule 会被旧基线误报，已从 properties.css 迁入
// properties-styles-css.ts，经 InjectedStyleSheet（adoptedStyleSheets）按文档注入，
// 不创建 <style> 元素。不影响其他外观；仅低频事件驱动，避免卡死。
// ============================================================

// 门控类：仅 metadataColumnLayout 开启时挂到各窗口文档
const METADATA_COLUMN_CLASS = "style-tweaker-metadata-column";

// 属性分栏布局统一使用的 CSS 变量名（值由 JS 在运行时写入 body）
const METADATA_COLUMN_COUNT_VAR = "--style-tweaker-metadata-column-count";

export class EditorPropertiesService extends BaseService {
  /** 属性区域样式模板：原 properties.css 因 multicolumn 被旧基线误报，改由运行时注入。 */
  private readonly propertiesStyle = new InjectedStyleSheet(PROPERTIES_STYLES_CSS);

  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();

    const count = Math.min(6, Math.max(2, s.metadataColumnCount ?? 2));
    doc.body.setCssProps({
      [METADATA_COLUMN_COUNT_VAR]: String(count),
    });

    doc.body.classList.toggle(METADATA_COLUMN_CLASS, s.metadataColumnLayout);
    // 注入样式模板（幂等；CSS 条件均以 body 门控类/变量为准）
    this.propertiesStyle.apply(doc);
  }

  protected clearDocument(doc: Document): void {
    this.propertiesStyle.remove(doc);
    doc.body?.style.removeProperty(METADATA_COLUMN_COUNT_VAR);
    doc.body?.classList.remove(METADATA_COLUMN_CLASS);
  }
}
