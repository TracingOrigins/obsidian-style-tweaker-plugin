import { App, Platform, Plugin, getIcon, getLanguage } from "obsidian";

import {
  NewTabSettingsView,
  StyleTweakerSettings,
  resolveNewTabSettingsView,
} from "../../types/settings";
import { getAppDocuments } from "../../utils/documents";
import { resolveAccentValue } from "../../utils/color-palette";
import { getSortedBackgroundImages } from "../../utils/background-images";
import type { StyleService } from "../../types/service";
import { ParticleEngine, type AmbientMotion } from "./particle-engine";

// 注入到空标签页视图内容中的根容器类名
const ROOT_CLASS = "style-tweaker-new-tab";
const ROOT_CONTAINER_CLASS = "style-tweaker-new-tab-wordmark-container";
const LOGO_CLASS = "style-tweaker-new-tab-logo";
const TITLE_CLASS = "style-tweaker-new-tab-title";

// 新版 Obsidian 徽标
const DEFAULT_LOGO_SVG = `<svg fill="none" height="100%" width="100%" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><radialGradient id="logo-bottom-left" cx="0" cy="0" gradientTransform="matrix(-59 -225 150 -39 161.4 470)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-opacity=".1"/></radialGradient><radialGradient id="logo-top-right" cx="0" cy="0" gradientTransform="matrix(50 -379 280 37 360 374.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></radialGradient><radialGradient id="logo-top-left" cx="0" cy="0" gradientTransform="matrix(69 -319 218 47 175.4 307)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity=".4"/></radialGradient><radialGradient id="logo-bottom-right" cx="0" cy="0" gradientTransform="matrix(-96 -163 187 -111 335.3 512.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-opacity=".3"/></radialGradient><radialGradient id="logo-top-edge" cx="0" cy="0" gradientTransform="matrix(-36 166 -112 -24 310 128.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></radialGradient><radialGradient id="logo-left-edge" cx="0" cy="0" gradientTransform="matrix(88 89 -190 187 111 220.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity=".4"/></radialGradient><radialGradient id="logo-bottom-edge" cx="0" cy="0" gradientTransform="matrix(9 130 -276 20 215 284)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></radialGradient><radialGradient id="logo-middle-edge" cx="0" cy="0" gradientTransform="matrix(-198 -104 327 -623 400 399.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".5" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></radialGradient><clipPath id="clip"><path d="M.2.2h512v512H.2z"/></clipPath><g clip-path="url(#clip)"><path d="M382.3 475.6c-3.1 23.4-26 41.6-48.7 35.3-32.4-8.9-69.9-22.8-103.6-25.4l-51.7-4a34 34 0 0 1-22-10.2l-89-91.7a34 34 0 0 1-6.7-37.7s55-121 57.1-127.3c2-6.3 9.6-61.2 14-90.6 1.2-7.9 5-15 11-20.3L248 8.9a34.1 34.1 0 0 1 49.6 4.3L386 125.6a37 37 0 0 1 7.6 22.4c0 21.3 1.8 65 13.6 93.2 11.5 27.3 32.5 57 43.5 71.5a17.3 17.3 0 0 1 1.3 19.2 1494 1494 0 0 1-44.8 70.6c-15 22.3-21.9 49.9-25 73.1z" fill="#6c31e3"/><path d="M165.9 478.3c41.4-84 40.2-144.2 22.6-187-16.2-39.6-46.3-64.5-70-80-.6 2.3-1.3 4.4-2.2 6.5L60.6 342a34 34 0 0 0 6.6 37.7l89.1 91.7a34 34 0 0 0 9.6 7z" fill="url(#logo-bottom-left)"/><path d="M278.4 307.8c11.2 1.2 22.2 3.6 32.8 7.6 34 12.7 65 41.2 90.5 96.3 1.8-3.1 3.6-6.2 5.6-9.2a1536 1536 0 0 0 44.8-70.6 17 17 0 0 0-1.3-19.2c-11-14.6-32-44.2-43.5-71.5-11.8-28.2-13.5-72-13.6-93.2 0-8.1-2.6-16-7.6-22.4L297.6 13.2a34 34 0 0 0-1.5-1.7 96 96 0 0 1 2 54 198.3 198.3 0 0 1-17.6 41.3l-7.2 14.2a171 171 0 0 0-19.4 71c-1.2 29.4 4.8 66.4 24.5 115.8z" fill="url(#logo-top-right)"/><path d="M278.4 307.8c-19.7-49.4-25.8-86.4-24.5-115.9a171 171 0 0 1 19.4-71c2.3-4.8 4.8-9.5 7.2-14.1 7.1-13.9 14-27 17.6-41.4a96 96 0 0 0-2-54A34.1 34.1 0 0 0 248 9l-105.4 94.8a34.1 34.1 0 0 0-10.9 20.3l-12.8 85-.5 2.3c23.8 15.5 54 40.4 70.1 80a147 147 0 0 1 7.8 24.8c28-6.8 55.7-11 82.1-8.3z" fill="url(#logo-top-left)"/><path d="M333.6 511c22.7 6.2 45.6-12 48.7-35.4a187 187 0 0 1 19.4-63.9c-25.6-55-56.5-83.6-90.4-96.3-36-13.4-75.2-9-115 .7 8.9 40.4 3.6 93.3-30.4 162.2 4 1.8 8.1 3 12.5 3.3 0 0 24.4 2 53.6 4.1 29 2 72.4 17.1 101.6 25.2z" fill="url(#logo-bottom-right)"/><g clip-rule="evenodd" fill-rule="evenodd"><path d="M254.1 190c-1.3 29.2 2.4 62.8 22.1 112.1l-6.2-.5c-17.7-51.5-21.5-78-20.2-107.6a174.7 174.7 0 0 1 20.4-72c2.4-4.9 8-14.1 10.5-18.8 7.1-13.7 11.9-21 16-33.6 5.7-17.5 4.5-25.9 3.8-34.1 4.6 29.9-12.7 56-25.7 82.4a177.1 177.1 0 0 0-20.7 72z" fill="url(#logo-top-edge)"/><path d="M194.3 293.4c2.4 5.4 4.6 9.8 6 16.5L195 311c-2.1-7.8-3.8-13.4-6.8-20-17.8-42-46.3-63.6-69.7-79.5 28.2 15.2 57.2 39 75.7 81.9z" fill="url(#logo-left-edge)"/><path d="M200.6 315.1c9.8 46-1.2 104.2-33.6 160.9 27.1-56.2 40.2-110.1 29.3-160z" fill="url(#logo-bottom-edge)"/><path d="M312.5 311c53.1 19.9 73.6 63.6 88.9 100-19-38.1-45.2-80.3-90.8-96-34.8-11.8-64.1-10.4-114.3 1l-1.1-5c53.2-12.1 81-13.5 117.3 0z" fill="url(#logo-middle-edge)"/></g></g></svg>`;

