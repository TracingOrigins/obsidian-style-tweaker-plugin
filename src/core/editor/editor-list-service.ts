/**
 * 列表/任务样式服务
 *
 * 行为说明：
 *  - 源代码/实时预览模式始终使用 Obsidian 主题强调色，因此下列自定义色
 *    仅在「阅读模式（reading view）」生效。
 *  - 当未开启自定义颜色（listCustomColors / taskCustomColors 为 false）时，
 *    不挂 gating 类，所有列表/任务颜色回退为阅读模式的主题强调色。
 *  - 颜色值为 "default" 或空时同样视为使用主题色（不视为有效设置）。
 */

import type { Plugin } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { BaseService } from "../base-service";
import { resolveAccentCss } from "../../utils/color-palette";

const STYLE_ID = "style-tweaker-list-task";

// 门控类（挂在 body 上，每个具体颜色独立控制，
// 避免"只要开了某一颜色就触发其它列表/任务颜色显示主题色"的交叉影响）
const UL_INDENT_CLASS = "style-tweaker-list-ul-indent-custom";
const OL_INDENT_CLASS = "style-tweaker-list-ol-indent-custom";
const BULLET_CLASS = "style-tweaker-list-bullet-custom";
const NUMBER_CLASS = "style-tweaker-list-number-custom";
const UL_ACTIVE_INDENT_CLASS = "style-tweaker-list-ul-active-indent-custom";
const OL_ACTIVE_INDENT_CLASS = "style-tweaker-list-ol-active-indent-custom";
const TASK_INDENT_CLASS = "style-tweaker-task-indent-custom";
const TASK_ACTIVE_INDENT_CLASS = "style-tweaker-task-active-indent-custom";
const TASK_CHECKBOX_CLASS = "style-tweaker-task-checkbox-custom";
const TASK_NO_STRIKE_CLASS = "style-tweaker-task-remove-strikethrough";

// 自定义色 CSS 变量
const LIST_UL_COLOR_VAR = "--style-tweaker-list-ul-indent-color";
const LIST_OL_COLOR_VAR = "--style-tweaker-list-ol-indent-color";
const LIST_BULLET_COLOR_VAR = "--style-tweaker-list-bullet-color";
const LIST_NUMBER_COLOR_VAR = "--style-tweaker-list-number-color";
const LIST_UL_ACTIVE_COLOR_VAR = "--style-tweaker-list-ul-active-indent-color";
const LIST_OL_ACTIVE_COLOR_VAR = "--style-tweaker-list-ol-active-indent-color";
const TASK_INDENT_COLOR_VAR = "--style-tweaker-task-indent-color";
const TASK_ACTIVE_COLOR_VAR = "--style-tweaker-task-active-indent-color";
const TASK_CHECKBOX_COLOR_VAR = "--style-tweaker-task-checkbox-color";

export class EditorListService extends BaseService {
	constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
		super(plugin, getSettings);
	}

	// 列表/任务颜色门控：开关开启即挂载对应门控类。
	// 开关开启后，各颜色变量 default 时解析为主题强调色（var(--color-accent)），
	// 非 default 时解析为选中的颜色；开关关闭时无门控类，列表/任务保持 Obsidian 原生色。
	private listColorActive(s: StyleTweakerSettings): boolean {
		return s.listCustomColors;
	}

	private taskColorActive(s: StyleTweakerSettings): boolean {
		return s.taskCustomColors;
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
		doc.body.classList.toggle(UL_INDENT_CLASS, this.listColorActive(s));
		doc.body.classList.toggle(OL_INDENT_CLASS, this.listColorActive(s));
		doc.body.classList.toggle(BULLET_CLASS, this.listColorActive(s));
		doc.body.classList.toggle(NUMBER_CLASS, this.listColorActive(s));
		doc.body.classList.toggle(UL_ACTIVE_INDENT_CLASS, this.listColorActive(s));
		doc.body.classList.toggle(OL_ACTIVE_INDENT_CLASS, this.listColorActive(s));
		doc.body.classList.toggle(TASK_INDENT_CLASS, this.taskColorActive(s));
		doc.body.classList.toggle(TASK_ACTIVE_INDENT_CLASS, this.taskColorActive(s));
		doc.body.classList.toggle(TASK_CHECKBOX_CLASS, this.taskColorActive(s));
		doc.body.classList.toggle(TASK_NO_STRIKE_CLASS, s.taskRemoveStrikethrough);
	}

	private buildTokensCss(s: StyleTweakerSettings): string {
		return [
			resolveAccentCss(s.listUlIndentColor, LIST_UL_COLOR_VAR, "var(--color-accent)"),
			resolveAccentCss(s.listOlIndentColor, LIST_OL_COLOR_VAR, "var(--color-accent)"),
			resolveAccentCss(s.listBulletColor, LIST_BULLET_COLOR_VAR, "var(--color-accent)"),
			resolveAccentCss(s.listNumberColor, LIST_NUMBER_COLOR_VAR, "var(--color-accent)"),
			resolveAccentCss(s.listUlActiveIndentColor, LIST_UL_ACTIVE_COLOR_VAR, "var(--style-tweaker-list-ul-indent-color)"),
			resolveAccentCss(s.listOlActiveIndentColor, LIST_OL_ACTIVE_COLOR_VAR, "var(--style-tweaker-list-ol-indent-color)"),
			resolveAccentCss(s.taskIndentColor, TASK_INDENT_COLOR_VAR, "var(--color-accent)"),
			resolveAccentCss(s.taskActiveIndentColor, TASK_ACTIVE_COLOR_VAR, "var(--style-tweaker-task-indent-color)"),
			resolveAccentCss(s.taskCheckboxColor, TASK_CHECKBOX_COLOR_VAR, "var(--color-accent)"),
		].join("\n");
	}

	protected clearDocument(doc: Document): void {
		this.removeStyle(doc, STYLE_ID);
		doc.body?.classList.remove(
			UL_INDENT_CLASS,
			OL_INDENT_CLASS,
			BULLET_CLASS,
			NUMBER_CLASS,
			UL_ACTIVE_INDENT_CLASS,
			OL_ACTIVE_INDENT_CLASS,
			TASK_INDENT_CLASS,
			TASK_ACTIVE_INDENT_CLASS,
			TASK_CHECKBOX_CLASS,
			TASK_NO_STRIKE_CLASS,
		);
	}
}
