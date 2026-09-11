import { App, Modal, getIcon, getIconIds, setIcon } from "obsidian";

import { t } from "../utils/i18n";

/**
 * 单元格（单个图标按钮）边长，单位 px。必须与 CSS 中
 * .style-tweaker-icon-picker-cell 的宽高保持一致，虚拟滚动依赖它换算行列。
 */
const CELL_SIZE = 36;
/** 单元格间距，单位 px。必须与 CSS 中 .style-tweaker-icon-picker-row 的 gap 一致。 */
const CELL_GAP = 4;
/** 单行步进（行高 + 间距）：滚动偏移换算可视行范围的基准。 */
const CELL_STEP = CELL_SIZE + CELL_GAP;
/** 可视区上下各多渲染的行数，减少快速滚动时的空白闪动。 */
const OVERSCAN_ROWS = 2;

/**
 * 图标选择弹窗（虚拟滚动网格，只显示图标、不显示名称）：
 * 列出 Obsidian 运行时可用图标（getIconIds 返回 lucide 内置库 + 其它插件 addIcon 注册的图标），
 * 支持按名称过滤（前缀优先，其次包含匹配）。
 *
 * 懒加载（Lazy），三层都按需：
 * 1. 数据懒加载：构造函数与 onOpen 都不取图标清单，先出弹窗骨架（搜索框 + 空网格）即时可交互，
 *    清单延迟到下一帧 rAF 才调用 getIconIds（图标极多时它本身要枚举一次全部图标）。
 * 2. DOM 懒渲染：网格只渲染可视区 ±OVERSCAN_ROWS 行（约百来个单元格），滚动到哪渲染到哪，
 *    因此列表有几万项也只存在几十个单元格节点。
 * 3. 图标懒创建：只对可视单元格调用 setIcon 解析 SVG，其余图标始终不生成 SVG 节点。
 *
 * 为什么不用 SuggestModal：SuggestModal 会把 getSuggestions 返回的项全部同步渲染成 DOM
 * （renderSuggestion + append），图标数量上万时会一次性创建数万个 SVG 节点，直接卡死界面。
 *
 * 名称只作为 aria-label 存在，不占可视空间（用户要的是"只看图标"）；
 * 选中后回调「已注册图标 id」（getIconIds 中的值，形如 lucide-star）与序列化后的 SVG 代码，
 * 由调用方决定存哪个：
 * - 内置图标徽标：存 id（name）
 * - 自定义 SVG 徽标：存 SVG 代码（svg）
 */
export class IconPicker extends Modal {
  /** 全部图标 id：延迟到打开后的下一帧才取（null = 尚未加载）。 */
  private icons: string[] | null = null;
  /** 与 icons 同序的小写名缓存：过滤时避免每次按键对全表重复 toLowerCase。 */
  private lowerIcons: string[] | null = null;
  /** 当前过滤结果；清单加载完成前为空数组（骨架态）。 */
  private filtered: string[] = [];
  /** 当前搜索关键词：加载期间输入的关键词会被记住，加载完成后据此过滤。 */
  private query = "";
  private gridEl: HTMLElement | null = null;
  private trackEl: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  /** 待执行的重绘帧 id（0 表示无排队），滚动事件高频触发时合并到一帧。 */
  private frame = 0;
  /** 待执行的懒加载帧 id（0 表示无排队）。 */
  private loadFrame = 0;
  /** 匹配数量提示元素（搜索框与网格之间那一行小字）。 */
  private countEl: HTMLElement | null = null;

  constructor(
    app: App,
    private readonly onPick: (name: string, svg: string) => void,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl, modalEl, titleEl } = this;
    modalEl.addClass("style-tweaker-icon-picker");
    // 标题：弹窗用途固定，文案在本地取，不必让调用方传参
    titleEl.setText(t("newtab.logo.icon.pickerTitle"));
    contentEl.empty();

