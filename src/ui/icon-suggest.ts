import { AbstractInputSuggest, App, setIcon, getIconIds } from "obsidian";

/**
 * 图标名称搜索建议（AbstractInputSuggest，过滤算法与 IconPicker 同一套）：
 * 绑定到徽标图标的文本输入框，边输入边按名称匹配 Obsidian 运行时可用图标
 * （getIconIds 返回 lucide 内置库 + 其它插件 addIcon 注册的图标）。
 *
 * 性能设计（目标：几十万图标下与 IconPicker 一样丝滑）：
 * - 图标清单与小写名缓存都延迟到第一次输入才建，构造期不做任何全表工作
 *   （设置面板每次重绘都会 new 一个 IconSuggest，构造期建大索引会拖慢面板重绘）；
 * - 过滤只做一次线性扫描：前缀命中优先、其次包含命中，收满即停，不做逐项评分。
 *   逐项评分的模糊匹配在几十万图标下是每次按键的主要延迟来源
 *   （20 万项实测：评分搜索 120~160ms/次，线性扫描 8~12ms/次），
 *   IconPicker 的搜索框同样只用前缀/包含匹配；
 * - 每次按键返回的条数沿用基类 AbstractInputSuggest.limit（默认 100，与 FolderSuggest /
 *   ImagePicker 同一写法）。基类会同步渲染返回的全部项，所以这个上限必须留着，
 *   切勿放宽到全部图标数量——几万个图标的 SVG 逐项解析会长时间阻塞主线程，
 *   那正是旧版 IconPicker 卡死的根因。
 */

/** 基类未给出 limit 时的兜底条数（与 FolderSuggest / ImagePicker 同一兜底值）。 */
const FALLBACK_LIMIT = 100;

export class IconSuggest extends AbstractInputSuggest<string> {
  private readonly inputEl: HTMLInputElement;
  /** 全部图标 id：null 表示尚未加载（延迟到第一次输入，构造期不做全表工作）。 */
  private icons: string[] | null = null;
  /** 与 icons 同序的小写名缓存：过滤时避免每次按键对全表重复 toLowerCase。 */
  private lowerIcons: string[] | null = null;

  constructor(
    app: App,
    inputEl: HTMLInputElement,
    onSelect?: (name: string) => void,
  ) {
    super(app, inputEl);
    this.inputEl = inputEl;

    // 选中回调走基类的注册式 API（与 FolderSuggest / FontSuggest 同一写法）：
    // 只在用户从建议列表中选定一项时触发。输入框上没有注册 input 监听，因此手打输入
    // 既不写设置也不刷预览，外部把「保存 + 刷新预览」全部收敛到这条回调链路上。
    if (onSelect) {
      this.onSelect((name) => {
        // 直接写 DOM 值（不经 setValue）：不再额外派发 input 事件。
        this.inputEl.value = name;
        onSelect(name);
        // 基类选中后已 close 一次；值变化可能让建议框重新打开，事件循环后再兜一次
        // （FolderSuggest / FontSuggest 的 setValue 有同样问题）。
        window.setTimeout(() => this.close(), 0);
      });
    }
  }

  getSuggestions(query: string): string[] {
    const q = query.trim().toLowerCase();
    // 空查询不弹建议：聚焦或清空输入框时保持安静，开始输入才给出匹配
    if (!q) return [];

    // 首次输入才枚举图标清单并建小写缓存（与 IconPicker 的懒加载同理）：
    // 小写缓存只建一次，之后每次按键都复用，避免对全表重复 toLowerCase。
    let icons = this.icons;
    let lower = this.lowerIcons;
    if (!icons || !lower) {
      icons = getIconIds();
      lower = icons.map((name) => name.toLowerCase());
      this.icons = icons;
      this.lowerIcons = lower;
    }

    // 条数上限沿用基类的 limit（默认 100，与 FolderSuggest / ImagePicker 同一写法）：
    // 基类会同步渲染返回的全部项，所以上限得留着；limit 为 0（不限制）时退回兜底值。
    const limit = this.limit || FALLBACK_LIMIT;

    // 前缀优先、其次包含：一次线性扫描，不做任何逐项评分（与 IconPicker 的搜索框一致）。
    // 前缀命中已经填满上限时直接停，后面的包含命中不可能再排到前缀之前。
    const starts: string[] = [];
    const contains: string[] = [];
    for (let i = 0; i < icons.length; i++) {
      const lowerName = lower[i];
      if (lowerName.startsWith(q)) {
        if (starts.length < limit) starts.push(icons[i]);
        if (starts.length >= limit) break;
      } else if (lowerName.includes(q) && contains.length < limit) {
        contains.push(icons[i]);
      }
    }
    return starts.concat(contains).slice(0, limit);
  }

  renderSuggestion(name: string, el: HTMLElement): void {
    el.addClass("style-tweaker-logo-suggestion");
    el.empty();

    const preview = el.createDiv({ cls: "style-tweaker-logo-suggestion-icon" });
    setIcon(preview, name);

    const info = el.createDiv({ cls: "style-tweaker-logo-suggestion-name" });
    info.createDiv({ text: name });
  }
}
