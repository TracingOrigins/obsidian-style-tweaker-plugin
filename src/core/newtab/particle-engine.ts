/**
 * Particle wordmark engine。
 *
 * 将新标签页的徽标/标题栅格化到离屏 canvas，采样像素为物理粒子阵列，
 * 并在覆盖 canvas 上以弹簧-阻尼运动动画：粒子被光标/触摸排斥（Arknights
 * 风格涟漪），并可叠加多种静止漂浮运动（wave / float / undulate / pulse
 * / ripple / breathe）。支持徽标与标题分别着色、容器 resize 与就地 refresh
 * 时无缝重采样。纯 TypeScript，不依赖 Svelte 与 Obsidian API，可独立复用。
 */

export interface ParticleWordmarkOptions {
  monochrome: boolean;
  color: string;
  /** 徽标专属 mono 色（hex，可为空）。优先于全局 color，用于徽标/标题分开着色。 */
  logoColor?: string;
  /** 标题专属 mono 色（hex，可为空）。优先于全局 color，用于徽标/标题分开着色。 */
  titleColor?: string;
  /** 画布内容相对原始 wordmark 区域的放大倍数。 */
  zoom: number;
  /** 采样点阵间距，CSS 像素。 */
  spacing: number;
  /** 单个粒子半径，CSS 像素（放大前）。 */
  dotSize: number;
  /** 光标扰动区域半径，CSS 像素。 */
  repulsionRadius: number;
  /** 光标把粒子推开的强度。 */
  repulsionStrength: number;
  /** 静止时叠加的漂浮运动，绘制时计算。 */
  ambientMotion: AmbientMotion;
  /** 鼠标交互监听容器。缺省时用 container；可传更大的容器（如整个空标签页视图）
      扩大扰动触发范围，坐标仍基于 container（内容区域）换算。 */
  interactionContainer?: HTMLElement;
}

export type AmbientMotion =
  | "none"
  | "wave"
  | "float"
  | "undulate"
  | "pulse"
  | "ripple"
  | "breathe";

interface Particle {
  x: number;
  y: number;
  hx: number;
  hy: number;
  vx: number;
  vy: number;
  radius: number;
  fill: string;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

type DrawOp = (
  | { kind: "text"; element: HTMLHeadingElement; offsetX: number; offsetY: number }
  | { kind: "image"; element: HTMLImageElement; offsetX: number; offsetY: number; width: number; height: number }
  | { kind: "svg"; element: SVGSVGElement; offsetX: number; offsetY: number; width: number; height: number }
) & {
  /** 该 source 的着色色：非 null 时用该色（按亮度加阴影），null 时用源像素色。 */
  mono: RGB | null;
  /** 该 source 在内容中的坐标区域（CSS 像素），用于采样时按归属着色。 */
  region?: { x: number; y: number; width: number; height: number };
};

interface CapturedSources {
  ops: DrawOp[];
  hiddenElements: HTMLElement[];
}

const SPRING_STRENGTH = 0.02;
const DAMPING = 0.12;
const MAX_PARTICLES = 15000;
const RESIZE_DEBOUNCE_MS = 200;
const MIN_ALPHA = 128;
const TOUCH_REPULSION_FACTOR = 0.85;
const MAX_ZOOM = 4;
/** 首建时若内容区 rect 为 0×0（移动端空标签页刚创建/切到前台布局未稳），
    等待布局就绪的最大总时长，超时才判定失败回退。 */
const BUILD_LAYOUT_WAIT_MS = 2400;
/** 布局轮询间隔。 */
const BUILD_LAYOUT_POLL_MS = 120;

const AMBIENT_AMPLITUDE = 1.6;
const WAVE_SPEED = 2.4;
const WAVE_NUMBER = 0.045;
const FLOAT_SPEED = 1.4;
const FLOAT_AMPLITUDE = 2.4;
const UNDULATE_SPEED = 1.6;
const UNDULATE_NUMBER = 0.026;
const UNDULATE_AMPLITUDE = 2.0;
const HEARTBEAT_SPEED = 5.2;
const HEARTBEAT_LAG = 0.9;
const HEARTBEAT_SECOND_BEAT = 0.55;
const HEARTBEAT_NUMBER = 0.008;
const HEARTBEAT_SCALE_INNER = 0.004;
const HEARTBEAT_SCALE_OUTER = 0.018;
const BREATHE_SPEED = 1.1;
const BREATHE_SCALE = 0.015;
const RIPPLE_SPEED = 3.0;
const RIPPLE_NUMBER = 0.05;
const RIPPLE_AMPLITUDE = 1.4;

const SIN_LUT_BITS = 10;
const SIN_LUT_SIZE = 1 << SIN_LUT_BITS;
const SIN_LUT_SCALE = SIN_LUT_SIZE / (Math.PI * 2);
const SIN_LUT = (() => {
  const table = new Float32Array(SIN_LUT_SIZE);
  for (let i = 0; i < SIN_LUT_SIZE; i++)
    table[i] = Math.sin((i / SIN_LUT_SIZE) * Math.PI * 2);
  return table;
})();

function lutSin(phase: number): number {
  return SIN_LUT[(phase * SIN_LUT_SCALE) & (SIN_LUT_SIZE - 1)];
}

function heartbeatShape(phase: number): number {
  const a = lutSin(phase);
  const b = lutSin(phase - HEARTBEAT_LAG);
  const lub = a > 0 ? a * a * a * a * a * a : 0;
  const dub = b > 0 ? b * b * b * b * b * b : 0;
  return lub + HEARTBEAT_SECOND_BEAT * dub;
}

export class ParticleEngine {
  private readonly container: HTMLElement;
  /** 鼠标交互监听容器：默认与 container 相同；可传更大的容器（如整个空标签页视图）
      扩大扰动触发范围，坐标仍基于 container（内容区域）换算到粒子画布。 */
  private readonly interactionContainer: HTMLElement;
  /** 引擎所在文档的 window：canvas 属于 popout 独立窗口时，rAF/定时器必须用该 window，
      否则（用主窗口 window）popout 最大化遮挡主窗口后 rAF 被暂停 → 画布被 resample 清空后
      不再重绘，表现为"元素都在但粒子空白"。 */
  private get docWin(): Window {
    return (this.container.ownerDocument.defaultView as Window | null) ?? window;
  }
  private readonly repulsionRadius: number;
  private readonly repulsionStrength: number;
  private readonly zoom: number;
  private readonly ambientMotion: AmbientMotion;
  private readonly dotSize: number;
  private readonly spacing: number;