    // 搜索框：输入即过滤，几万项线性过滤只需数毫秒（与设置项里那个内联建议同一套
    // 前缀/包含匹配算法）。
    // 占位文案与设置项输入框分开：这里是「在网格里筛图标」，设置项那里是「输入后要从列表里
    // 选一个」，两句话要传达的动作不同，共用一条只会让两边都说不清。
    const searchEl = contentEl.createEl("input", {
      type: "text",
      cls: "style-tweaker-icon-picker-search",
      attr: { placeholder: t("newtab.logo.icon.pickerSearch") },
    });
    searchEl.addEventListener("input", () => this.setQuery(searchEl.value));
    // 回车选中当前第一个匹配项（保留纯键盘可用性；网格内的方向键导航不做，
    // 避免在几万项列表上维护焦点位置）。
    searchEl.addEventListener("keydown", (evt) => {
      if (evt.key !== "Enter") return;
      const first = this.filtered[0];
      if (first) this.choose(first);
    });

    // 匹配数量提示：夹在搜索框与网格之间、居中一行小字（初始无文字，等清单加载完再由
    // applyQuery 填上）。放这里而不是浮在网格角上，是因为：①视线路径本就是「搜索框 → 结果」，
    // 计数贴着搜索框最易读；②不遮挡任何单元格与滚动条；③不参与虚拟滚动的偏移换算。
    // 两端同一份布局：纯文本、无 hover/点击态，宽度自适应，矮屏下由 CSS 压到最薄。
    const countEl = contentEl.createDiv("style-tweaker-icon-picker-count");
    this.countEl = countEl;

    // 滚动容器 + 撑总高度的占位层（可视行以绝对定位挂在占位层内）
    const gridEl = contentEl.createDiv("style-tweaker-icon-picker-grid");
    const trackEl = gridEl.createDiv("style-tweaker-icon-picker-track");
    gridEl.addEventListener("scroll", () => this.scheduleRender());
    this.gridEl = gridEl;
    this.trackEl = trackEl;

    // 容器尺寸变化（弹窗缩放 / 分屏）时重算列数
    this.resizeObserver = new ResizeObserver(() => this.scheduleRender());
    this.resizeObserver.observe(gridEl);

