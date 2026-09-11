import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { removeDocVar, setAccentVarPair, setPercentVar } from "../../utils/doc-css-vars";

// ============================================================
// 编辑器表格样式服务
// ------------------------------------------------------------
// 功能：
//   1. 基础表格样式（tableStyle 非 default 时生效）：去边框、奇偶行交替底色、
//      表头底色、cell/row/thead 悬浮高亮、阴影。
//   2. 表格风格（tableStyle）：default / one / two / three，
//      one=透明背景无交替色；two=表头底边线；three=偶数列底色。
//   3. 学术三线表（academia）：只有横线，表头与条纹全透明，仅悬浮高亮。
//   4. 显示边框（tableShowBorder）：true=显示单元格边框。
//   5. 整宽（tableFullWidth）：true=表格占满容器宽度。
//   6. 行号（tableLineNumbers）：true=首列前显示行号。
//
// 配色（tableHeaderColor / tableBackgroundColor / tableHoverColor）：
//   颜色值在此按深浅主题各解析一份写入 body 内联变量；值为 default/空时不写，
//   CSS 回退主题强调色。不透明度（*ColorOpacity，0-100）另写一份百分比变量，
//   默认沿用 表头底色 10% / 偶数行底色（风格三为偶数列）7% / 悬浮底色 15%。
//   规则本体在 styles/editor/table.css。
//
// 设计要点：基础样式无门控类（始终应用）；
// 风格/开关为门控类，低频事件驱动，与编辑器其他样式服务同构。
// ============================================================

// 门控类
const TABLE_STYLE_CLASS_PREFIX = "style-tweaker-table-style-";
const TABLE_STYLE_ACTIVE_CLASS = "style-tweaker-table-style-active";
const TABLE_SHOW_BORDER_CLASS = "style-tweaker-table-show-border";
const TABLE_FULL_WIDTH_CLASS = "style-tweaker-table-full-width";
const TABLE_LINE_NUMBERS_CLASS = "style-tweaker-table-line-numbers";

// 配色变量：深浅各一份，CSS 按 body 的 theme-dark / theme-light 取用
// （未设置时 CSS 回退 var(--color-accent)，即「默认使用主题色」）
const TABLE_HEADER_COLOR_DARK_VAR = "--style-tweaker-table-header-color-dark";
const TABLE_HEADER_COLOR_LIGHT_VAR = "--style-tweaker-table-header-color-light";
const TABLE_BG_COLOR_DARK_VAR = "--style-tweaker-table-bg-color-dark";
const TABLE_BG_COLOR_LIGHT_VAR = "--style-tweaker-table-bg-color-light";
const TABLE_HOVER_COLOR_DARK_VAR = "--style-tweaker-table-hover-color-dark";
const TABLE_HOVER_COLOR_LIGHT_VAR = "--style-tweaker-table-hover-color-light";

// 不透明度变量：与主题无关，深浅共用一份（值为 <n>%）
const TABLE_HEADER_OPACITY_VAR = "--style-tweaker-table-header-opacity";
const TABLE_BG_OPACITY_VAR = "--style-tweaker-table-bg-opacity";
const TABLE_HOVER_OPACITY_VAR = "--style-tweaker-table-hover-opacity";

// 合法风格值（防止异常设置注入）
const VALID_STYLES = ["one", "two", "three", "academia"];

export class EditorTableService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();
    const body = doc.body;

    // 先清除所有风格类，再按当前设置挂上
    for (const v of VALID_STYLES) {
      body.classList.remove(TABLE_STYLE_CLASS_PREFIX + v);
    }
    const hasStyle = !!s.tableStyle && VALID_STYLES.includes(s.tableStyle);
    // 基础表格样式门控：仅在 tableStyle 非 default（one/two/three/academia）时生效，
    // default 时不挂载，使表格保持 Obsidian 原生样式。
    body.classList.toggle(TABLE_STYLE_ACTIVE_CLASS, hasStyle);
    if (hasStyle) {
      body.classList.add(TABLE_STYLE_CLASS_PREFIX + s.tableStyle);
    }

    // 配色：色名解析为深浅两套 hex 写入变量；default/空 → 移除变量，CSS 回退主题色
    setAccentVarPair(
      doc,
      s.tableHeaderColor,
      s.tableCustomHeaderColor,
      TABLE_HEADER_COLOR_DARK_VAR,
      TABLE_HEADER_COLOR_LIGHT_VAR,
    );
    setAccentVarPair(
      doc,
      s.tableBackgroundColor,
      s.tableCustomBackgroundColor,
      TABLE_BG_COLOR_DARK_VAR,
      TABLE_BG_COLOR_LIGHT_VAR,
    );
    setAccentVarPair(
      doc,
      s.tableHoverColor,
      s.tableCustomHoverColor,
      TABLE_HOVER_COLOR_DARK_VAR,
      TABLE_HOVER_COLOR_LIGHT_VAR,
    );

    // 不透明度：写入百分比变量；设置缺失/非法时移除变量，由 CSS 用默认值兜底
    setPercentVar(doc, s.tableHeaderColorOpacity, TABLE_HEADER_OPACITY_VAR);
    setPercentVar(doc, s.tableBackgroundColorOpacity, TABLE_BG_OPACITY_VAR);
    setPercentVar(doc, s.tableHoverColorOpacity, TABLE_HOVER_OPACITY_VAR);

    body.classList.toggle(TABLE_SHOW_BORDER_CLASS, s.tableShowBorder);
    body.classList.toggle(TABLE_FULL_WIDTH_CLASS, s.tableFullWidth);
    body.classList.toggle(TABLE_LINE_NUMBERS_CLASS, s.tableLineNumbers);
  }

  protected clearDocument(doc: Document): void {
    if (!doc?.body) return;
    const body = doc.body;
    for (const v of VALID_STYLES) {
      body.classList.remove(TABLE_STYLE_CLASS_PREFIX + v);
    }
    body.classList.remove(
      TABLE_STYLE_ACTIVE_CLASS,
      TABLE_SHOW_BORDER_CLASS,
      TABLE_FULL_WIDTH_CLASS,
      TABLE_LINE_NUMBERS_CLASS,
    );
    removeDocVar(doc, TABLE_HEADER_COLOR_DARK_VAR);
    removeDocVar(doc, TABLE_HEADER_COLOR_LIGHT_VAR);
    removeDocVar(doc, TABLE_BG_COLOR_DARK_VAR);
    removeDocVar(doc, TABLE_BG_COLOR_LIGHT_VAR);
    removeDocVar(doc, TABLE_HOVER_COLOR_DARK_VAR);
    removeDocVar(doc, TABLE_HOVER_COLOR_LIGHT_VAR);
    removeDocVar(doc, TABLE_HEADER_OPACITY_VAR);
    removeDocVar(doc, TABLE_BG_OPACITY_VAR);
    removeDocVar(doc, TABLE_HOVER_OPACITY_VAR);
  }
}