  private particles: Particle[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private renderContext: CanvasRenderingContext2D | null = null;
  private scale = 1;
  private contentWidth = 0;
  private contentHeight = 0;
  private cssWidth = 0;
  private cssHeight = 0;
  /** 徽标/标题内容基准尺寸（不含引擎动态撑开的 padding）。缩放/重采样以此为准，避免 ResizeObserver 循环。 */
  private baseWidth = 0;
  private baseHeight = 0;
  private rafId: number | null = null;
  private buildToken = 0;
  private destroyed = false;
  private mouse = { x: -9999, y: -9999 };
  private hiddenElements: { element: HTMLElement; previousVisibility: string }[] = [];
  private originalContainerPosition: string | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimer: number | null = null;
  private rebuildTimestamps: number[] = [];
  /** 空采样重试：窗口最大化/布局未稳瞬间可能采到 0 源或 0 粒子，不清空旧粒子而定时重试。 */
  private emptyResampleTimer: number | null = null;
  private emptyResampleAttempts = 0;

  private readonly handleMouseMove = (event: MouseEvent): void => {
    // 画布居中于当前容器（高度可能含引擎动态撑开的 padding-bottom）。
    // 鼠标坐标须映射到画布坐标系：用当前实际容器尺寸实时计算居中偏移，
    // 否则动态 padding 撑开容器后会导致扰动位置比鼠标偏下。
    const rect = this.container.getBoundingClientRect();
    this.mouse.x =
      event.clientX - rect.left + (this.cssWidth - rect.width) / 2;
    this.mouse.y =
      event.clientY - rect.top + (this.cssHeight - rect.height) / 2;
  };

  private readonly handleMouseLeave = (): void => {
    this.mouse.x = -9999;
    this.mouse.y = -9999;
  };

  private readonly handleVisibilityChange = (): void => {
    if (this.destroyed) return;
    if (this.container.ownerDocument.hidden) {
      this.stopLoop();
    } else if (this.canvas) {
      this.startLoop();
    }
  };

  private readonly handleResize = (): void => {
    if (this.destroyed) return;
    if (this.resizeTimer !== null) this.docWin.clearTimeout(this.resizeTimer);
    this.resizeTimer = this.docWin.setTimeout(() => {
      this.resizeTimer = null;
      if (this.destroyed || !this.container.isConnected || !this.canvas) return;
      const rect = this.resolveContentRect();
      // 容器高度含引擎动态撑开的 padding-bottom；将其减去后与内容基准高度比较，
      // 避免撑开自身触发无限重采样循环。
      const dynPadding = parseFloat(this.container.style.paddingBottom) || 0;
      const effectiveHeight = rect.height - dynPadding;
      if (
        Math.abs(rect.width - this.contentWidth) < 1 &&
        Math.abs(effectiveHeight - this.contentHeight) < 1
      )
        return;
      const now = Date.now();
      this.rebuildTimestamps = this.rebuildTimestamps.filter(
        (time) => now - time < 5000,
      );
      this.rebuildTimestamps.push(now);
      // 引擎自身循环已通过内容基准缓存与 effectiveHeight 规避；此保护仅作安全网，
      // 阈值放宽，避免把用户频繁调整窗口宽度这类正常操作误判为死循环而销毁粒子。
      if (this.rebuildTimestamps.length > 40) {
        console.warn(
          "[style-tweaker] Particle effect: the wordmark container keeps resizing; auto-resample stopped to avoid a rebuild loop.",
        );
        this.destroy();
        return;
      }
      void this.resample();
    }, RESIZE_DEBOUNCE_MS);
  };

  /** 徽标 mono 色（null=徽标用原像素色） */
  private logoMono: RGB | null;
  /** 标题 mono 色（null=标题用原像素色） */
  private titleMono: RGB | null;

  constructor(container: HTMLElement, options: ParticleWordmarkOptions) {
    this.container = container;
    this.interactionContainer = options.interactionContainer ?? container;
    this.dotSize = options.dotSize;
    this.spacing = options.spacing;
    // 徽标/标题 mono 色：优先取各自的专属色（logoColor/titleColor），
    // 否则当整体 monochrome 时共用 options.color；都不满足则 null（用原像素色）。
    this.logoMono = options.logoColor
      ? parseHexColor(options.logoColor)
      : options.monochrome
        ? parseHexColor(options.color)
        : null;
    this.titleMono = options.titleColor
      ? parseHexColor(options.titleColor)
      : options.monochrome
        ? parseHexColor(options.color)
        : null;
    this.repulsionRadius =
      options.repulsionRadius *
      ("ontouchstart" in (container.ownerDocument.defaultView ?? window)
        ? TOUCH_REPULSION_FACTOR
        : 1);
    this.repulsionStrength = options.repulsionStrength;
    this.zoom = Math.min(Math.max(options.zoom, 1), MAX_ZOOM);
    this.ambientMotion = options.ambientMotion ?? "none";
  }

  async build(): Promise<boolean> {
    if (this.destroyed || !this.container.isConnected) return false;
    const token = ++this.buildToken;

    // 首建时容器可能尚未完成布局（尤其移动端空标签页刚创建/切到前台时 rect 为 0×0）。
    // 与 resample() 的空采样重试同理：先等布局稳定而非立即失败销毁，
    // 否则引擎会在每次 apply() 时因 0 尺寸回退、粒子永远起不来。
    let containerRect = this.resolveContentRect();
    if (containerRect.width <= 0 || containerRect.height <= 0) {
      const waitedMs = await this.waitForContentSize(token);
      if (this.destroyed || token !== this.buildToken) return false;
      containerRect = this.resolveContentRect();
      if (containerRect.width <= 0 || containerRect.height <= 0) {
        console.warn(
          "[style-tweaker] particle build: zero-size content rect after waiting",
          containerRect.width,
          containerRect.height,
          `(waited ${waitedMs}ms)`,
        );
        return false;
      }
      console.warn(
        `[style-tweaker] particle build: content rect was 0x0 at first attempt, waited ${waitedMs}ms for layout.`,
      );
    }

    // 记录内容基准尺寸：排除引擎此前动态撑开的 padding-bottom，避免重采样时循环发散。
    const dynPaddingBottom = parseFloat(this.container.style.paddingBottom) || 0;
    this.baseWidth = containerRect.width;
    this.baseHeight = containerRect.height - dynPaddingBottom;

    const scale = Math.max(
      2,
      this.container.ownerDocument.defaultView?.devicePixelRatio || 1,
    );
    const offscreen = createEl("canvas");
    offscreen.width = Math.ceil(this.baseWidth * scale);
    offscreen.height = Math.ceil(this.baseHeight * scale);
    // 关键：willReadFrequently:true 强制使用 CPU 背板。
    // 移动 WebView (Android WebView / iOS WKWebView) 的 GPU 加速 canvas 在
    // 首次 getImageData 时常读到未合成的"脏缓冲"（整块被当不透明），
    // 导致粒子采样把整块区域当成字形前景 → 出现无图案的矩形粒子阵。
    // 显式声明要频繁读像素，浏览器会走 CPU 路径，避开该问题。
    const offscreenContext = offscreen.getContext("2d", {
      alpha: true,
      willReadFrequently: true,
    });
    if (!offscreenContext) return false;
    // 保险：先做一次 1×1 readback 强制把 GPU 合成落到 CPU（部分 WebView
    // 即便声明了 willReadFrequently 仍存在首读滞后），结果丢弃。
    try {
      offscreenContext.getImageData(0, 0, 1, 1);
    } catch {
      // ignore
    }
    // 确保画布从全透明开始（个别 WebView 若给画布留了不透明底色，
    // 会让采样把整块区域都当成字形前景，从而出现无图案的矩形粒子阵）。
    offscreenContext.clearRect(0, 0, offscreen.width, offscreen.height);
    offscreenContext.scale(scale, scale);

    const sources = this.collectSources(containerRect, offscreenContext);
    if (sources.ops.length === 0) {
      console.warn("[style-tweaker] particle build: no logo/title sources found");
      return false;
    }

    for (const op of sources.ops) {
      if (this.destroyed || token !== this.buildToken) return false;
      try {
        await this.applyDrawOp(offscreenContext, op);
      } catch (error) {
        console.warn(
          "[style-tweaker] Particle effect: a wordmark source could not be rasterized and was skipped.",
          error,
        );
      }
    }
    if (this.destroyed || token !== this.buildToken) return false;

    this.scale = scale;
    this.contentWidth = this.baseWidth;
    this.contentHeight = this.baseHeight;
    this.cssWidth = this.baseWidth * this.zoom;
    this.cssHeight = this.baseHeight * this.zoom;

    try {
      this.particles = this.sampleParticles(offscreen, sources.ops);
    } catch (error) {
      console.warn(
        "[style-tweaker] Particle effect: unable to sample the wordmark pixels; falling back to the normal rendering.",
        error,
      );
      this.destroy();
      return false;
    }
    // 读取重试期间引擎可能被销毁/被新 build 取代
    if (this.destroyed || token !== this.buildToken) return false;

    if (this.particles.length === 0) return false;

    // 撑开容器下边界，使粒子画布向下溢出的部分落在容器内，empty-state 被推后、不被覆盖。
    this.applyDynamicPadding();
    this.activate(sources);
    return true;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.buildToken++;
    this.teardown();
  }

  /** 引擎是否已销毁（含 build 失败自毁、resize 循环保护性销毁）。外层需据此重建。 */
  isDestroyed(): boolean {
    return this.destroyed;
  }

  /**
   * 就地刷新（无缝，避免重建闪烁）：
   *   1. 更新徽标/标题 mono 色（undefined/null = 用各自源像素色）；
   *   2. 基于当前 DOM 内容重新采样粒子。
   * 全程保留已激活的粒子画布，只有采样完成后才用新粒子替换，故图标/标题/颜色/主题
   * 切换时不会出现“先闪一下未开粒子的画面”。若粒子尚未激活则回退到首次 build。
   */
  refresh(mono: { logoColor?: string; titleColor?: string }): void {
    if (this.destroyed) return;
    this.logoMono = mono.logoColor ? parseHexColor(mono.logoColor) : null;
    this.titleMono = mono.titleColor ? parseHexColor(mono.titleColor) : null;
    if (!this.canvas || !this.renderContext) {
      void this.build();
      return;
    }
    void this.resample();
  }

  private async resample(): Promise<void> {
    const token = ++this.buildToken;
    const contentRect = this.resolveContentRect();
    if (contentRect.width <= 0 || contentRect.height <= 0) return;

    // 更新内容基准尺寸（排除引擎动态撑开的 padding-bottom），宽度变化后据此重采样。
    const dynPadding = parseFloat(this.container.style.paddingBottom) || 0;
    this.baseWidth = contentRect.width;
    this.baseHeight = contentRect.height - dynPadding;

    const scale = Math.max(
      2,
      this.container.ownerDocument.defaultView?.devicePixelRatio || 1,
    );
    const offscreen = createEl("canvas");
    offscreen.width = Math.ceil(this.baseWidth * scale);
    offscreen.height = Math.ceil(this.baseHeight * scale);
    const offscreenContext = offscreen.getContext("2d", {
      alpha: true,
      willReadFrequently: true,
    });
    if (!offscreenContext) return;
    offscreenContext.scale(scale, scale);

    const sources = this.collectSources(contentRect, offscreenContext);
    for (const op of sources.ops) {
      if (this.destroyed || token !== this.buildToken) return;
      try {
        await this.applyDrawOp(offscreenContext, op);
      } catch (error) {
        console.warn(
          "[style-tweaker] Particle effect: a wordmark source could not be rasterized and was skipped.",
          error,
        );
      }
    }
    if (this.destroyed || token !== this.buildToken) return;

    try {
      const particles = this.sampleParticles(offscreen, sources.ops);
      if (
        this.destroyed ||
        token !== this.buildToken ||
        !this.canvas ||
        !this.renderContext
      )
        return;
      // 窗口最大化/布局未稳的瞬间可能采到 0 源或 0 粒子：保留现有粒子与画布尺寸，
      // 定时重试几次（避免瞬间清空后无后续 resize 触发、粒子永久消失）。仅当已有粒子时才保护；
      // 首次 build 为空仍会走 build() 的失败回退，不在此处理。
      if (sources.ops.length === 0 || particles.length === 0) {
        if (this.particles.length > 0) {
          this.scheduleEmptyResampleRetry();
          return;
        }
      }
      this.scale = scale;
      this.contentWidth = this.baseWidth;
      this.contentHeight = this.baseHeight;
      this.cssWidth = this.baseWidth * this.zoom;
      this.cssHeight = this.baseHeight * this.zoom;
      this.particles = particles;
      this.emptyResampleAttempts = 0;
      const width = Math.ceil(this.cssWidth * scale);
      const height = Math.ceil(this.cssHeight * scale);
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.renderContext.setTransform(scale, 0, 0, scale, 0, 0);
      }
      this.canvas.style.width = `${this.cssWidth}px`;
      this.canvas.style.height = `${this.cssHeight}px`;
      this.applyDynamicPadding();
    } catch (error) {
      console.warn(
        "[style-tweaker] Particle effect: unable to sample the wordmark pixels; falling back to the normal rendering.",
        error,
      );
      this.destroy();
    }
  }

