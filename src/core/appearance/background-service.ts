import { TFile, type Plugin } from "obsidian";
import { getAppDocuments } from "../../utils/documents";
import { buildBackgroundLayerCss, buildTokensCss } from "../../utils/background-css";
import { StyleTweakerSettings, type WallpaperMode } from "../../types/settings";
import { flavorToHex, buildFlavorCss } from "../../utils/color-palette";
import { getSortedBackgroundImages, isSelectableImage } from "../../utils/background-images";
import { ImagePicker } from "../../ui/image-picker";
import { BaseService } from "../base-service";

// 自动切换时某套壁纸的标识键（桌面/移动 × 深浅）
export type WallpaperKey =
  | "desktopDark"
  | "desktopLight"
  | "mobileDark"
  | "mobileLight";

// 自动切换定时器最小/最大间隔（秒）
const AUTO_MIN_INTERVAL = 30;
const AUTO_MAX_INTERVAL = 1800;

// 纯色背景兜底色（flavor 解析失败时的回退 hex）
const SOLID_DEFAULT_DARK = "#1e1e1e";
const SOLID_DEFAULT_LIGHT = "#f5f5f5";

export interface ResolvedBackground {
  desktopDark: string;
  desktopLight: string;
  mobileDark: string;
  mobileLight: string;
}

const STYLE_ID = "style-tweaker-bg";

// 图片背景专属门控类：仅在背景已激活 且 图片模式（backgroundType === "image"）时挂载。
// 静态 styles.css 里"仅图片背景才需要"的规则以该类为前缀，
// 纯色模式下不挂载，从而不会误触发图片专属样式。与 --style-tweaker-bg-image token 同构。
const IMAGE_CLASS = "style-tweaker-bg-image-active";

// 纯色背景专属门控类：仅在背景已激活 且 纯色模式（backgroundType === "solid"）时挂载。
// 静态 solid.css 里"仅纯色背景才需要"的规则以该类为前缀。
// 图片模式下不挂载，避免纯色底色溢出到图片模式（如 .modal.mod-settings 无 background-image
// 会显示纯色而非壁纸）。与 IMAGE_CLASS 对称，二者互斥。
const SOLID_CLASS = "style-tweaker-bg-solid-active";

/**
 * 界面背景服务（纯色 / 图片壁纸）。
 *
 * 采用 JS 逐窗口注入 <style>（背景图 URL 需运行时 getResourcePath 解析，CSS snippet
 * 无法加载），并覆盖独立设置窗口等 pop-out 场景。逐文档逻辑见 applyBackgroundToDocument。
 *
 * 继承 BaseService 复用生命周期骨架，仅覆写 apply()；vault 事件、焦点轮询、主题
 * MutationObserver 经 registerExtraListeners() 钩子注入。
 */
