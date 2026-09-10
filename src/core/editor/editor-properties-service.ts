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
//   2. 属性分栏布局：将笔记顶部属性区域按多栏排列，栏间以虚线分隔。
//      propertiesColumnLayout 为总开关；开启后桌面端与移动端各自使用
//      desktopPropertiesColumnCount / mobilePropertiesColumnCount（1–6 栏）。
//
// 设计要点：总开关对应一个门控类，以 setCssProps 把两端栏数分别写入
// --style-tweaker-properties-column-count-desktop / -mobile；哪一端用哪个栏数
// 由样式表里的 body:not(.is-mobile) / body.is-mobile 决定，故 JS 侧无需判断平台，
// 设置在多设备间同步后各端按自身栏数生效。
// 命名说明：设置键、门控类与 CSS 变量统一用 properties（与设置页 locale 一致）；
// 唯独样式表里的 .metadata-container / .metadata-content 是 Obsidian 自身的结构类名，
// 属目标 DOM，不随插件命名调整。
// 规则本体因 column-count / column-rule 会被旧基线误报，已从 properties.css 迁入
// properties-styles-css.ts，经 InjectedStyleSheet（adoptedStyleSheets）按文档注入，
// 不创建 <style> 元素。不影响其他外观；仅低频事件驱动，避免卡死。
// ============================================================

// 门控类：propertiesColumnLayout（总开关）开启时挂到各窗口文档
const PROPERTIES_COLUMN_CLASS = "style-tweaker-properties-column";

// 桌面端 / 移动端各自的栏数变量（值由 JS 在运行时写入 body）
const DESKTOP_PROPERTIES_COLUMN_COUNT_VAR = "--style-tweaker-properties-column-count-desktop";
const MOBILE_PROPERTIES_COLUMN_COUNT_VAR = "--style-tweaker-properties-column-count-mobile";

export class EditorPropertiesService extends BaseService {
  /** 属性区域样式模板：原 properties.css 因 multicolumn 被旧基线误报，改由运行时注入。 */
  private readonly propertiesStyle = new InjectedStyleSheet(PROPERTIES_STYLES_CSS);

  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();

    // 栏数限幅 1–6：旧数据 / 手改配置越界时回退到合法区间
    const clampCount = (v: number | undefined, fallback: number): string =>
      String(Math.min(6, Math.max(1, v ?? fallback)));

    doc.body.setCssProps({
      [DESKTOP_PROPERTIES_COLUMN_COUNT_VAR]: clampCount(s.desktopPropertiesColumnCount, 2),
      [MOBILE_PROPERTIES_COLUMN_COUNT_VAR]: clampCount(s.mobilePropertiesColumnCount, 1),
    });

    doc.body.classList.toggle(PROPERTIES_COLUMN_CLASS, s.propertiesColumnLayout);
    // 注入样式模板（幂等；CSS 条件均以 body 门控类/变量为准）
    this.propertiesStyle.apply(doc);
  }

  protected clearDocument(doc: Document): void {
    this.propertiesStyle.remove(doc);
    doc.body?.style.removeProperty(DESKTOP_PROPERTIES_COLUMN_COUNT_VAR);
    doc.body?.style.removeProperty(MOBILE_PROPERTIES_COLUMN_COUNT_VAR);
    doc.body?.classList.remove(PROPERTIES_COLUMN_CLASS);
  }
}