  /** 空采样重试：布局未稳（如窗口最大化动画中徽标/标题 rect 瞬时为 0）时不立即清空粒子，
      而是以短间隔重试几次，待布局稳定后完成一次有效重采样。 */
  private scheduleEmptyResampleRetry(): void {
    if (this.destroyed) return;
    if (this.emptyResampleTimer !== null) return;
    // 最多重试约 1 秒（200ms × 5）；仍空则放弃（保留旧粒子，等待下一次 resize/主题刷新）
    if (this.emptyResampleAttempts >= 5) {
      this.emptyResampleAttempts = 0;
      return;
    }
    this.emptyResampleAttempts++;
    this.emptyResampleTimer = this.docWin.setTimeout(() => {
      this.emptyResampleTimer = null;
      if (this.destroyed || !this.canvas) return;
      void this.resample();
    }, 200);
  }

  /** 首建等待内容区出现有效尺寸（非 0×0）。移动端空标签页刚创建/切到前台时，
      注入容器可能尚未完成布局；轮询期间文档被隐藏/引擎被销毁/被新的 build 取代即中断。
      返回实际等待毫秒数。 */
  private async waitForContentSize(token: number): Promise<number> {
    const started = this.docWin.performance?.now?.() ?? Date.now();
    while (!this.destroyed && token === this.buildToken) {
      if (!this.container.isConnected) break;
      const rect = this.resolveContentRect();
      if (rect.width > 0 && rect.height > 0) break;
      const docHidden = this.container.ownerDocument.hidden;
      if (docHidden) break; // 文档隐藏时不会布局，等下次可见再走 apply/resize 路径
      await new Promise<void>((resolve) =>
        this.docWin.setTimeout(resolve, BUILD_LAYOUT_POLL_MS),
      );
      if (this.docWin.performance?.now?.() ?? Date.now() - started >= BUILD_LAYOUT_WAIT_MS) break;
    }
    const elapsed = (this.docWin.performance?.now?.() ?? Date.now()) - started;
    return Math.max(0, Math.round(elapsed));
  }