/** 标题字体 key → CSS font-family 变量（Obsidian 界面字体变量为 --font-interface） */
const FONT_VAR: Record<string, string> = {
  interface: "var(--font-interface, var(--font-interface-theme, sans-serif))",
  text: "var(--font-text, var(--font-text-theme))",
  monospace: "var(--font-monospace, var(--font-monospace-theme))",
};

/** 粒子律动：设置 key → 引擎 ambient motion */
const MOTION_MAP: Record<string, AmbientMotion> = {
  none: "none",
  float: "float",
  undulate: "undulate",
  wave: "wave",
  ripple: "ripple",
  heartbeat: "pulse",
  breathe: "breathe",
};

interface NewTabInstance {
  container: HTMLElement;
  viewContent: HTMLElement;
  wrap: HTMLElement;
  logoHolder: HTMLElement;
  titleH1: HTMLElement;
  engine: ParticleEngine | null;
  domSignature: string;
  /** 粒子几何参数签名（canvasScale/radius/spacing/motion/扰动 等，需重建 canvas）。 */
  particleGeoSignature: string;
  /** 粒子颜色参数签名（customColor/logoColor/titleColor，仅需无缝重采样）。 */
  particleColorSignature: string;
  /** 该实例的 SVG id 前缀，避免多个标签页的徽标 SVG 渐变 id 冲突导致颜色错误。 */
  svgUid: string;
}

/**
 * 新标签页服务：在 Obsidian 空标签页（未打开文件的 view）中注入徽标 + 标题 + 粒子特效。
 *
 * 采用"就地更新"策略：设置变化时仅更新徽标/标题的 DOM 内容与粒子引擎，
 * 不销毁重建容器，避免"消失一下、再显示一下"的闪烁。
 */
