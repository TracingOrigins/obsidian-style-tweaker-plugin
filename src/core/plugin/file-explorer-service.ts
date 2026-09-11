/**
 * 文件浏览器样式服务：为「核心插件 → 文件列表」提供各种样式能力。
 *
 * 功能说明：
 *   feAddFileIcon              → 添加文件前类型图标
 *   feReplaceFolderIcon        → 替换文件夹折叠箭头为文件夹图标
 *   feFileNameWrap             → 文件名过长时换行显示
 *   feHoverRevealFileTag       → 悬停显示文件后缀标签（默认隐藏扩展名标签，md 行补一个 md 标签）
 *   feRemoveFirstLevelFolderIconDark/Light → 去除第一层文件夹前图标（深/浅主题，仅彩色边框/色块模式生效）
 *   feFolderTrailingMarker     → 文件夹行末标记（none / dot / count）
 *   feColorfulFoldersEnabled / feColorfulFolderMode{Dark,Light} / feColorfulFolderPalette{Dark,Light} / feColorfulFolderColor{Dark,Light} → 彩色文件夹（多模式 + 配色）
 */

import { Plugin, App, TFile, EventRef } from "obsidian";
import { StyleTweakerSettings } from "../../types/settings";
import { getAppDocuments } from "../../utils/documents";
import { resolveAccentValue } from "../../utils/color-palette";

const FILE_ICONS_CLASS = "style-tweaker-fe-file-icons";
const FOLDER_ICONS_CLASS = "style-tweaker-fe-folder-icons";
const REMOVE_FIRST_FOLDER_ICON_CLASS =
	"style-tweaker-fe-remove-first-folder-icon";
const FOLDER_MARKER_DOT_CLASS = "style-tweaker-fe-folder-marker-dot";
const FOLDER_MARKER_COUNT_CLASS = "style-tweaker-fe-folder-marker-count";
const FILE_NAME_WRAP_CLASS = "style-tweaker-fe-file-name-wrap";
// 悬停显示后缀标签：默认隐藏、hover 显示，两态同属一个开关
const HOVER_REVEAL_FILE_TAG_CLASS = "style-tweaker-fe-hover-reveal-file-tag";
const COLORFUL_FOLDERS_CLASS = "style-tweaker-fe-colorful-folders";
// 彩色文件夹开启时，由 JS 给文件树中所有折叠箭头 <svg> 加此门控类，
// 再由 CSS(.style-tweaker-fe-colorful-collapse) 将其 color 设为 var(--style-tweaker-fe-colorful-tab-color)。
// 折叠箭头的真实容器 class 是 .collapse-icon（Obsidian 新版），内部为 <svg class="svg-icon">。
const COLORFUL_COLLAPSE_ICON_CLASS = "style-tweaker-fe-colorful-collapse";
// 每个 Document 维护一个 MutationObserver，用于捕获文件树动态渲染（展开/折叠）
// 时新生成的折叠箭头，及时补加门控类。
const collapseObservers = new Map<Document, MutationObserver>();

// 每个 Document 维护一个 MutationObserver，用于捕获展开时新渲染的文件夹标题，
// 及时补写 data-count，使子文件夹的笔记数量也能正常显示。
const countObservers = new Map<Document, MutationObserver>();

// 彩色文件夹模式 class 前缀：真实模式为 "…colorful-{suffix}"（带 "-")。
const COLORFUL_MODE_PREFIX = "style-tweaker-fe-colorful-mode-";
const COLORFUL_PALETTE_PREFIX = "style-tweaker-fe-colorful-palette-";

const FOLDER_COLOR_DARK_VAR = "--style-tweaker-fe-colorful-custom-color-dark";
const FOLDER_COLOR_LIGHT_VAR = "--style-tweaker-fe-colorful-custom-color-light";

export class FileExplorerService {
	private plugin: Plugin;
	private app: App;
	private getSettings: () => StyleTweakerSettings;
	private enabled = false;
	private listenersRegistered = false;
	private touchedDocuments = new Set<Document>();
	private vaultEventRefs: EventRef[] = [];

	constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
		this.plugin = plugin;
		this.app = plugin.app;
		this.getSettings = getSettings;
	}

	enable(): void {
		this.enabled = true;
		if (!this.listenersRegistered) {
			this.listenersRegistered = true;
			const { workspace, vault } = this.app;
			// onLayoutReady 是 Obsidian 管理的一次性回调，无需退订
			workspace?.onLayoutReady(() => this.apply());
			// workspace 事件一律走 registerEvent：插件卸载时自动退订，
			// 避免裸 workspace.on 在卸载后残留回调（重复 apply / 引用不释放）。
			if (workspace) {
				this.plugin.registerEvent(workspace.on("layout-change", () => this.apply()));
				this.plugin.registerEvent(workspace.on("window-open", () => this.apply()));
				// 主题（深色/浅色）切换时重新应用对应的彩色文件夹配置
				this.plugin.registerEvent(workspace.on("css-change", () => this.apply()));
			}
			// 笔记数量需要随 vault 增删改实时更新
			this.vaultEventRefs.push(vault.on("create", () => this.apply()));
			this.vaultEventRefs.push(vault.on("rename", () => this.apply()));
			this.vaultEventRefs.push(vault.on("delete", () => this.apply()));
		}
		this.apply();
	}

	disable(): void {
		this.enabled = false;
		const { vault } = this.app;
		for (const ref of this.vaultEventRefs) vault.offref(ref);
		this.vaultEventRefs.length = 0;
		this.clearAll();
	}

	apply(): void {
		if (!this.enabled) return;
		for (const doc of getAppDocuments(this.app)) {
			this.applyToDocument(doc);
		}
	}

	private applyToDocument(doc: Document): void {
		if (!doc?.body) return;
		const s = this.getSettings();
		const body = doc.body;

		// 当前主题派生值：彩色文件夹的模式/配色、去除第一层图标、行末标记都按主题取一套
		const isDark = body.classList.contains("theme-dark");
		const mode = isDark ? s.feColorfulFolderModeDark : s.feColorfulFolderModeLight;
		const palette = isDark
			? s.feColorfulFolderPaletteDark
			: s.feColorfulFolderPaletteLight;
		const removeFirstFolderIcon = isDark
			? s.feRemoveFirstLevelFolderIconDark
			: s.feRemoveFirstLevelFolderIconLight;
		const indicator = s.feFolderTrailingMarker ?? "none";
		const colorfulOn = s.feColorfulFoldersEnabled === true;

		// 先清除所有旧的彩色文件夹 class（mode / palette），避免切换时残留叠加导致特异性冲突。
		for (let i = body.classList.length - 1; i >= 0; i--) {
			const cls = body.classList[i];
			if (
				cls.startsWith(COLORFUL_MODE_PREFIX) ||
				cls.startsWith(COLORFUL_PALETTE_PREFIX)
			) {
				body.classList.remove(cls);
			}
		}

		// 布尔门控类统一挂摘：[[类名, 是否挂载], …]，避免逐条 classList.toggle 样板。
		const toggles: Array<[string, boolean]> = [
			[FILE_ICONS_CLASS, s.feAddFileIcon === true],
			[FOLDER_ICONS_CLASS, s.feReplaceFolderIcon === true],
			[FILE_NAME_WRAP_CLASS, s.feFileNameWrap === true],
			// 悬停显示后缀标签：默认隐藏、hover 显示由 CSS 同一条规则的两种状态控制
			[HOVER_REVEAL_FILE_TAG_CLASS, s.feHoverRevealFileTag === true],
			// 去除第一层文件夹前图标：彩色文件夹开启，且当前主题的彩色化类型为
			// 彩色边框(border) 或 彩色色块(tab) 时才生效（它是 border/tab 的子设置）。
			[
				REMOVE_FIRST_FOLDER_ICON_CLASS,
				colorfulOn &&
					removeFirstFolderIcon === true &&
					(mode === "border" || mode === "tab"),
			],
			// 文件夹行末标记：无 / 圆点 / 笔记数量（dot 与 count 互斥）
			[FOLDER_MARKER_DOT_CLASS, indicator === "dot"],
			[FOLDER_MARKER_COUNT_CLASS, indicator === "count"],
			[COLORFUL_FOLDERS_CLASS, colorfulOn],
			[this.colorfulModeClass(mode), colorfulOn],
			[COLORFUL_PALETTE_PREFIX + palette, colorfulOn],
		];
		for (const [cls, on] of toggles) body.classList.toggle(cls, on);

		// 彩色文件夹自定义配色基色（仅 custom 配色使用）。
		// 按深浅主题各设一套：--style-tweaker-fe-colorful-custom-color-dark / -light，
		// 由 CSS 在 .theme-dark/.theme-light 下分别选用（见 06-colorful-palette-custom.css）。
		// 这里始终把深色、浅色的基色都写进去（CSS 按主题取用），实现深浅各自配色。
		if (colorfulOn) {
			body.style.setProperty(
				FOLDER_COLOR_DARK_VAR,
				resolveAccentValue(s.feColorfulFolderColorDark, "#ef8c3a"),
			);
			body.style.setProperty(
				FOLDER_COLOR_LIGHT_VAR,
				resolveAccentValue(s.feColorfulFolderColorLight, "#ef8c3a"),
			);
		} else {
			body.style.removeProperty(FOLDER_COLOR_DARK_VAR);
			body.style.removeProperty(FOLDER_COLOR_LIGHT_VAR);
		}

		// 折叠箭头门控类：彩色文件夹开启时给所有 .collapse-icon > svg 加
		// .style-tweaker-fe-colorful-collapse，由 CSS 着彩虹色；关闭时移除并停观察。
		this.syncCollapseIconClass(doc, colorfulOn);

		// 笔记数量：仅当行末标记选「笔记数量」时计算并写入 data-count，否则清空。
		// 子文件夹标题是展开时才渲染的，需用 MutationObserver 监听补写 data-count。
		const countOn = indicator === "count";
		if (countOn) {
			this.updateFolderCounts(doc);
		} else {
			this.clearFolderCounts(doc);
		}
		this.syncFolderCountObserver(doc, countOn);

		this.touchedDocuments.add(doc);
	}

	/** 计算每个文件夹下 markdown 笔记数量，并写入文件列表各文件夹标题的 data-count 属性（供 CSS 显示）。 */
	private updateFolderCounts(doc: Document): void {
		if (!this.app?.vault) return;
		// 1) 统计每个路径（含所有祖先文件夹）的 md 笔记数量
		const countMap = new Map<string, number>();
		for (const file of this.app.vault.getAllLoadedFiles()) {
			if (!(file instanceof TFile)) continue;
			if (file.extension.toLowerCase() !== "md") continue;
			let dir = this.getParentPath(file.path);
			while (dir) {
				countMap.set(dir, (countMap.get(dir) ?? 0) + 1);
				dir = this.getParentPath(dir);
			}
		}
		// 2) 遍历文件列表中的文件夹标题，写入 data-count
		doc
			.querySelectorAll(
				'[data-type="file-explorer"] .nav-folder-title',
			)
			.forEach((el) => {
				const path = el.getAttribute("data-path");
				if (path === null || path === "") {
					el.removeAttribute("data-count");
					return;
				}
				const count = countMap.get(path);
				if (count !== undefined && count > 0) {
					el.setAttribute("data-count", String(count));
				} else {
					el.removeAttribute("data-count");
				}
			});
	}

	/** 清空文件列表中所有文件夹标题的 data-count（切回无/圆点模式时调用）。 */
	private clearFolderCounts(doc: Document): void {
		doc
			.querySelectorAll(
				'[data-type="file-explorer"] .nav-folder-title[data-count]',
			)
			.forEach((el) => el.removeAttribute("data-count"));
	}

	/** 同步笔记数量的 MutationObserver：开启时监听文件列表 DOM 变化，新展开渲染的文件夹标题
	   及时补写 data-count；关闭时断开观察并清理。 */
	private syncFolderCountObserver(doc: Document, on: boolean): void {
		const existing = countObservers.get(doc);
		if (!on) {
			if (existing) {
				existing.disconnect();
				countObservers.delete(doc);
			}
			return;
		}
		if (existing) return;
		const container = doc.querySelector(
			'[data-type="file-explorer"] .nav-files-container',
		);
		if (!container) return;
		const observer = new doc.defaultView!.MutationObserver(() => {
			// 只处理与文件夹标题相关的节点增删，避免过度重算
			this.updateFolderCounts(doc);
		});
		observer.observe(container, {
			childList: true,
			subtree: true,
		});
		countObservers.set(doc, observer);
	}

	/** 获取路径的父目录（不含根）。"/" 或一级目录返回 null。 */
	private getParentPath(path: string): string | null {
		const idx = path.lastIndexOf("/");
		if (idx <= 0) return null;
		return path.slice(0, idx);
	}

	/** 给文档内【文件列表】中所有折叠箭头 svg 加/移除门控类，并在开启时启动/关闭时停止 MutationObserver。
	   限定在 [data-type="file-explorer"] 内，避免溢出到标签栏、搜索、其他侧栏的折叠箭头。 */
	private syncCollapseIconClass(doc: Document, on: boolean): void {
		const existing = collapseObservers.get(doc);
		if (on) {
			const mark = () => {
				doc
					.querySelectorAll(
						'[data-type="file-explorer"] .collapse-icon > svg, [data-type="file-explorer"] .tree-item-icon.collapse-icon svg'
					)
					.forEach((svg) => svg.classList.add(COLORFUL_COLLAPSE_ICON_CLASS));
			};
			mark();
			if (!existing) {
				const observer = new MutationObserver(mark);
				observer.observe(doc.body, {
					childList: true,
					subtree: true,
				});
				collapseObservers.set(doc, observer);
			}
		} else {
			doc
				.querySelectorAll("." + COLORFUL_COLLAPSE_ICON_CLASS)
				.forEach((svg) => svg.classList.remove(COLORFUL_COLLAPSE_ICON_CLASS));
			if (existing) {
				existing.disconnect();
				collapseObservers.delete(doc);
			}
		}
	}

	private clearAll(): void {
		for (const doc of new Set([
			...this.touchedDocuments,
			...getAppDocuments(this.app),
		])) {
			// 清除所有彩色文件夹相关的 class（mode / palette / 总开关）
			const bodyEl = doc.body;
			if (bodyEl) {
				for (let i = bodyEl.classList.length - 1; i >= 0; i--) {
					const cls = bodyEl.classList[i];
					if (
						cls === COLORFUL_FOLDERS_CLASS ||
						cls.startsWith(COLORFUL_MODE_PREFIX) ||
						cls.startsWith(COLORFUL_PALETTE_PREFIX)
					) {
						bodyEl.classList.remove(cls);
					}
				}
			}
			doc.body?.style.removeProperty(FOLDER_COLOR_DARK_VAR);
			doc.body?.style.removeProperty(FOLDER_COLOR_LIGHT_VAR);
			// 清理折叠箭头门控类与对应的 MutationObserver
			doc
				.querySelectorAll("." + COLORFUL_COLLAPSE_ICON_CLASS)
				.forEach((svg) => svg.classList.remove(COLORFUL_COLLAPSE_ICON_CLASS));
			const obs = collapseObservers.get(doc);
			if (obs) {
				obs.disconnect();
				collapseObservers.delete(doc);
			}
			const countObs = countObservers.get(doc);
			if (countObs) {
				countObs.disconnect();
				countObservers.delete(doc);
			}
			// 清理文件夹行末标记（圆点 / 计数）相关 class 与 data-count
			bodyEl?.classList.remove(
				FOLDER_MARKER_DOT_CLASS,
				FOLDER_MARKER_COUNT_CLASS,
			);
			// 清理文件名换行 / 悬停显示后缀标签相关 class
			bodyEl?.classList.remove(
				FILE_NAME_WRAP_CLASS,
				HOVER_REVEAL_FILE_TAG_CLASS,
			);
			doc
				.querySelectorAll(
					'[data-type="file-explorer"] .nav-folder-title[data-count]',
				)
				.forEach((el) => el.removeAttribute("data-count"));
		}
		this.touchedDocuments.clear();
	}

	/**
	 * 把存储的 mode 值归一化为 CSS 中真实的 class 名（"…colorful-{mode}"）。
	 */
	private colorfulModeClass(type: string): string {
		const normalized = type.trim();
		return COLORFUL_MODE_PREFIX + (normalized === "" ? "background" : normalized);
	}
}