  private collectSources(
    containerRect: { left: number; top: number },
    measureContext: CanvasRenderingContext2D | null,
  ): CapturedSources {
    const ops: DrawOp[] = [];
    const hiddenElements: HTMLElement[] = [];

    const logoContainer =
      this.container.querySelector<HTMLElement>(".style-tweaker-new-tab-logo");
    if (logoContainer) {
      const svg = logoContainer.querySelector<SVGSVGElement>("svg");
      const img = svg ? null : logoContainer.querySelector<HTMLImageElement>("img");
      const target: SVGSVGElement | HTMLImageElement | null = svg ?? img;
      if (target) {
        const rect = target.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const offsetX = rect.left - containerRect.left;
          const offsetY = rect.top - containerRect.top;
          if (svg) {
            ops.push({ kind: "svg", element: svg, offsetX, offsetY, width: rect.width, height: rect.height, mono: this.logoMono, region: { x: offsetX, y: offsetY, width: rect.width, height: rect.height } });
          } else if (img) {
            ops.push({ kind: "image", element: img, offsetX, offsetY, width: rect.width, height: rect.height, mono: this.logoMono, region: { x: offsetX, y: offsetY, width: rect.width, height: rect.height } });
          }
          hiddenElements.push(logoContainer);
        }
      }
    }

