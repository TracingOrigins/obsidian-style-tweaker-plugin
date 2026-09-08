import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { resolveAccentValue } from "../../utils/color-palette";

// ============================================================
// 编辑器背景服务
// ------------------------------------------------------------
// 在编辑器（源码视图 CodeMirror / 预览视图）绘制网格或点阵背景图案。
//
// 设计要点：
//   - 与「界面背景」（BackgroundService）完全解耦：编辑器背景是编辑器
//     内部的装饰图案，不依赖界面背景开关，也不复用其门控类，避免开关互相牵连。
//   - 采用门控类 + CSS 变量以内联方式写入 body，规则本体在静态
//     src/styles/editor/background.css，不创建 <style> 元素。
//   - 图案透明度按深浅色在 CSS 中写死（网格 浅25%/深12%、点阵 浅50%/深12%），
//     无需 JS 感知主题，因此不监听主题切换。
// ============================================================

// 门控类：仅在编辑器背景开启（type !== "none"）时挂到各窗口文档，
// 静态 background.css 里所有图案规则以该类为前缀，关闭时移除类即整体失效。
const EDITOR_BG_CLASS = "style-tweaker-editor-bg";

// 图案类型门控类：对应 editorBgType 的 4 种变体。互斥，仅类型匹配时挂载。
const EDITOR_BG_PATTERN_CLASSES = [
  "style-tweaker-editor-bg-grid-1",
  "style-tweaker-editor-bg-grid-2",
  "style-tweaker-editor-bg-dotted-1",
  "style-tweaker-editor-bg-dotted-2",
] as const;

// 固定门控类：当「不跟随滚动」时挂到 body。
// 挂载时图案固定（默认 scroll 行为）；不挂载时由 CSS 设为 local（跟随滚动）。
const EDITOR_BG_FIXED_CLASS = "style-tweaker-editor-bg-fixed";

// 编辑器背景统一使用的 CSS 变量名（值由 JS 在运行时注入到 body）。
// 图案统一颜色（网格/点阵、深色/浅色共用）；透明度与各类型间距均在 CSS 中写死，
// 故无对应变量。
const EDITOR_BG_COLOR_VAR = "--style-tweaker-editor-bg-color";
const EDITOR_BG_ATTACH_VAR = "--style-tweaker-editor-bg-attach";

export class EditorBackgroundService extends BaseService {
  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  protected applyToDocument(doc: Document): void {
    if (!doc?.body) return;
    const s = this.getSettings();

    // 图案统一颜色；default/空值回退默认图案灰 #c7c7c7
    const color = resolveAccentValue(s.editorBgColor, "#c7c7c7");
    // 跟随滚动用 local；固定（不跟随）用默认（scroll）
    const attach = s.editorBgScroll ? "local" : "scroll";
    doc.body.setCssProps({
      [EDITOR_BG_COLOR_VAR]: color,
      [EDITOR_BG_ATTACH_VAR]: attach,
    });

    // 挂摘门控类：保证后打开的独立窗口也生效。
    const on = s.editorBgType !== "none";
    doc.body.classList.toggle(EDITOR_BG_CLASS, on);
    doc.body.classList.toggle(
      EDITOR_BG_PATTERN_CLASSES[0],
      on && s.editorBgType === "grid-1",
    );
    doc.body.classList.toggle(
      EDITOR_BG_PATTERN_CLASSES[1],
      on && s.editorBgType === "grid-2",
    );
    doc.body.classList.toggle(
      EDITOR_BG_PATTERN_CLASSES[2],
      on && s.editorBgType === "dotted-1",
    );
    doc.body.classList.toggle(
      EDITOR_BG_PATTERN_CLASSES[3],
      on && s.editorBgType === "dotted-2",
    );
    // 「不跟随滚动」时挂 fixed 类；跟随滚动（默认）时不挂，由 CSS 设为 local
    doc.body.classList.toggle(EDITOR_BG_FIXED_CLASS, on && !s.editorBgScroll);
  }

  protected clearDocument(doc: Document): void {
    doc.body?.style.removeProperty(EDITOR_BG_COLOR_VAR);
    doc.body?.style.removeProperty(EDITOR_BG_ATTACH_VAR);
    doc.body?.classList.remove(
      EDITOR_BG_CLASS,
      ...EDITOR_BG_PATTERN_CLASSES,
      EDITOR_BG_FIXED_CLASS,
    );
  }
}
