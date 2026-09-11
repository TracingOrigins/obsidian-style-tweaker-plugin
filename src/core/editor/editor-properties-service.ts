import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { normalizeHexColor } from "../../utils/color-palette";
import { removeDocVar, setAccentVar, setPercentVar } from "../../utils/doc-css-vars";
import { InjectedStyleSheet } from "../shared/injected-style-sheet";
import { PROPERTIES_STYLES_CSS } from "./editor-properties-styles-css";

// ============================================================
// 属性区域样式服务
// ------------------------------------------------------------
// 功能：
//   1. 属性名称输入框背景透明（静态样式，无开关）。
//   2. 属性分栏布局：把笔记顶部属性区域按多栏排列。
//      propertiesColumnLayout 为总开关；开启后桌面端与移动端各自使用
//      desktopPropertiesColumnCount / mobilePropertiesColumnCount（1–6 栏）。
//   3. 栏间分隔线（随分栏布局生效）：线型、颜色与不透明度同样按桌面端 / 移动端各自设置
//      （desktopPropertiesDivider* / mobilePropertiesDivider*）。
//
// 设计要点：总开关对应一个门控类，以 setCssProps 把两端栏数分别写入
// --style-tweaker-properties-column-count-desktop / -mobile；分隔线的线型同样按平台写入
// -desktop / -mobile 后缀的变量，颜色按当前文档主题解析后写单值、不透明度写百分比。
// 哪一端用哪套变量由样式表里的 body:not(.is-mobile) / body.is-mobile 决定，
// 故 JS 侧无需判断平台，设置在多设备间同步后各端按自身配置生效。
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

// 栏间分隔线变量（桌面端 / 移动端各一套）：线型（dashed / solid）与不透明度（百分比）为单值，
// 颜色为按当前文档主题解析后的 hex（default → var(--color-accent)，主题切换经 css-change 重 apply）
const DIVIDER_STYLE_DESKTOP_VAR = "--style-tweaker-properties-divider-style-desktop";
const DIVIDER_STYLE_MOBILE_VAR = "--style-tweaker-properties-divider-style-mobile";
const DIVIDER_COLOR_DESKTOP_VAR = "--style-tweaker-properties-divider-color-desktop";
const DIVIDER_COLOR_MOBILE_VAR = "--style-tweaker-properties-divider-color-mobile";
const DIVIDER_OPACITY_DESKTOP_VAR = "--style-tweaker-properties-divider-opacity-desktop";
const DIVIDER_OPACITY_MOBILE_VAR = "--style-tweaker-properties-divider-opacity-mobile";

// 合法线型（防止异常设置注入 CSS 变量）；none = 不显示分隔线（column-rule-style: none）
const VALID_DIVIDER_STYLES = ["dashed", "solid", "none"];

/** 线型取值校验：异常值回退虚线。 */
function normalizeDividerStyle(value: string | undefined): string {
  return VALID_DIVIDER_STYLES.includes(value ?? "") ? (value as string) : "dashed";
}

/**
 * 分隔线颜色变量的落地：选「自定义」且 hex 合法时写入固定色（不随主题变化），
 * 其余值（default / 空 / 色名）交给 setAccentVar 按该文档当前主题解析。
 */
function setDividerColorVar(
  doc: Document,
  color: string | undefined,
  custom: string | undefined,
  variable: string,
): void {
  const hex = normalizeHexColor(custom);
  if ((color ?? "").trim() === "custom" && hex) {
    doc.body?.style.setProperty(variable, hex);
    return;
  }
  setAccentVar(doc, color, variable, "var(--color-accent)");
}

export class EditorPropertiesService extends BaseService {
  /** 属性区域样式模板：原 properties.css 因 multicolumn 被旧基线误报，改由运行时注入。 */
  private readonly propertiesStyle = new InjectedStyleSheet(PROPERTIES_STYLES_CSS);

  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  /** 主题（深色 / 浅色）切换时重 apply，刷新按当前主题解析的分隔线颜色。 */
  protected registerExtraListeners(): void {
    this.plugin.registerEvent(
      this.app.workspace.on("css-change", () => this.apply()),
    );
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
      // 栏间分隔线线型：桌面端 / 移动端各一套
      [DIVIDER_STYLE_DESKTOP_VAR]: normalizeDividerStyle(s.desktopPropertiesDividerStyle),
      [DIVIDER_STYLE_MOBILE_VAR]: normalizeDividerStyle(s.mobilePropertiesDividerStyle),
    });

    // 栏间分隔线颜色与不透明度：两端各自解析（default / 空值 → 主题强调色）
    setDividerColorVar(
      doc,
      s.desktopPropertiesDividerColor,
      s.desktopPropertiesCustomDividerColor,
      DIVIDER_COLOR_DESKTOP_VAR,
    );
    setDividerColorVar(
      doc,
      s.mobilePropertiesDividerColor,
      s.mobilePropertiesCustomDividerColor,
      DIVIDER_COLOR_MOBILE_VAR,
    );
    setPercentVar(doc, s.desktopPropertiesDividerOpacity, DIVIDER_OPACITY_DESKTOP_VAR);
    setPercentVar(doc, s.mobilePropertiesDividerOpacity, DIVIDER_OPACITY_MOBILE_VAR);

    doc.body.classList.toggle(PROPERTIES_COLUMN_CLASS, s.propertiesColumnLayout);
    // 注入样式模板（幂等；CSS 条件均以 body 门控类/变量为准）
    this.propertiesStyle.apply(doc);
  }

  protected clearDocument(doc: Document): void {
    this.propertiesStyle.remove(doc);
    for (const variable of [
      DESKTOP_PROPERTIES_COLUMN_COUNT_VAR,
      MOBILE_PROPERTIES_COLUMN_COUNT_VAR,
      DIVIDER_STYLE_DESKTOP_VAR,
      DIVIDER_STYLE_MOBILE_VAR,
      DIVIDER_COLOR_DESKTOP_VAR,
      DIVIDER_COLOR_MOBILE_VAR,
      DIVIDER_OPACITY_DESKTOP_VAR,
      DIVIDER_OPACITY_MOBILE_VAR,
    ]) {
      removeDocVar(doc, variable);
    }
    doc.body?.classList.remove(PROPERTIES_COLUMN_CLASS);
  }
}