    const heading = this.container.querySelector<HTMLHeadingElement>(
      ".style-tweaker-new-tab-title h1",
    );
    if (heading && heading.textContent && heading.textContent.trim().length > 0) {
      const rect = heading.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const offsetX = rect.left - containerRect.left;
        const offsetY = rect.top - containerRect.top;
        // 标题 region 覆盖文字实际绘制范围（与 drawText 的居中/对齐逻辑一致），
        // 否则当文字宽度接近元素宽度时，文字最左/最右边缘像素会落在 region 外，
        // 无法应用 mono 主题色而残留源像素色。
        const style = (heading.ownerDocument.defaultView ?? window).getComputedStyle(heading);
        let region = { x: offsetX, y: offsetY, width: rect.width, height: rect.height };
        if (measureContext && style.fontSize) {
          measureContext.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          const metrics = measureContext.measureText(heading.textContent);
          const pad = Math.ceil(parseFloat(style.fontSize) || 0);
          let textX = offsetX;
          if (style.textAlign === "center") textX += (rect.width - metrics.width) / 2;
          else if (style.textAlign === "right" || style.textAlign === "end") textX += rect.width - metrics.width;
          region = {
            x: Math.min(offsetX, textX) - pad,
            y: offsetY,
            width: Math.max(rect.width, metrics.width) + pad * 2,
            height: rect.height,
          };
        }
        ops.push({
          kind: "text",
          element: heading,
          offsetX,
          offsetY,
          mono: this.titleMono,
          region,
        });
        hiddenElements.push(heading);
      }
    }