export class BackgroundService extends BaseService {
  // 上次记录的活动文档，用于轮询检测窗口焦点切换
  private lastActiveDoc: Document | null = null;
  private activeDocInterval: number | null = null;
  // 主文档 body 的 class 变化观察器：用于检测深色/浅色主题切换，
  // 主题切换会改 body 的 theme-dark / theme-light 类，需重新按新主题选图。
  private themeObserver: MutationObserver | null = null;
  // 自动切换定时器：只对"当前生效套"开一个定时器
  private autoTimer: number | null = null;

  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    super(plugin, getSettings);
  }

  /** 额外事件：vault 增删改 + 焦点轮询 + 主题 observer；返回 disable() 时的退订回调。 */
  protected registerExtraListeners(): (() => void) | void {
    const { vault } = this.app;
    // 文件改名/删除后重解析图片 URL（registerEvent 由插件卸载时自动退订）
    this.plugin.registerEvent(vault.on("rename", () => this.apply()));
    this.plugin.registerEvent(vault.on("delete", () => this.apply()));
    // 焦点兜底：独立设置窗口不触发 window-open/layout-change，仅 activeDocument 变化，
    // 故 150ms 轮询检测焦点切换后补注入（仅 activeDocument 变化时才 apply，开销极低）。
    this.activeDocInterval = window.setInterval(() => {
      const ad = activeDocument;
      if (ad && ad !== this.lastActiveDoc) {
        this.lastActiveDoc = ad;
        this.apply();
      }
    }, 150);
    this.plugin.registerInterval(this.activeDocInterval);
    // 主题切换改 body 的 theme-dark/light 类，需重新按新主题选图。
    // 注意：apply() 会挂摘背景门控类（IMAGE_CLASS/SOLID_CLASS），也改 body class；
    // 因此 observer 只关注 theme-dark/theme-light 的切换，避免 apply 改 class 再触发
    // observer → apply 的无限递归（此前因此卡死 Obsidian）。
    const body = window.document?.body;
    if (body && "MutationObserver" in window) {
      let lastHasThemeDark = body.classList.contains("theme-dark");
      this.themeObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (
            m.type === "attributes" &&
            (m.attributeName === "class" || m.attributeName === "className")
          ) {
            const nowDark = body.classList.contains("theme-dark");
            if (nowDark !== lastHasThemeDark) {
              lastHasThemeDark = nowDark;
              this.apply();
            }
            break;
          }
        }
      });
      this.themeObserver.observe(body, {
        attributes: true,
        attributeFilter: ["class", "className"],
      });
    }
    // 返回退订回调（workspace 的 layout-change / window-open 已由基类 registerEvent 管理）
    return () => {
      if (this.activeDocInterval !== null) {
        window.clearInterval(this.activeDocInterval);
        this.activeDocInterval = null;
      }
      if (this.themeObserver !== null) {
        this.themeObserver.disconnect();
        this.themeObserver = null;
      }
      this.stopAutoTimer();
    };
  }

  /** 背景是否真正启用：default 或图片未解析出真实图时为 false。由 apply() 自判。 */
  private shouldEnable(): boolean {
    const s = this.getSettings();
    if (s.backgroundType === "default") return false;
    if (s.backgroundType !== "image") return true; // solid 需要注入纯色 CSS
    return this.hasResolvedImage(s); // image 需至少解析出一张真实图片
  }

  // ---------------- 壁纸自动切换 / 命令支持 ----------------

  /** 当前生效套（按主窗口的设备与主题判断）。 */
  getActiveWallpaperKey(): WallpaperKey {
    const body = window.document?.body;
    const isMobile = !!body?.classList.contains("is-mobile");
    const isLight = !!body?.classList.contains("theme-light");
    if (isMobile) return isLight ? "mobileLight" : "mobileDark";
    return isLight ? "desktopLight" : "desktopDark";
  }

  /** 当前生效套是否有可用的图片池（getWallpaperImages 已在文件夹为空时返回空数组）。 */
  private hasPool(s: StyleTweakerSettings, key: WallpaperKey): boolean {
    return this.getWallpaperImages(s, key).length > 0;
  }

  /** 同步自动切换定时器：仅当前生效套、且其自动切换开启、文件夹已配置且有图时启动。
      手动模式（manual）不启动定时器，仅命令切换。 */
  private updateAutoTimer(s: StyleTweakerSettings): void {
    const key = this.getActiveWallpaperKey();
    this.stopAutoTimer();
    if (!this.enabled || s.backgroundType !== "image") return;
    if (!this.isAutoOn(s, key) || !this.hasPool(s, key)) return;
    const mode = this.getMode(s, key);
    this.autoTimer = window.setInterval(() => {
      // 顺序模式：到点索引 +1；随机模式：到点随机设索引
      this.advanceByTimer(s, key, mode);
    }, this.getInterval(s, key) * 1000);
    this.plugin.registerInterval(this.autoTimer);
  }

  /** 定时器到点切换：按模式推进索引并立即生效（避免与命令切换共用随机导致的重复随机问题）。 */
  private advanceByTimer(s: StyleTweakerSettings, key: WallpaperKey, mode: WallpaperMode): void {
    const images = this.getWallpaperImages(s, key);
    if (images.length === 0) return;
    if (mode === "random") {
      this.setIndex(s, key, Math.floor(Math.random() * images.length));
    } else {
      const idx = this.normalizeIndex(s, key, images.length) + 1;
      this.setIndex(s, key, idx % images.length);
    }
    void this.plugin.saveData(s);
    this.apply();
    this.notifyWallpaperChanged();
  }

  /**
   * 派发"壁纸索引已变更"事件，供设置面板刷新「背景图片」预览。
   * 命令/定时器修改索引后设置面板的 file 控件不会自动感知，需显式通知。
   */
  private notifyWallpaperChanged(): void {
    this.app.workspace.trigger("style-tweaker:wallpaper-changed");
  }

  private stopAutoTimer(): void {
    if (this.autoTimer !== null) {
      window.clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
  }

  /** 命令：切换当前生效套的壁纸为下一张（取模回绕），立即生效。 */
  nextWallpaper(): void {
    this.stepWallpaper(1);
  }

  /** 命令：切换当前生效套的壁纸为上一张（取模回绕），立即生效。 */
  prevWallpaper(): void {
    this.stepWallpaper(-1);
  }

  /** 命令：从当前生效套的壁纸文件夹中随机选一张，立即生效。 */
  randomWallpaper(): void {
    const s = this.getSettings();
    const key = this.getActiveWallpaperKey();
    const images = this.getWallpaperImages(s, key);
    if (images.length === 0) return;
    this.setIndex(s, key, Math.floor(Math.random() * images.length));
    void this.plugin.saveData(s);
    this.apply();
    this.notifyWallpaperChanged();
  }

  /** 命令：把当前生效套的索引向前/向后移动（manual/sequence 顺序 ±delta，random 随机跳）。 */
  private stepWallpaper(delta: number): void {
    const s = this.getSettings();
    const key = this.getActiveWallpaperKey();
    const images = this.getWallpaperImages(s, key);
    if (images.length === 0) return;
    const mode = this.getMode(s, key);
    if (mode === "random") {
      // 随机模式：命令同样随机跳一张
      this.setIndex(s, key, Math.floor(Math.random() * images.length));
    } else {
      const next = this.normalizeIndex(s, key, images.length) + delta;
      const idx = ((next % images.length) + images.length) % images.length;
      this.setIndex(s, key, idx);
    }
    // 持久化索引（续播），并重新应用背景
    void this.plugin.saveData(s);
    this.apply();
    this.notifyWallpaperChanged();
  }

  /** 命令：打开当前生效套的图片选择弹窗，选中后把 currentIndex 设为该图索引并立即生效。 */
  openWallpaperSearch(): void {
    const s = this.getSettings();
    const key = this.getActiveWallpaperKey();
    const folder = this.getFolder(s, key);
    const images = this.getWallpaperImages(s, key);
    const currentPath = images[this.normalizeIndex(s, key, images.length)]?.path ?? "";
    // 缩略图比例按「当前生效套所属设备」决定：mobile* 套用竖屏，desktop* 套用横屏
    const isMobileField = key.startsWith("mobile");
    const modal = new ImagePicker(
      this.app,
      (file) => isSelectableImage(file, folder),
      (path) => {
        if (!path) return;
        // 选中后：把当前索引设为该图在文件夹中的位置，三种模式均即时生效
        const idx = images.findIndex((f) => f.path === path);
        if (idx >= 0) this.setIndex(s, key, idx);
        void this.plugin.saveData(s);
        this.apply();
        this.notifyWallpaperChanged();
      },
      currentPath,
      isMobileField,
      folder,
    );
    modal.open();
  }

  apply(): void {
    // 只处理当前可达窗口。后台独立窗口（设置窗口、第三方插件自建窗口）的背景由
    // clearAll() 覆写版「保留」（见下方 clearAll），一旦注入便持续保持、无需在此重注入，
    // 从而避免每次 apply 全量遍历所有窗口造成的开销。
    this.clearAll();
    if (!this.enabled) return;
    // 先刷新门控类（clearAll 不移门控类），确保模式切换后门控类立即正确，再决定是否注入
    for (const doc of getAppDocuments(this.app)) {
      this.applyClassesToDoc(doc);
    }
    if (!this.shouldEnable()) return;
    const s = this.getSettings();

    // 纯色模式：只注入纯色 CSS，覆盖 .workspace 等容器
    if (s.backgroundType === "solid") {
      this.stopAutoTimer();
      for (const doc of getAppDocuments(this.app)) {
        this.applySolidToDocument(doc, s);
      }
      return;
    }

    // 图片模式与 none 共用注入链路（none 时图片为空、门控类不挂，壁纸/纯色均不生效）
    const image = s.backgroundType === "image" ? this.resolveBackgrounds(s) : null;
    const bg: ResolvedBackground = image ?? {
      desktopDark: "",
      desktopLight: "",
      mobileDark: "",
      mobileLight: "",
    };

    for (const doc of getAppDocuments(this.app)) {
      this.applyBackgroundToDocument(doc, bg, s);
    }

    // 自动切换定时器：仅图片模式、且当前生效套开启自动切换时启动
    if (s.backgroundType === "image") {
      this.updateAutoTimer(s);
    } else {
      this.stopAutoTimer();
    }
  }

  private applySolidToDocument(doc: Document, s: StyleTweakerSettings): void {
    if (!doc?.head) return;
    // 玻璃模糊仅图片模式有意义，纯色固定关闭（避免平面背景上无意义的 backdrop-filter）
    const tokens = buildTokensCss({
      imageUrl: "",
      opacity: 0,
      glassBlur: 0,
      solidDark: flavorToHex(s.solidDarkFlavor, true) ?? SOLID_DEFAULT_DARK,
      solidLight: flavorToHex(s.solidLightFlavor, false) ?? SOLID_DEFAULT_LIGHT,
    });
    // 纯色模式下注入所选 flavor 的完整界面配色，
    // 仅在该文档当前深浅色 + 纯色门控类下生效，图片/无背景模式不受影响。
    const isDark = doc.body?.classList.contains("theme-dark") ?? true;
    const flavor = isDark ? s.solidDarkFlavor : s.solidLightFlavor;
    const gating = `body.${isDark ? "theme-dark" : "theme-light"}.${SOLID_CLASS}`;
    const flavorCss = buildFlavorCss(flavor, gating);
    const css = [tokens, flavorCss].filter(Boolean).join("\n");
    let styleEl = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      const win = doc.defaultView;
      if (!win) return;
      styleEl = win.createEl("style");
      styleEl.id = STYLE_ID;
      doc.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
    this.touchedDocuments.add(doc);
    // 注入后补挂门控类，覆盖后打开的独立窗口（pop-out 等）不因缺门控类而失效
    this.applyClassesToDoc(doc);
  }

  /**
   * 对单个文档注入背景 CSS（图片/纯色 token + 壁纸层）并补挂门控类。
   * 与基类抽象 applyToDocument(doc) 区分：背景的逐文档应用由覆写 apply() 驱动，且需额外 bg/s 参数。
   */
  private applyBackgroundToDocument(
    doc: Document,
    bg: ResolvedBackground,
    s: StyleTweakerSettings,
  ): void {
    if (!doc?.head) return;
    // 按设备（is-mobile）取移动/桌面图，按主题（theme-light/dark）取浅/深色图
    const isMobile = doc.body.classList.contains("is-mobile");
    const isLight = doc.body.classList.contains("theme-light");
    const image = (
      isMobile
        ? isLight
          ? bg.mobileLight
          : bg.mobileDark
        : isLight
          ? bg.desktopLight
          : bg.desktopDark
    ).trim();

    // 按设备×主题取对应样式参数
    const opacityKey = isMobile
      ? isLight
        ? s.mobileBackgroundImageOpacityLight
        : s.mobileBackgroundImageOpacityDark
      : isLight
        ? s.desktopBackgroundImageOpacityLight
        : s.desktopBackgroundImageOpacityDark;
    const glassBlur = isMobile
      ? isLight
        ? s.mobileGlassBlurLight
        : s.mobileGlassBlurDark
      : isLight
        ? s.desktopGlassBlurLight
        : s.desktopGlassBlurDark;
    const opacity = Math.min(1, Math.max(0, opacityKey / 100));

    // 始终注入完整 CSS（token + 壁纸层）；图片为空时壁纸层回退 none、仅保留透明 UI，否则 UI 全黑
    const tokens = buildTokensCss({
      imageUrl: image,
      opacity,
      glassBlur,
      solidDark: flavorToHex(s.solidDarkFlavor, true) ?? SOLID_DEFAULT_DARK,
      solidLight: flavorToHex(s.solidLightFlavor, false) ?? SOLID_DEFAULT_LIGHT,
    });
    const css =
      tokens +
      "\n" +
      buildBackgroundLayerCss();

    let styleEl = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      const win = doc.defaultView;
      if (!win) return;
      styleEl = win.createEl("style");
      styleEl.id = STYLE_ID;
      doc.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
    this.touchedDocuments.add(doc);
    // 注入后补挂门控类，覆盖后打开的独立窗口（pop-out 等）不因缺门控类而失效
    this.applyClassesToDoc(doc);
  }

  private resolveBackgrounds(s: StyleTweakerSettings): ResolvedBackground {
    return {
      desktopDark: this.resolveWallpaper(s, "desktopDark"),
      desktopLight: this.resolveWallpaper(s, "desktopLight"),
      mobileDark: this.resolveWallpaper(s, "mobileDark"),
      mobileLight: this.resolveWallpaper(s, "mobileLight"),
    };
  }

  /**
   * 某套壁纸应显示的图片 url：三种模式统一按 currentIndex 定位。
   * random 模式不再在 apply() 时重新随机——索引只在定时器/命令切换时才改变，
   * 因此打开新标签页、切换窗口、深浅色/设备切换时图片保持稳定，不会闪烁换图。
   * 文件夹未配置时返回空串（不显示，等待用户配置）。
   */
  private resolveWallpaper(s: StyleTweakerSettings, key: WallpaperKey): string {
    const images = this.getWallpaperImages(s, key);
    if (images.length === 0) return "";
    const idx = this.normalizeIndex(s, key, images.length);
    return this.app.vault.getResourcePath(images[idx]);
  }

  /** 获取某套壁纸文件夹内的排序图片列表。
     文件夹为空（未配置）时返回空数组，不扫描整个仓库作为默认图池。 */
  private getWallpaperImages(
    s: StyleTweakerSettings,
    key: WallpaperKey,
  ): TFile[] {
    if (!this.getFolder(s, key).trim()) return [];
    return getSortedBackgroundImages(this.app, this.getFolder(s, key));
  }

  /** 归一化索引到 [0, length) 内（取模，避免越界）。 */
  private normalizeIndex(
    s: StyleTweakerSettings,
    key: WallpaperKey,
    length: number,
  ): number {
    if (length <= 0) return 0;
    const idx = this.getIndex(s, key) % length;
    return idx < 0 ? idx + length : idx;
  }

  /** 某套的壁纸文件夹。 */
  private getFolder(s: StyleTweakerSettings, key: WallpaperKey): string {
    switch (key) {
      case "desktopDark": return s.desktopWallpaperFolderDark;
      case "desktopLight": return s.desktopWallpaperFolderLight;
      case "mobileDark": return s.mobileWallpaperFolderDark;
      case "mobileLight": return s.mobileWallpaperFolderLight;
    }
  }

  /** 某套的壁纸模式。 */
  private getMode(s: StyleTweakerSettings, key: WallpaperKey): WallpaperMode {
    switch (key) {
      case "desktopDark": return s.desktopWallpaperModeDark;
      case "desktopLight": return s.desktopWallpaperModeLight;
      case "mobileDark": return s.mobileWallpaperModeDark;
      case "mobileLight": return s.mobileWallpaperModeLight;
    }
  }

  /** 某套是否为自动切换模式（random 或 sequence；manual 为仅命令切换，不启动定时器）。 */
  private isAutoOn(s: StyleTweakerSettings, key: WallpaperKey): boolean {
    return this.getMode(s, key) !== "manual";
  }

  /** 某套切换间隔（秒），限幅到 [30, 1800]。 */
  private getInterval(s: StyleTweakerSettings, key: WallpaperKey): number {
    const v = (() => {
      switch (key) {
        case "desktopDark": return s.desktopWallpaperIntervalDark;
        case "desktopLight": return s.desktopWallpaperIntervalLight;
        case "mobileDark": return s.mobileWallpaperIntervalDark;
        case "mobileLight": return s.mobileWallpaperIntervalLight;
      }
    })();
    if (!v || isNaN(v)) return 60;
    return Math.min(AUTO_MAX_INTERVAL, Math.max(AUTO_MIN_INTERVAL, v));
  }

  /** 某套当前播放索引。 */
  private getIndex(s: StyleTweakerSettings, key: WallpaperKey): number {
    switch (key) {
      case "desktopDark": return s.desktopWallpaperIndexDark;
      case "desktopLight": return s.desktopWallpaperIndexLight;
      case "mobileDark": return s.mobileWallpaperIndexDark;
      case "mobileLight": return s.mobileWallpaperIndexLight;
    }
  }

  /** 保存某套当前索引（持久化续播）。 */
  private setIndex(s: StyleTweakerSettings, key: WallpaperKey, idx: number): void {
    switch (key) {
      case "desktopDark": s.desktopWallpaperIndexDark = idx; break;
      case "desktopLight": s.desktopWallpaperIndexLight = idx; break;
      case "mobileDark": s.mobileWallpaperIndexDark = idx; break;
      case "mobileLight": s.mobileWallpaperIndexLight = idx; break;
    }
  }

  /** 挂载/卸载背景门控类（仅挂 body）。类是否生效完全由 enabled 与设置项决定，故注入 CSS 后调用即可补挂独立窗口。 */
  private applyClassesToDoc(doc: Document): void {
    const s = this.getSettings();
    // 激活状态：仅「已启用 且 实际提供背景」（none/无图时自动关，避免误挂）
    const active = this.enabled && this.shouldEnable();
    // 图片类：激活 且 图片模式 且 解析出真实图（严格解析，防空图误触发图片专属样式）
    const imageOn =
      active && s.backgroundType === "image" && this.hasResolvedImage(s);
    // 纯色类：激活 且 纯色模式
    const solidOn = active && s.backgroundType === "solid";
    if (!doc?.body) return;
    // 门控类统一只挂到 body（不再挂 html/documentElement），保持 html 标签干净。
    // IMAGE_CLASS 与 SOLID_CLASS 互斥（backgroundType 三选一），且各自隐含"背景已激活"，
    // 无需额外的 ACTIVE_CLASS。
    doc.body.classList.toggle(IMAGE_CLASS, imageOn);
    doc.body.classList.toggle(SOLID_CLASS, solidOn);
  }

  /** 任一套已配置壁纸文件夹且有图，即视为能提供真实背景（三种模式统一依赖文件夹图片）。 */
  private hasResolvedImage(s: StyleTweakerSettings): boolean {
    const keys: WallpaperKey[] = ["desktopDark", "desktopLight", "mobileDark", "mobileLight"];
    return keys.some((k) => this.hasPool(s, k));
  }

  /** 基类抽象方法：背景逐文档应用走覆写 apply() 的 applyBackgroundToDocument，此处空实现满足抽象约束。 */
  protected applyToDocument(_doc: Document): void {}

  /** 基类抽象方法：清理单个文档（移除 <style> + 摘背景门控类）。 */
  protected clearDocument(doc: Document): void {
    this.removeStyle(doc, STYLE_ID);
    doc.body?.classList.remove(IMAGE_CLASS, SOLID_CLASS);
  }

  /**
   * 覆写 clearAll()：只清理「当前可达窗口」与「已失效（关闭）窗口」，
   * **保留活跃的后台独立窗口背景**。
   *
   * 背景：独立窗口分两类——
   *   - pop-out 的 md 标签页：由 workspace.iterateAllLeaves() 稳定枚举，清后 apply() 可立即重注入。
   *   - 设置窗口 / 第三方插件自建窗口：**不在** leaves 枚举内，只能靠 app.windows（内部 API）
   *     枚举，而实测该枚举**不稳定**——后台窗口会间歇性从枚举中消失（窗口仍存活、仍在后台）。
   *     若在 clearAll() 里对这类窗口 clearDocument，其 <style> 被移除后无法被 apply() 重注入，
   *     背景将永久丢失（实测：改用基类 clearAll 后设置/第三方窗口背景丢失，pop-out md 正常）。
   * 因此这里不清活跃后台窗口——它们一旦被注入便持续保持（由 activeDocument 变化 / 窗口
   * 重新成为前台时重注入更新）。同时清理 touchedDocuments 中已失效窗口，避免累积。
   */
  clearAll(): void {
    // 1) 清理当前可达窗口（处理模式切换的旧样式）
    for (const doc of getAppDocuments(this.app)) {
      if (!doc?.documentElement && !doc?.getElementById) continue;
      this.clearDocument(doc);
    }
    // 2) 清理 touchedDocuments 中已关闭/失效的窗口引用（保留活跃后台窗口背景）
    for (const doc of this.touchedDocuments) {
      if (doc && !doc.head) {
        this.touchedDocuments.delete(doc);
      }
    }
  }
}
