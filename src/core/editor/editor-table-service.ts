import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";

// ============================================================
// 编辑器表格样式服务
// ------------------------------------------------------------
// 功能：
//   1. 基础表格样式（始终生效）：去边框、奇偶行交替底色、表头高亮、
//      cell/row/thead 悬浮高亮、阴影。
//   2. 表格风格（tableStyle）：default / one / two / three，
//      one=透明背景无交替色；two=表头底边线；three=偶数列底色。
//   3. 显示边框（tableShowBorder）：true=显示单元格边框。
//   4. 整宽（tableFullWidth）：true=表格占满容器宽度。
//   5. 行号（tableLineNumbers）：true=首列前显示行号。
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

// 合法风格值（防止异常设置注入）
const VALID_STYLES = ["one", "two", "three"];

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
    // 基础表格样式门控：仅在 tableStyle 非 default（one/two/three）时生效，
    // default 时不挂载，使表格保持 Obsidian 原生样式。
    body.classList.toggle(TABLE_STYLE_ACTIVE_CLASS, hasStyle);
    if (hasStyle) {
      body.classList.add(TABLE_STYLE_CLASS_PREFIX + s.tableStyle);
    }

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
  }
}