    return { ops, hiddenElements };
  }

  private async applyDrawOp(
    context: CanvasRenderingContext2D,
    op: DrawOp,
  ): Promise<void> {
    if (op.kind === "text") {
      this.drawText(context, op.element, op.offsetX, op.offsetY);
    } else if (op.kind === "image") {
      await this.waitForImage(op.element);
      context.drawImage(op.element, op.offsetX, op.offsetY, op.width, op.height);
    } else {
      const image = await this.rasterizeSvg(op.element);
      context.drawImage(image, op.offsetX, op.offsetY, op.width, op.height);
    }
  }

  private drawText(
    context: CanvasRenderingContext2D,
    element: HTMLHeadingElement,
    offsetX: number,
    offsetY: number,
  ): void {
    const style = (element.ownerDocument.defaultView ?? window).getComputedStyle(
      element,
    );
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    context.fillStyle = style.color;
    context.textBaseline = "alphabetic";

    const text = element.textContent ?? "";
    const metrics = context.measureText(text);
    const fontSizePx = parseFloat(style.fontSize) || 0;
    const ascent = metrics.actualBoundingBoxAscent || fontSizePx * 0.8;
    const descent = metrics.actualBoundingBoxDescent || fontSizePx * 0.2;

    const elementRect = element.getBoundingClientRect();
    let x = offsetX;
    if (style.textAlign === "center") {
      x = offsetX + (elementRect.width - metrics.width) / 2;
    } else if (style.textAlign === "right" || style.textAlign === "end") {
      x = offsetX + elementRect.width - metrics.width;
    }
    const baselineY =
      offsetY + (elementRect.height - (ascent + descent)) / 2 + ascent;
    context.fillText(text, x, baselineY);
  }

  private waitForImage(image: HTMLImageElement): Promise<void> {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => reject(new Error("Logo image failed to load")), { once: true });
    });
  }

  private rasterizeSvg(element: SVGSVGElement): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const rect = element.getBoundingClientRect();
      const clone = element.cloneNode(true) as SVGSVGElement;
      const style = (element.ownerDocument.defaultView ?? window).getComputedStyle(
        element,
      );
      clone.setAttribute("width", String(rect.width));
      clone.setAttribute("height", String(rect.height));
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.setAttribute("color", style.color);
      if (style.stroke && style.stroke !== "none") {
        clone.setAttribute("stroke", style.stroke);
      }
      const serialized = new XMLSerializer().serializeToString(clone);
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("SVG logo image failed to load"));
      image.src =
        "data:image/svg+xml;charset=utf-8," + encodeURIComponent(serialized);
    });
  }

  private sampleParticles(
    offscreen: HTMLCanvasElement,
    ops: DrawOp[],
  ): Particle[] {
    // 把源画布 drawImage 到声明了 willReadFrequently 的新画布再 getImageData，
    // 移动 WebView 上也能稳定读到绘制内容（drawImage 强制把合成表面写入 CPU 位图）。
    const data = this.readCanvasPixels(offscreen);
    if (!data) return [];
    // 记录每个 op 的内容坐标区域与 mono 色，用于按像素归属决定着色
    const regions: { region: { x: number; y: number; width: number; height: number }; mono: RGB | null }[] = [];
    for (const op of ops) {
      if (op.region) regions.push({ region: op.region, mono: op.mono });
    }
    let step = this.spacing * this.scale;
    let particles = this.collectParticles(
      data,
      offscreen.width,
      offscreen.height,
      step,
      regions,
    );
    while (particles.length > MAX_PARTICLES) {
      step *= 2;
      particles = this.collectParticles(
        data,
        offscreen.width,
        offscreen.height,
        step,
        regions,
      );
    }
    return particles;
  }

  /**
   * 读取画布像素：先把源画布 drawImage 到一块声明了 willReadFrequently 的新画布，
   * 再从新画布读取（drawImage 强制浏览器把已合成的表面写入 CPU 位图，移动端也稳定）。
   */
  private readCanvasPixels(source: HTMLCanvasElement): Uint8ClampedArray | null {
    try {
      // 仅用于像素回读的离屏画布，无需挂到 DOM 或指定文档，直接用 Obsidian createEl。
      const read = createEl("canvas");
      read.width = source.width;
      read.height = source.height;
      const ctx = read.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(source, 0, 0, source.width, source.height);
      const image = ctx.getImageData(0, 0, read.width, read.height);
      return image.data;
    } catch {
      return null;
    }
  }

  private collectParticles(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    step: number,
    regions: { region: { x: number; y: number; width: number; height: number }; mono: RGB | null }[],
  ): Particle[] {
    const particles: Particle[] = [];
    // 注意：step 可能是浮点（spacing×devicePixelRatio），绝不能把浮点 y/x 直接当数组索引：
    // Uint8ClampedArray 的浮点下标不存在 → 返回 undefined → `undefined <= MIN_ALPHA` 为 false
    // → 每个点都被误判为"不透明"而收集（移动端高 DPR 时整块铺满）。务必先取整再用整数索引。
    for (let yf = Math.floor(step / 2); yf < height; yf += step) {
      for (let xf = Math.floor(step / 2); xf < width; xf += step) {
        const y = Math.floor(yf);
        const x = Math.floor(xf);
        const index = (y * width + x) * 4;
        if (index + 3 >= data.length) continue;
        if (data[index + 3] <= MIN_ALPHA) continue;
        const hx = (x / this.scale) * this.zoom;
        const hy = (y / this.scale) * this.zoom;
        // 按像素归属决定 mono 色（优先第一个命中的 op 区域）
        let mono: RGB | null = null;
        const cssX = x / this.scale;
        const cssY = y / this.scale;
        for (const r of regions) {
          if (
            cssX >= r.region.x &&
            cssX < r.region.x + r.region.width &&
            cssY >= r.region.y &&
            cssY < r.region.y + r.region.height
          ) {
            mono = r.mono;
            break;
          }
        }
        let fill: string;
        if (mono) {
          // 统一使用所选 mono 颜色：不随源像素亮度做明暗变化。
          // 否则徽标与标题（源亮度不同）粒子颜色会不一致，
          // 且文字/图标边缘的抗锯齿低亮度像素会被压暗，看起来没应用所选主题色。
          fill = rgbFillString(mono);
        } else {
          fill = rgbFillString({
            r: data[index],
            g: data[index + 1],
            b: data[index + 2],
          });
        }
        particles.push({
          x: hx,
          y: hy,
          hx,
          hy,
          vx: 0,
          vy: 0,
          radius: this.dotSize * this.zoom,
          fill,
        });
      }
    }
    return particles;
  }

  private activate(sources: CapturedSources): void {
    this.installCanvas();
    this.hideCapturedElements(sources.hiddenElements);
    // 鼠标事件绑定到 interactionContainer（更大的监听范围，如整个空标签页视图），
    // 坐标仍基于 container（内容区域）换算到粒子画布。
    this.interactionContainer.addEventListener("mousemove", this.handleMouseMove, {
      passive: true,
    });
    this.interactionContainer.addEventListener("mouseleave", this.handleMouseLeave);
    this.interactionContainer.ownerDocument.addEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(this.container);
    this.startLoop();
  }

  /**
   * 撑开外层容器（上下对称 padding），使粒子画布向上/向下溢出的部分都落在外层容器内。
   *
   * 关键：对称 padding 加在外层 root（wordmark 容器的父级），而不是 wordmark 容器本身。
   * - wordmark 容器（引擎的定位/鼠标/采样基准）高度保持稳定，画布居中基准不变，鼠标坐标不偏移。
   * - 画布居中于 wordmark 容器、上下各溢出 (cssHeight - 内容高)/2，正好落在 root 的上下 padding 内，
   *   因此画布在 root 内上下对称居中，向下不覆盖 empty-state（被推后），向上也不溢出到视图顶部。
   */
  private applyDynamicPadding(): void {
    if (!this.container.isConnected) return;
    const root = this.container.parentElement;
    if (!root) return;
    // 画布相对 wordmark 容器的上下溢出量
    const overflowY = Math.max(0, (this.cssHeight - this.baseHeight) / 2);
    const gap = 24; // px，画布底部与 empty-state 之间的固定间距
    root.style.padding = `${overflowY}px 0 ${overflowY + gap}px`;
  }

  private resolveContentRect(): DOMRect {
    const content = this.container.querySelector<HTMLElement>(
      ".style-tweaker-new-tab-wordmark-container",
    );
    return (content ?? this.container).getBoundingClientRect();
  }

  private installCanvas(): void {
    const canvas = createEl("canvas");
    canvas.className = "style-tweaker-new-tab-particle-canvas";
    canvas.width = Math.ceil(this.cssWidth * this.scale);
    canvas.height = Math.ceil(this.cssHeight * this.scale);
    const st = canvas.style;
    st.position = "absolute";
    st.top = "50%";
    st.left = "50%";
    st.transform = "translate(-50%, -50%)";
    st.width = `${this.cssWidth}px`;
    st.height = `${this.cssHeight}px`;
    st.display = "block";
    st.pointerEvents = "none";
    st.opacity = "0";
    st.transition = "opacity 0.4s ease";

    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(this.scale, 0, 0, this.scale, 0, 0);

    this.originalContainerPosition = this.container.style.position;
    if (!this.container.style.position) {
      this.container.style.position = "relative";
    }
    this.container.appendChild(canvas);
    this.canvas = canvas;
    this.renderContext = context;
    this.docWin.requestAnimationFrame(() => {
      if (this.canvas === canvas) canvas.style.opacity = "1";
    });
  }

  private hideCapturedElements(elements: HTMLElement[]): void {
    this.hiddenElements = elements.map((element) => {
      const previousVisibility = element.style.visibility;
      element.style.visibility = "hidden";
      return { element, previousVisibility };
    });
  }

  private restoreCapturedElements(): void {
    for (const { element, previousVisibility } of this.hiddenElements) {
      element.style.visibility = previousVisibility;
    }
    this.hiddenElements = [];
  }

  private teardown(): void {
    if (this.resizeTimer !== null) {
      this.docWin.clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
    if (this.emptyResampleTimer !== null) {
      this.docWin.clearTimeout(this.emptyResampleTimer);
      this.emptyResampleTimer = null;
    }
    this.emptyResampleAttempts = 0;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.interactionContainer.removeEventListener("mousemove", this.handleMouseMove);
    this.interactionContainer.removeEventListener("mouseleave", this.handleMouseLeave);
    this.interactionContainer.ownerDocument.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    this.stopLoop();
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.renderContext = null;
    }
    this.restoreCapturedElements();
    // 清除引擎在外层 root 动态撑开的对称 padding
    const root = this.container.parentElement;
    if (root) root.style.padding = "";
    if (this.originalContainerPosition !== null) {
      this.container.style.position = this.originalContainerPosition;
      this.originalContainerPosition = null;
    }
    this.particles = [];
  }

  private startLoop(): void {
    if (this.destroyed || this.rafId !== null) return;
    const frame = (): void => {
      this.rafId = null;
      if (this.destroyed) return;
      if (!this.container.isConnected) {
        this.destroy();
        return;
      }
      this.step();
      this.render();
      this.rafId = this.docWin.requestAnimationFrame(frame);
    };
    this.rafId = this.docWin.requestAnimationFrame(frame);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      this.docWin.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private step(): void {
    const radius = this.repulsionRadius;
    const radiusSquared = radius * radius;
    const mouseX = this.mouse.x;
    const mouseY = this.mouse.y;
    for (const particle of this.particles) {
      const dx = particle.x - mouseX;
      const dy = particle.y - mouseY;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < radiusSquared && distanceSquared > 0.0001) {
        const distance = Math.sqrt(distanceSquared);
        const ratio = (radius - distance) / radius;
        const force = ratio * ratio * this.repulsionStrength;
        particle.vx += (dx / distance) * force;
        particle.vy += (dy / distance) * force;
      }
      particle.vx += (particle.hx - particle.x) * SPRING_STRENGTH;
      particle.vy += (particle.hy - particle.y) * SPRING_STRENGTH;
      particle.vx *= 1 - DAMPING;
      particle.vy *= 1 - DAMPING;
      particle.x += particle.vx;
      particle.y += particle.vy;
    }
  }

  private render(): void {
    const context = this.renderContext;
    if (!context) return;
    context.clearRect(0, 0, this.cssWidth, this.cssHeight);
    const particles = this.particles;
    const motion = this.ambientMotion;
    if (motion === "none") {
      this.renderStatic(context, particles);
      return;
    }
    const time =
      (this.container.ownerDocument.defaultView ?? window).performance.now() *
      0.001;
    if (motion === "wave") this.renderWave(context, particles, time);
    else if (motion === "float") this.renderFloat(context, particles, time);
    else if (motion === "undulate")
      this.renderUndulate(context, particles, time);
    else if (motion === "pulse")
      this.renderHeartbeat(context, particles, time);
    else if (motion === "breathe")
      this.renderRadialScale(
        context,
        particles,
        1 + BREATHE_SCALE * lutSin(time * BREATHE_SPEED),
      );
    else if (motion === "ripple") this.renderRipple(context, particles, time);
    else this.renderStatic(context, particles);
  }

  private renderStatic(
    context: CanvasRenderingContext2D,
    particles: Particle[],
  ): void {
    let lastFill = "";
    for (const particle of particles) {
      if (particle.fill !== lastFill) {
        context.fillStyle = particle.fill;
        lastFill = particle.fill;
      }
      context.fillRect(
        particle.x - particle.radius,
        particle.y - particle.radius,
        particle.radius * 2,
        particle.radius * 2,
      );
    }
  }

  private renderWave(
    context: CanvasRenderingContext2D,
    particles: Particle[],
    time: number,
  ): void {
    let lastFill = "";
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      if (particle.fill !== lastFill) {
        context.fillStyle = particle.fill;
        lastFill = particle.fill;
      }
      const y =
        particle.y +
        lutSin(time * WAVE_SPEED + (particle.hx + particle.hy) * WAVE_NUMBER) *
          AMBIENT_AMPLITUDE;
      context.fillRect(
        particle.x - particle.radius,
        y - particle.radius,
        particle.radius * 2,
        particle.radius * 2,
      );
    }
  }

  private renderFloat(
    context: CanvasRenderingContext2D,
    particles: Particle[],
    time: number,
  ): void {
    const dy = lutSin(time * FLOAT_SPEED) * FLOAT_AMPLITUDE;
    let lastFill = "";
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      if (particle.fill !== lastFill) {
        context.fillStyle = particle.fill;
        lastFill = particle.fill;
      }
      const y = particle.y + dy;
      context.fillRect(
        particle.x - particle.radius,
        y - particle.radius,
        particle.radius * 2,
        particle.radius * 2,
      );
    }
  }

  private renderUndulate(
    context: CanvasRenderingContext2D,
    particles: Particle[],
    time: number,
  ): void {
    const clock = lutSin(time * UNDULATE_SPEED) * UNDULATE_AMPLITUDE;
    let lastFill = "";
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      if (particle.fill !== lastFill) {
        context.fillStyle = particle.fill;
        lastFill = particle.fill;
      }
      const y =
        particle.y +
        clock * lutSin(particle.hx * UNDULATE_NUMBER + Math.PI / 2);
      context.fillRect(
        particle.x - particle.radius,
        y - particle.radius,
        particle.radius * 2,
        particle.radius * 2,
      );
    }
  }

  private renderRadialScale(
    context: CanvasRenderingContext2D,
    particles: Particle[],
    scale: number,
  ): void {
    const centerX = this.cssWidth / 2;
    const centerY = this.cssHeight / 2;
    const stretch = scale - 1;
    let lastFill = "";
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      if (particle.fill !== lastFill) {
        context.fillStyle = particle.fill;
        lastFill = particle.fill;
      }
      const x = particle.x + (particle.x - centerX) * stretch;
      const y = particle.y + (particle.y - centerY) * stretch;
      context.fillRect(
        x - particle.radius,
        y - particle.radius,
        particle.radius * 2,
        particle.radius * 2,
      );
    }
  }

  private renderHeartbeat(
    context: CanvasRenderingContext2D,
    particles: Particle[],
    time: number,
  ): void {
    const centerX = this.cssWidth / 2;
    const centerY = this.cssHeight / 2;
    const maxDistance = Math.max(centerX, centerY);
    const gain = HEARTBEAT_SCALE_OUTER - HEARTBEAT_SCALE_INNER;
    let lastFill = "";
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      if (particle.fill !== lastFill) {
        context.fillStyle = particle.fill;
        lastFill = particle.fill;
      }
      const dx = particle.x - centerX;
      const dy = particle.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const envelope =
        HEARTBEAT_SCALE_INNER + (distance / maxDistance) * gain;
      const stretch =
        heartbeatShape(time * HEARTBEAT_SPEED - distance * HEARTBEAT_NUMBER) *
        envelope;
      const x = particle.x + dx * stretch;
      const y = particle.y + dy * stretch;
      context.fillRect(
        x - particle.radius,
        y - particle.radius,
        particle.radius * 2,
        particle.radius * 2,
      );
    }
  }

  private renderRipple(
    context: CanvasRenderingContext2D,
    particles: Particle[],
    time: number,
  ): void {
    const centerX = this.cssWidth / 2;
    const centerY = this.cssHeight / 2;
    let lastFill = "";
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      if (particle.fill !== lastFill) {
        context.fillStyle = particle.fill;
        lastFill = particle.fill;
      }
      const dx = particle.x - centerX;
      const dy = particle.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const offset =
        lutSin(time * RIPPLE_SPEED - distance * RIPPLE_NUMBER) *
        RIPPLE_AMPLITUDE;
      if (distance > 0.001) {
        const ratio = offset / distance;
        const x = particle.x + dx * ratio;
        const y = particle.y + dy * ratio;
        context.fillRect(
          x - particle.radius,
          y - particle.radius,
          particle.radius * 2,
          particle.radius * 2,
        );
      } else {
        context.fillRect(
          particle.x - particle.radius,
          particle.y - particle.radius,
          particle.radius * 2,
          particle.radius * 2,
        );
      }
    }
  }
}

function parseHexColor(color: string): RGB {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return { r: 108, g: 49, b: 227 };
  let hex = match[1];
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function rgbFillString(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}