    // 数据懒加载：本帧只留下骨架（空网格），清单留到下一帧取，打开动作不被大列表拖慢。
    this.loadFrame = gridEl.win.requestAnimationFrame(() => {
      this.loadFrame = 0;
      this.loadIcons();
    });
    searchEl.focus();
  }

  onClose(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    const win = this.gridEl?.win ?? activeWindow;
    if (this.frame) {
      win.cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
    if (this.loadFrame) {
      win.cancelAnimationFrame(this.loadFrame);
      this.loadFrame = 0;
    }
    this.gridEl = null;
    this.trackEl = null;
    this.countEl = null;
    // 释放大数组引用，让弹窗关闭后可被回收
    this.icons = null;
    this.lowerIcons = null;
    this.filtered = [];
    // 关键词也要清：搜索框是每次 onOpen 重建的空输入框，留着旧关键词会让下次打开时
    // 输入框看着为空、结果与计数却还是上次的过滤结果。
    this.query = "";
    this.contentEl.empty();
  }

  /** 懒加载入口：取一次运行时图标清单，随后按当前关键词渲染首屏。 */
  private loadIcons(): void {
    // 弹窗已关闭（onClose 清空了 gridEl）时放弃加载
    if (!this.gridEl) return;
    const icons = getIconIds();
    this.icons = icons;
    this.filtered = icons;
    // 加载期间用户可能已经打入了关键词，这里统一按它过滤
    this.applyQuery();
    this.render();
  }

  /** 合并同一帧内的多次重绘请求。 */
  private scheduleRender(): void {
    const gridEl = this.gridEl;
    if (!gridEl || this.frame) return;
    this.frame = gridEl.win.requestAnimationFrame(() => {
      this.frame = 0;
      this.render();
    });
  }

  /** 只渲染可视区（含上下 OVERSCAN_ROWS 行）的单元格。 */
  private render(): void {
    const gridEl = this.gridEl;
    const trackEl = this.trackEl;
    // 清单尚未加载（骨架态）不渲染内容
    if (!gridEl || !trackEl || !this.icons) return;

    // 用占位层的内容宽度（已扣除网格容器的横向内边距与滚动条宽度），
    // 不能用 gridEl.clientWidth：它含内边距，会把列数算多、最后一行被滚动条顶出去。
    const width = trackEl.clientWidth;
    // 弹窗尚未完成布局（宽度为 0）时不渲染，等 ResizeObserver 回调补上
    if (!width) return;

    // 列数按可视宽度换算（至少 1 列），行内整体居中留白
    const columns = Math.max(1, Math.floor((width + CELL_GAP) / CELL_STEP));
    const contentWidth = columns * CELL_STEP - CELL_GAP;
    const offset = Math.max(0, (width - contentWidth) / 2);
    const total = this.filtered.length;
    const rows = Math.ceil(total / columns);

    trackEl.setCssProps({ height: `${rows * CELL_STEP}px` });

    const viewHeight = gridEl.clientHeight;
    const scrollTop = gridEl.scrollTop;
    const firstRow = Math.max(0, Math.floor(scrollTop / CELL_STEP) - OVERSCAN_ROWS);
    const lastRow = Math.min(
      rows,
      Math.ceil((scrollTop + viewHeight) / CELL_STEP) + OVERSCAN_ROWS,
    );

    trackEl.empty();
    for (let row = firstRow; row < lastRow; row++) {
      const rowEl = trackEl.createDiv("style-tweaker-icon-picker-row");
      rowEl.setCssProps({
        top: `${row * CELL_STEP}px`,
        height: `${CELL_SIZE}px`,
        left: `${offset}px`,
      });
      const start = row * columns;
      const end = Math.min(start + columns, total);
      for (let i = start; i < end; i++) this.renderCell(rowEl, this.filtered[i]);
    }
  }

  /** 单元格：只有图标 + aria-label（不显示名称文字）。 */
  private renderCell(rowEl: HTMLElement, name: string): void {
    const cellEl = rowEl.createDiv("style-tweaker-icon-picker-cell");
    cellEl.setAttribute("aria-label", name);
    setIcon(cellEl, name);
    cellEl.addEventListener("click", () => this.choose(name));
  }

  /** 关键词变化：清单未加载完成时只记录，等加载完成统一过滤。 */
  private setQuery(raw: string): void {
    this.query = raw;
    if (!this.icons) return;
    this.applyQuery();
    this.render();
  }

  /** 按当前关键词重算 filtered（前缀优先，其次包含匹配），并回到顶部。 */
  private applyQuery(): void {
    const icons = this.icons;
    if (!icons) return;

    const q = this.query.trim().toLowerCase();
    if (!q) {
      this.filtered = icons;
      if (this.gridEl) this.gridEl.scrollTop = 0;
      this.updateCount();
      return;
    }

    // 小写名缓存只在「真的要过滤」时才建：浏览全部图标用不到它，
    // 几十万图标时这份 map 的分配量不可忽略，能省一次就省一次。
    let lower = this.lowerIcons;
    if (!lower || lower.length !== icons.length) {
      lower = icons.map((name) => name.toLowerCase());
      this.lowerIcons = lower;
    }

    const starts: string[] = [];
    const contains: string[] = [];
    for (let i = 0; i < icons.length; i++) {
      const lowerName = lower[i];
      if (lowerName.startsWith(q)) starts.push(icons[i]);
      else if (lowerName.includes(q)) contains.push(icons[i]);
    }
    this.filtered = starts.concat(contains);
    if (this.gridEl) this.gridEl.scrollTop = 0;
    this.updateCount();
  }

  /**
   * 刷新搜索框下方那行数量提示：有关键词时显示「匹配到 N 个图标」，否则显示「共 N 个图标」。
   *
   * 只在文字真的变了才写 DOM：逐键过滤时这行字大部分时候不变，省掉一次无谓的文本布局
   * （图标数量几万时按键本身就是主要开销，别再给每键叠一层 DOM 写入）。
   * 文案里的 {n} 在这里就地替换——轻量 i18n 的 t() 只做字典查找，不支持占位符插值。
   */
  private updateCount(): void {
    const countEl = this.countEl;
    if (!countEl) return;
    const key = this.query.trim()
      ? "newtab.logo.icon.pickerMatch"
      : "newtab.logo.icon.pickerTotal";
    const text = t(key).replace("{n}", String(this.filtered.length));
    if (countEl.textContent !== text) countEl.setText(text);
  }

  /** 选中：回调已注册 id 与序列化 SVG，再关闭弹窗。 */
  private choose(name: string): void {
    const icon = getIcon(name);
    this.onPick(name, icon ? icon.outerHTML : "");
    this.close();
  }
}