export class NewTabService implements StyleService {
  private readonly plugin: Plugin;
  private readonly app: App;
  private readonly getSettings: () => StyleTweakerSettings;
  private enabled = false;
  private instances = new Map<HTMLElement, NewTabInstance>();
  private listenersRegistered = false;
  /** 为每个实例的徽标 SVG 分配唯一的 id 前缀，避免多标签页 id 冲突。 */
  private svgUidCounter = 0;
  /** 上次检测到的主题强调色（--color-accent），用于去重，避免 css-change 与 MutationObserver 重复重建。 */
  private lastThemeAccent = "";
  private accentObserver: MutationObserver | null = null;

  constructor(plugin: Plugin, getSettings: () => StyleTweakerSettings) {
    this.plugin = plugin;
    this.app = plugin.app;
    this.getSettings = getSettings;
  }

  /** 新标签页视图：按当前平台把 desktop/mobile 键投影成简写字段（newTabXxx）。 */
  private view(): NewTabSettingsView {
    return resolveNewTabSettingsView(this.getSettings(), Platform.isMobile);
  }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    if (!this.listenersRegistered) {
      this.listenersRegistered = true;
      const { workspace } = this.app;
      workspace?.onLayoutReady(() => {
        this.apply();
        this.setupThemeAccentObserver();
      });
      if (workspace) {
        this.plugin.registerEvent(
          workspace.on("layout-change", () => this.apply()),
        );
        this.plugin.registerEvent(
          workspace.on("window-open", () => this.apply()),
        );
        this.plugin.registerEvent(
          workspace.on("active-leaf-change", () => this.apply()),
        );
        // 窗口尺寸变化（拖动边缘/最大化/还原）：wordmark 容器为 width:100%，尺寸变化会触发
        // 引擎 ResizeObserver → 重采样或保护性 destroy。监听 resize 以便在引擎被自毁后
        // 及时 apply() 重建粒子（updateInstance 以 isDestroyed() 识别已失效引擎）。
        this.plugin.registerEvent(
          workspace.on("resize", () => this.apply()),
        );
        // 主题 CSS 重载（含 style-tweaker 自身主题色覆盖、主题切换）：刷新颜色 + 重建粒子。
        this.plugin.registerEvent(
          workspace.on("css-change", () => this.handleThemeChange()),
        );
      }
    }
    this.apply();
  }

  disable(): void {
    this.enabled = false;
    this.clearAll();
    this.accentObserver?.disconnect();
    this.accentObserver = null;
    this.lastThemeAccent = "";
  }

  apply(): void {
    if (!this.enabled) return;
    const s = this.view();
    const targets = this.findEmptyViewContents();

    // 1) 清理已不是空标签页的实例
    for (const [viewContent, instance] of this.instances) {
      if (!targets.has(viewContent)) {
        this.destroyInstance(instance);
        this.instances.delete(viewContent);
      }
    }

    // 2) 对每个空标签页确保渲染；总开关关闭时销毁
    for (const viewContent of targets) {
      if (!s.newTabEnabled) {
        const existing = this.instances.get(viewContent);
        if (existing) {
          this.destroyInstance(existing);
          this.instances.delete(viewContent);
        }
        continue;
      }
      const existing = this.instances.get(viewContent);
      if (existing) {
        this.updateInstance(existing, s);
      } else {
        this.createInstance(viewContent, s);
      }
    }
  }

  /**
   * 主题色（外观-主题色 / Obsidian 自带强调色）变化的就地刷新。
   *
   * 背景：徽标/标题/粒子在“未自定义颜色=默认”时都要跟随 Obsidian 主题强调色
   * （--color-accent）。DOM 徽标/标题用 var(--color-accent) 会自动随 CSS 变量重算；
   * 粒子引擎在创建时把强调色 resolve 成具体 hex 快照、并采样当时的 DOM 像素色，
   * 主题一变即成旧色，需让其重新取色。
   *
   * 说明：
   *   - 用 lastThemeAccent 去重，避免 css-change 与 MutationObserver 双触发。
   *   - 不依赖 domSignature/particleSignature 短路（主题色变化时设置字段未变），必须无条件刷新。
   *   - 徽标/标题若“未自定义颜色=默认”用 var(--color-accent)，DOM 颜色会自动随主题更新，
   *     粒子只需对当前 DOM 无缝重采样（engine.refresh，保留画布）即可跟随新主题色，不重建、不闪烁。
   */
  private handleThemeChange(): void {
    if (!this.enabled) return;
    const accent = this.readCurrentAccent();
    if (accent === this.lastThemeAccent) return; // 强调色未变，跳过（去重）
    this.lastThemeAccent = accent;

    const s = this.view();
    for (const instance of this.instances.values()) {
      // 徽标/标题/布局的 DOM 颜色（含 var(--color-accent)）随主题重设，保证即时生效
      this.applyLogo(instance, s);
      this.applyTitle(instance, s);
      this.applyLayout(instance, s);
      // 粒子对当前 DOM 无缝重采样，跟随新的主题色（保留画布、不闪烁）
      this.refreshOrCreateEngine(instance, s);
    }
  }

  /** 读取当前生效的主题强调色（主窗口 body 的 --color-accent），用于去重。 */
  private readCurrentAccent(): string {
    // 优先取主工作区所在文档；不可用时回退主窗口文档。
    // 用 window.document 而非 globalThis.document：主题强调色本就定义在主窗口 body 上。
    const doc = this.app.workspace?.containerEl?.ownerDocument ?? window.document;
    if (!doc?.body) return "";
    return (doc.defaultView?.getComputedStyle(doc.body).getPropertyValue("--color-accent") ?? "").trim();
  }

  /**
   * 用 MutationObserver 监听 Obsidian 自带强调色（外观-强调色设置）的变化。
   * Obsidian 在该设置变更时不会触发 workspace "css-change"，只会改 CSS 变量，
   * 故需观察 body 上内联 CSS 变量的改动；一旦 accent 变化即触发就地刷新。
   */
  private setupThemeAccentObserver(): void {
    const doc = this.app.workspace?.containerEl?.ownerDocument;
    if (!doc?.body) return;
    const observer = new MutationObserver(() => this.handleThemeChange());
    // Obsidian 强调色 CSS 变量可能写在 :root(html) 或 body 的内联 style 上，两者都观察；
    // handleThemeChange 以读取到的 --color-accent 值去重，因此无关节点的 style 抖动不会误触发重建。
    for (const node of [doc.documentElement, doc.body]) {
      observer.observe(node, { attributes: true, attributeFilter: ["style"] });
    }
    this.accentObserver = observer;
  }

  private findEmptyViewContents(): Set<HTMLElement> {
    const targets = new Set<HTMLElement>();
    for (const doc of getAppDocuments(this.app)) {
      const contents = Array.from(
        doc.querySelectorAll<HTMLElement>(".workspace-leaf .view-content"),
      );
      for (const vc of contents) {
        // 空标签页判定：排除我们已注入的根容器后，剩余内容为空或仅含 empty-state。
        // 不排除已注入的——否则 apply() 找不到已注入实例，设置变更后无法就地更新。
        const ownChildCount = Array.from(vc.children).filter(
          (el) => !el.classList.contains(ROOT_CLASS),
        ).length;
        const hasRealContent = ownChildCount > 0 &&
          !(ownChildCount === 1 && vc.querySelector(".empty-state"));
        if (!hasRealContent) {
          targets.add(vc);
        }
      }
    }
    return targets;
  }

  private computeDomSignature(s: NewTabSettingsView): string {
    return [
      s.newTabLogoType,
      s.newTabLogoBuiltin,
      s.newTabLogoBuiltinCustomColor,
      s.newTabLogoBuiltinColor,
      s.newTabLogoSvg,
      s.newTabLogoImageFolder,
      s.newTabLogoImageIndex,
      s.newTabLogoScale,
      s.newTabLogoPosition,
      s.newTabLogoMargin,
      s.newTabTitleType,
      s.newTabTitleText,
      s.newTabTitleFont,
      s.newTabTitleFontSize,
      s.newTabTitleCustomColor,
      s.newTabTitleColor,
    ].join("|");
  }

  /** 粒子几何参数签名：这些字段改变需重建 canvas（dotSize/spacing/zoom 等为引擎构造只读）。 */
  private computeParticleGeoSignature(s: NewTabSettingsView): string {
    return [
      s.newTabParticleEnabled,
      s.newTabParticleCanvasScale,
      s.newTabParticleRadius,
      s.newTabParticleSpacing,
      s.newTabParticleMotion,
      s.newTabParticleDisturbRadius,
      s.newTabParticleDisturbStrength,
    ].join("|");
  }

  /** 粒子颜色签名：这些字段改变只需引擎无缝重采样，无需重建 canvas。 */
  private computeParticleColorSignature(s: NewTabSettingsView): string {
    return [
      s.newTabParticleCustomColor,
      s.newTabParticleLogoColor,
      s.newTabParticleTitleColor,
    ].join("|");
  }

  private createInstance(viewContent: HTMLElement, s: NewTabSettingsView): void {
    if (!s.newTabEnabled) return;
    const root = createDiv(ROOT_CLASS);
    root.setAttribute("data-style-tweaker-new-tab", "true");
    // 插入到 .empty-state 之前，让徽标+标题显示在操作列表上方
    const emptyState = viewContent.querySelector(".empty-state");
    if (emptyState) {
      viewContent.insertBefore(root, emptyState);
    } else {
      viewContent.appendChild(root);
    }
    // 标记 view-content，使其变为 flex column 布局，用 gap 分隔徽标/标题与 empty-state
    viewContent.addClass("style-tweaker-new-tab-view-content");

    const wrap = root.createDiv({ cls: ROOT_CONTAINER_CLASS });
    const logoHolder = wrap.createDiv({ cls: LOGO_CLASS });
    const title = wrap.createDiv({ cls: TITLE_CLASS });
    const titleH1 = title.createEl("h1");

    const instance: NewTabInstance = {
      container: root,
      viewContent,
      wrap,
      logoHolder,
      titleH1,
      engine: null,
      domSignature: "",
      particleGeoSignature: "",
      particleColorSignature: "",
      svgUid: `new-tab-logo-${++this.svgUidCounter}`,
    };

    this.applyLogo(instance, s);
    this.applyTitle(instance, s);
    this.applyLayout(instance, s);
    instance.domSignature = this.computeDomSignature(s);
    instance.particleGeoSignature = this.computeParticleGeoSignature(s);
    instance.particleColorSignature = this.computeParticleColorSignature(s);
    instance.engine = this.createEngine(instance, s);

    this.instances.set(viewContent, instance);
  }

  /** 就地更新实例（不销毁重建容器）：徽标/标题变化更新 DOM，粒子按需无缝重采样或重建引擎。 */
  private updateInstance(instance: NewTabInstance, s: NewTabSettingsView): void {
    const domSig = this.computeDomSignature(s);
    const geoSig = this.computeParticleGeoSignature(s);
    const colorSig = this.computeParticleColorSignature(s);
    const domChanged = domSig !== instance.domSignature;
    const geoChanged = geoSig !== instance.particleGeoSignature;
    const colorChanged = colorSig !== instance.particleColorSignature;
    // 引擎意外被销毁（如频繁调整窗口宽度触发内部保护）时，即使签名未变也需重建，
    // 否则粒子会一直缺失、只显示无粒子的徽标与标题。
    // 注意：createEngine 内 build() 失败/引擎 resize 保护都会调用 destroy() 自毁，
    // 但 instance.engine 引用仍指向已销毁对象（非 null），故须用 isDestroyed() 识别。
    const engineMissing =
      s.newTabParticleEnabled &&
      (!instance.engine || instance.engine.isDestroyed());
    if (!domChanged && !geoChanged && !colorChanged && !engineMissing) return;

    if (domChanged) {
      this.applyLogo(instance, s);
      this.applyTitle(instance, s);
      this.applyLayout(instance, s);
      instance.domSignature = domSig;
    }

    // 几何参数变化（需重建 canvas）或引擎缺失：销毁重建，避免旧 canvas 与新几何不符。
    const needEngineRebuild = geoChanged || engineMissing;
    if (needEngineRebuild) {
      if (instance.engine) {
        instance.engine.destroy();
        instance.engine = null;
      }
      instance.engine = this.createEngine(instance, s);
      instance.particleGeoSignature = geoSig;
      instance.particleColorSignature = this.computeParticleColorSignature(s);
      return;
    }

    // DOM 内容（采样源）变化或粒子颜色变化：引擎保留画布无缝重采样，避免闪烁。
    if (domChanged || colorChanged) {
      instance.particleColorSignature = colorSig;
      if (s.newTabParticleEnabled) {
        if (instance.engine) {
          instance.engine.refresh(this.computeParticleMono(instance, s));
        } else {
          instance.engine = this.createEngine(instance, s);
        }
      }
    }
  }

  /**
   * 引擎刷新辅助：若引擎已激活则对当前 DOM 无缝重采样（refresh，保留画布不闪烁），
   * 否则（禁用/缺失）新建或移除。用于主题色变化等不经过 updateInstance 的场景。
   */
  private refreshOrCreateEngine(instance: NewTabInstance, s: NewTabSettingsView): void {
    if (!s.newTabParticleEnabled) {
      if (instance.engine) {
        instance.engine.destroy();
        instance.engine = null;
      }
      return;
    }
    // 引擎若已自毁（build 失败 / resize 保护），引用仍在但已失效，需重建
    if (instance.engine && !instance.engine.isDestroyed()) {
      instance.engine.refresh(this.computeParticleMono(instance, s));
    } else {
      if (instance.engine) {
        instance.engine.destroy();
        instance.engine = null;
      }
      instance.engine = this.createEngine(instance, s);
    }
  }

  private createEngine(instance: NewTabInstance, s: NewTabSettingsView): ParticleEngine | null {
    if (!s.newTabParticleEnabled) return null;
    // 主题强调色（跟随外观-主题色设置）：作为粒子颜色未指定时的回退基准。
    // 引擎 mono 色需要具体 hex，故此处读取当前 CSS 变量的实际色值。
    const themeAccent = this.resolveThemeAccent(instance.wrap);
    const mono = this.computeParticleMono(instance, s);
    // 引擎以 wordmark 容器（徽标+标题区域）为定位与鼠标坐标基准：
    // 若用整宽的 root（left:0;right:0），鼠标坐标换算会基于视图左边界，
    // 与粒子画布的实际绘制区域（徽标+标题中心）不一致，导致扰动位置向右偏移。
    const engine = new ParticleEngine(instance.wrap, {
      monochrome: false,
      color: themeAccent,
      // 关闭自定义颜色：徽标、标题粒子均用各自源像素色（即徽标/标题 DOM 的实际显示颜色），
      // 保证粒子主体与边缘同色、且与 DOM 一致，不会出现部分粒子被强制覆盖成主题色。
      // 开启自定义颜色后才用指定的粒子颜色（由 computeParticleMono 给出）。
      logoColor: mono.logoColor,
      titleColor: mono.titleColor,
      zoom: s.newTabParticleCanvasScale,
      spacing: s.newTabParticleSpacing,
      dotSize: s.newTabParticleRadius,
      repulsionRadius: s.newTabParticleDisturbRadius,
      repulsionStrength: s.newTabParticleDisturbStrength,
      ambientMotion: MOTION_MAP[s.newTabParticleMotion] ?? "none",
      // 鼠标监听范围扩大到整个空标签页视图，使徽标/标题（即使超出 wordmark 容器）
      // 及其粒子画布区域都能触发扰动；坐标仍基于 wordmark 容器换算。
      interactionContainer: instance.viewContent,
    });
    void engine.build().then((ok) => {
      if (!ok) engine.destroy();
    });
    return engine;
  }

  /** 计算徽标/标题粒子的 mono 色：自定义粒子颜色开启时用所选色，否则 undefined（用源像素色）。 */
  private computeParticleMono(
    instance: NewTabInstance,
    s: NewTabSettingsView,
  ): { logoColor?: string; titleColor?: string } {
    if (!s.newTabParticleCustomColor) return {};
    const themeAccent = this.resolveThemeAccent(instance.wrap);
    return {
      logoColor: resolveAccentValue(s.newTabParticleLogoColor, themeAccent),
      titleColor: resolveAccentValue(s.newTabParticleTitleColor, themeAccent),
    };
  }

  /** 读取主题强调色（--color-accent）的实际 hex，跟随外观-主题色设置。 */
  private resolveThemeAccent(container: HTMLElement): string {
    try {
      const doc = container.ownerDocument;
      const styles = getComputedStyle(doc.body);
      // 依次尝试常用强调色变量。标题/徽标 DOM 默认色使用 --color-accent（applyTitle 应用它），
      // 因此粒子默认色也优先读取 --color-accent，保证粒子与 DOM 显示一致、边缘与主体同色。
      // theme-color-service 会把外观-主题色覆盖到这些变量。
      for (const variable of [
        "--color-accent",
        "--interactive-accent",
        "--text-accent",
      ]) {
        const value = styles.getPropertyValue(variable).trim();
        if (value) {
          const hex = this.toHex(value);
          if (hex) return hex;
        }
      }
    } catch {
      // ignore
    }
    return "#6C31E3";
  }

  private colorParseCanvas: HTMLCanvasElement | null = null;
  private colorParseCtx: CanvasRenderingContext2D | null = null;

  /**
   * 把任意合法 CSS 颜色（hex / rgb / color-mix / var() 计算值等）规整为 hex。
   * 通过 canvas 实际绘制并采样像素来解析，浏览器会把任意受支持的 CSS 颜色
   * 真正渲染成 RGBA，避免因 color-mix 等复杂格式无法被字符串匹配而回退错误默认值。
   */
  private toHex(color: string): string | null {
    const c = color.trim();
    if (!c) return null;
    try {
      if (!this.colorParseCanvas) {
        const canvas = createEl("canvas");
        canvas.width = 1;
        canvas.height = 1;
        this.colorParseCanvas = canvas;
        this.colorParseCtx = canvas.getContext("2d", { willReadFrequently: true });
      }
      const ctx = this.colorParseCtx;
      if (!ctx) return null;
      ctx.clearRect(0, 0, 1, 1);
      // 先填一个已知不透明色，若 fillStyle 无效会保留该值
      ctx.fillStyle = "#ffffff";
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      // 透明（无效值或解析失败）时返回 null；纯白说明 fillStyle 未生效也视为无效
      if (data[3] === 0) return null;
      if (data[0] === 255 && data[1] === 255 && data[2] === 255 && c.trim().toLowerCase() !== "#ffffff") {
        return null;
      }
      const channel = (v: number) =>
        Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
      return `#${channel(data[0])}${channel(data[1])}${channel(data[2])}`;
    } catch {
      return null;
    }
  }

  private applyLayout(instance: NewTabInstance, s: NewTabSettingsView): void {
    if (s.newTabLogoPosition === "top" || s.newTabLogoPosition === "bottom") {
      instance.wrap.addClass("logo-col");
    } else {
      instance.wrap.removeClass("logo-col");
    }
    if (s.newTabLogoPosition === "right" || s.newTabLogoPosition === "bottom") {
      instance.wrap.addClass("logo-after");
    } else {
      instance.wrap.removeClass("logo-after");
    }
  }

  private applyLogo(instance: NewTabInstance, s: NewTabSettingsView): void {
    const { logoHolder } = instance;
    logoHolder.empty();
    logoHolder.style.margin = `${s.newTabLogoMargin}px`;
    const size = `calc(${s.newTabTitleFontSize}px * ${s.newTabLogoScale})`;
    // 来源：无 → 隐藏、不占位（用 CSS 类切换，避免直接改 inline style）
    if (s.newTabLogoType === "none") {
      logoHolder.addClass("is-hidden");
      return;
    }
    logoHolder.removeClass("is-hidden");
    // 来源：默认 → Obsidian 默认徽标
    if (s.newTabLogoType === "default") {
      const holder = logoHolder.createDiv();
      const svg = this.parseSvg(
        this.uniqueifySvg(DEFAULT_LOGO_SVG, instance.svgUid),
      );
      if (svg) {
        svg.style.width = size;
        svg.style.height = size;
        holder.appendChild(svg);
      }
      return;
    }
    // 来源：内置 lucide 图标 → 按名称用 getIcon 生成 SVG（图标名空则回退 feather）
    if (s.newTabLogoType === "icon") {
      const holder = logoHolder.createDiv();
      holder.style.width = size;
      holder.style.height = size;
      const icon = getIcon(s.newTabLogoBuiltin.trim() || "feather");
      if (icon) {
        const svg = icon.cloneNode(true) as SVGElement;
        // 撑满 holder 尺寸：CSS 类控制 100% 尺寸，避免直接写 inline style
        svg.addClass("style-tweaker-logo-fill-svg");
        svg.setAttribute("width", size);
        svg.setAttribute("height", size);
        // 开启自定义内置图标颜色时应用颜色；默认（未开启）跟随默认继承色。
        // lucide 图标描边使用 currentColor，设置 color 即可上色。
        if (s.newTabLogoBuiltinCustomColor) {
          const color = resolveAccentValue(s.newTabLogoBuiltinColor, "var(--color-accent)");
          svg.style.color = color;
        }
        holder.appendChild(svg);
      }
      return;
    }
    // 来源：自定义 SVG → 内容为空时保留位置（空白占位），不回落默认徽标
    if (s.newTabLogoType === "code") {
      if (s.newTabLogoSvg.trim()) {
        const holder = logoHolder.createDiv();
        holder.style.width = size;
        holder.style.height = size;
        // 解析用户自定义 SVG 代码（DOMParser 以 SVG 文档解析，避免 innerHTML 注入），
        // 并唯一化内部 id（避免多标签页渐变引用冲突），让 SVG 按设定大小显示。
        const svg = this.parseSvg(
          this.uniqueifySvg(s.newTabLogoSvg.trim(), instance.svgUid),
        );
        if (svg) {
          svg.addClass("style-tweaker-logo-fill-svg");
          svg.setAttribute("width", size);
          svg.setAttribute("height", size);
          holder.appendChild(svg);
        }
      }
      return;
    }
    // 来源：本地图片 → 按「文件夹 + 索引」从图池解析实际图片路径。
    // 未配置文件夹、未选择图片（索引为 -1）或索引越界时保留位置（空白占位），不回落默认徽标。
    if (s.newTabLogoType === "image") {
      const folder = s.newTabLogoImageFolder.trim();
      if (folder && s.newTabLogoImageIndex >= 0) {
        const images = getSortedBackgroundImages(this.app, folder);
        if (images.length > 0) {
          const idx = ((s.newTabLogoImageIndex % images.length) + images.length) % images.length;
          const path = images[idx].path;
          const img = logoHolder.createEl("img");
          img.src = this.app.vault.adapter.getResourcePath(path);
          img.style.maxWidth = size;
          img.style.maxHeight = size;
        }
      }
      return;
    }
  }

  /**
   * 给 SVG 的所有 id 及其 url(#...) 引用加上唯一前缀，避免多个标签页的徽标 SVG
   * 因共享相同 id 导致渐变等引用跨实例解析错误、颜色显示异常。
   */
  private uniqueifySvg(svg: string, uid: string): string {
    const ids = new Set<string>();
    const idRe = /\bid="([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = idRe.exec(svg))) ids.add(m[1]);
    let out = svg;
    for (const id of ids) {
      const newId = `${uid}-${id}`;
      out = out.split(`id="${id}"`).join(`id="${newId}"`);
      out = out.split(`url(#${id})`).join(`url(#${newId})`);
    }
    return out;
  }

  /**
   * 把 SVG 字符串解析为 SVG 元素（用 DOMParser 按 image/svg+xml 文档解析，
   * 避免通过 innerHTML 直接注入 HTML，规避安全 lint 告警）。
   * 解析失败或非 SVG 时返回 null。
   */
  private parseSvg(svgStr: string): SVGElement | null {
    try {
      // 先按严格 SVG XML 解析
      const svgDoc = new DOMParser().parseFromString(svgStr, "image/svg+xml");
      let svg = svgDoc.querySelector("svg");
      // 严格 XML 可能因 HTML 实体/容错语法解析失败，改用宽松的 HTML 解析兜底
      if (!svg) {
        const htmlDoc = new DOMParser().parseFromString(svgStr, "text/html");
        svg = htmlDoc.querySelector("svg");
      }
      return svg ?? null;
    } catch {
      return null;
    }
  }

  private applyTitle(instance: NewTabInstance, s: NewTabSettingsView): void {
    const { titleH1 } = instance;
    const text = this.resolveTitleText(s);
    titleH1.textContent = text;
    // 来源：无 → 隐藏、不占位（用 CSS 类切换，避免直接改 inline style）
    if (s.newTabTitleType === "none") {
      titleH1.addClass("is-hidden");
      return;
    }
    titleH1.removeClass("is-hidden");
    titleH1.style.fontSize = `${s.newTabTitleFontSize}px`;
    titleH1.style.fontFamily =
      FONT_VAR[s.newTabTitleFont] ?? "var(--font-interface, sans-serif)";
    // 字重固定 600 已由静态 css（.style-tweaker-new-tab-title h1）承载，此处不再设置
    if (s.newTabTitleCustomColor) {
      // 开关开启：选中的具体色用对应 hex；选"默认"用 Obsidian 主题强调色
      const color = resolveAccentValue(s.newTabTitleColor, "");
      titleH1.style.color = color ? color : "var(--color-accent)";
    } else {
      // 开关关闭：不使用自定义颜色，标题颜色跟随默认
      titleH1.style.removeProperty("color");
    }
  }

  private resolveTitleText(s: NewTabSettingsView): string {
    // 自定义来源：仅当文本非空时返回自定义文本；空则返回空串（标题显示空白、不回落默认）
    if (s.newTabTitleType === "custom") {
      return s.newTabTitleText.trim();
    }
    // 默认来源：返回默认标题文本
    try {
      const lang = getLanguage();
      if (lang?.startsWith("zh")) return "磨砺你的思维";
    } catch {
      // ignore
    }
    return "Sharpen your thinking.";
  }

  private destroyInstance(instance: NewTabInstance): void {
    if (instance.engine) {
      instance.engine.destroy();
      instance.engine = null;
    }
    instance.container.remove();
    instance.viewContent.removeClass("style-tweaker-new-tab-view-content");
  }

  private clearAll(): void {
    for (const instance of this.instances.values()) {
      this.destroyInstance(instance);
    }
    this.instances.clear();
    for (const doc of getAppDocuments(this.app)) {
      doc.querySelectorAll(`.${ROOT_CLASS}`).forEach((el) => el.remove());
    }
  }
}
