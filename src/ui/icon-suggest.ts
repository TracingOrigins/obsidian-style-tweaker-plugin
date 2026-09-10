import { AbstractInputSuggest, App, setIcon, getIconIds } from "obsidian";
import Fuse from "fuse.js";
import type { IFuseOptions } from "fuse.js";

/**
 * 图标名称搜索建议（AbstractInputSuggest + Fuse.js 模糊搜索，参考 home-tab-plus 的 iconSuggester）：
 * 绑定到徽标图标的文本输入框，边输入边模糊匹配 Obsidian 运行时可用图标
 * （getIconIds 返回 lucide 内置库 + 其它插件 addIcon 注册的图标）。
 *
 * 性能设计（借鉴要点）：
 * - Fuse 索引在构造时建立一次，之后每次按键复用索引，不做全表线性扫描；
 * - 每次最多返回少量结果（SCORE_LIMIT 15 条）并按匹配分数过滤，
 *   每次按键的渲染开销被限制在十几个建议项内。
 *   切勿放宽到全部图标数量——AbstractInputSuggest 会同步渲染全部建议项，
 *   上千个图标的 SVG 逐项解析会长时间阻塞主线程（旧版 IconPicker 卡死的根因）。
 */

/** 模糊匹配分数阈值：score 越低越匹配，超过阈值的结果视为不相关而丢弃。 */
const SCORE_THRESHOLD = 0.25;
/** 每次按键最多返回/渲染的建议条数。 */
const SCORE_LIMIT = 15;

/** 图标名为短字符串：开启评分（阈值过滤需要），其余为短字段调优参数。 */
const FUSE_OPTIONS: IFuseOptions<string> = {
  includeScore: true,
  threshold: 0.2,
  distance: 100,
  // 偏向查询占目标串比例高的匹配（如 "arrow" 命中 "arrow" 优于 "box-arrows"）
  fieldNormWeight: 1.35,
};

export class IconSuggest extends AbstractInputSuggest<string> {
  private readonly inputEl: HTMLInputElement;
  private readonly iconList: string[];
  private readonly fuse: Fuse<string>;

  constructor(app: App, inputEl: HTMLInputElement) {
    super(app, inputEl);
    this.inputEl = inputEl;
    // 图标列表与 Fuse 索引都只在构造时建一次，后续按键复用。
    this.iconList = getIconIds();
    this.fuse = new Fuse(this.iconList, FUSE_OPTIONS);
  }

  getSuggestions(query: string): string[] {
    const q = query.trim();
    // 空查询不弹建议：聚焦或清空输入框时保持安静，开始输入才给出匹配
    if (!q) return [];
    // 先限量搜索再按分数过滤（与被借鉴方案一致：fuse 级 limit 提前截断，减少计算）
    return this.fuse
      .search(q, { limit: SCORE_LIMIT })
      .filter((r) => r.score == null || r.score < SCORE_THRESHOLD)
      .map((r) => r.item);
  }

  renderSuggestion(name: string, el: HTMLElement): void {
    el.addClass("style-tweaker-logo-suggestion");
    el.empty();

    const preview = el.createDiv({ cls: "style-tweaker-logo-suggestion-icon" });
    setIcon(preview, name);

    const info = el.createDiv({ cls: "style-tweaker-logo-suggestion-name" });
    info.createDiv({ text: name });
  }

  /**
   * 选中建议：写回输入框并以 DOM input 事件通知外部（外部监听该事件保存设置、刷新预览），
   * 再关闭建议框。事件同步派发，之后 close 即为最终状态；事件循环后再关一次兜底，
   * 防止 input 事件让建议框因新值重新打开（FolderSuggest 的 setValue 也有同样问题）。
   */
  selectSuggestion(name: string): void {
    this.inputEl.value = name;
    this.inputEl.trigger("input");
    this.close();
    window.setTimeout(() => this.close(), 0);
  }
}
