// ============================================================
// 界面背景 CSS 生成工具（仅供 BackgroundService 使用）
// ------------------------------------------------------------
// CSS 变量（token）命名规范：所有由本插件注入的 CSS 自定义属性统一使用
// `--style-tweaker-` 前缀，与插件 ID 一致。完整 token 清单见 buildTokensCss。
// 这些变量由 JS 运行时注入 <style>（见 BackgroundService），改名后重启即自动
// 以新名注入，无持久化兼容负担。
// ============================================================

/**
 * 生成全局 token 声明（CSS 变量）。
 *
 * 注入策略：
 *   - 图片 URL（`--style-tweaker-bg-image`）与图片不透明度
 *     （`--style-tweaker-bg-opacity`）、玻璃模糊半径（`--style-tweaker-glass-blur`）
 *     与主题无关，声明在 `body`（统一约定：所有由 JS 注入的变量都挂 body），
 *     取值为**当前文档实际解析/选中的那张图**（图片 URL 需运行时 getResourcePath
 *     解析，无法静态写死，且每个文档可能不同，故不按主题分两段）。
 *   - 遮罩色（`--style-tweaker-mask-color`）、纯色
 *     （`--style-tweaker-solid`）、表面色（`--style-tweaker-surface`）按
 *     `body.theme-dark` / `body.theme-light` 各定义一套，使变量随主题自动切换。
 *
 * @param imageUrl  当前文档解析后的背景图 URL（可直接用于 url()），空串则 none
 * @param opacity   背景图不透明度 0~1（来自设置项百分比 / 100）
 * @param glassBlur 玻璃模糊半径(px)，仅图片模式有意义，纯色模式固定 0
 * @param solidDark  深色主题纯色（Hex）
 * @param solidLight 浅色主题纯色（Hex）
 */
export function buildTokensCss(opts: {
  imageUrl: string;
  opacity: number;
  glassBlur: number;
  solidDark: string;
  solidLight: string;
}): string {
  const { imageUrl, opacity, glassBlur, solidDark, solidLight } = opts;
  const url = imageUrl ? `url("${imageUrl}")` : "none";
  const maskAlpha = Math.max(0, Math.min(1, 1 - opacity)).toFixed(3);
  const blur = `${Math.max(0, Math.round(glassBlur ?? 0))}px`;
  return `/* Style Tweaker 全局 token（--style-tweaker-*） */
/* 与主题无关的 token：按当前文档实际解析结果注入（body 单值，不随主题分两段） */
body {
  --style-tweaker-bg-image: ${url};
  --style-tweaker-bg-opacity: ${maskAlpha};
  --style-tweaker-glass-blur: ${blur};
}
/* 深色主题 token：遮罩色=黑、纯色=solidDark、表面色=半透明主题色 */
body.theme-dark {
  --style-tweaker-mask-color: #000;
  --style-tweaker-solid: ${solidDark};
  --style-tweaker-surface: color-mix(in srgb, var(--background-primary) 70%, transparent);
}
/* 浅色主题 token：遮罩色=白、纯色=solidLight、表面色=半透明主题色 */
body.theme-light {
  --style-tweaker-mask-color: #fff;
  --style-tweaker-solid: ${solidLight};
  --style-tweaker-surface: color-mix(in srgb, var(--background-primary) 70%, transparent);
}`;
}

/**
 * 生成壁纸层 CSS（桌面 + 移动统一方案）。
 *
 * 采用统一的 body::before 双伪元素方案（图片层 ::before + 遮罩层 ::after），
 * 桌面端与移动端完全一致：
 *   - 图片层 body::before（fixed, z-index:-1）承载背景图，永远在根层最底，
 *     不受任何子元素 z-index / isolation 遮挡。
 *   - 遮罩层 body::after（fixed, z-index:-1）叠加半透明遮罩色（dark=黑、light=白，
 *     来自 --style-tweaker-mask-color），不透明度由 --style-tweaker-bg-opacity 控制
 *     （值越大图片越清晰）。::after 在 ::before 之后绘制，叠于图片之上、内容之下。
 * 各 UI 容器只需 background:transparent 即可透出 body::before 壁纸，
 * 无需为每个窗口/浮层单独挂背景。
 *
 * 为何统一到 body::before：
 *   - 原先桌面端用 .workspace 直接背景，但 .titlebar 与 .workspace 是兄弟节点，
 *     透明后透不到彼此，需给 titlebar / 独立窗口各自补挂壁纸 + 处理 isolation，复杂易错。
 *   - body::before 在根层，所有 body 子级（含 titlebar、独立窗口、浮层）透明后
 *     自然透出同一张壁纸，上下窗口与浮层玻璃模糊（backdrop-filter）也统一以根层壁纸为模糊源，
 *     规则大幅简化。
 *   - 玻璃浮层（命令面板/菜单/状态栏等）无 transform 时不创建独立层叠上下文，
 *     backdrop-filter 直接模糊到根层 body::before（已验证）。仅移动端 .mobile-tab-switcher
 *     因滑入 transform 创建独立 context，由其自身在 overlay.css 携带壁纸（见 overlay.css）。
 *
 * 门控 .style-tweaker-bg-image-active：纯色模式不挂载，navbar 等显示 surface 色（见 overlay.css / solid.css）。
 */
export function buildBackgroundLayerCss(): string {
  return `/* Style Tweaker 壁纸层：统一 body::before 双伪元素（图片层 + 遮罩层），桌面/移动端共用。
   图片层 body::before：fixed + z-index:-1，根层最底，承载背景图。
   遮罩层 body::after：fixed + z-index:-1，叠加半透明遮罩色，衰减图片亮度。 */
body.style-tweaker-bg-image-active::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: var(--style-tweaker-bg-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}
body.style-tweaker-bg-image-active.theme-dark::after,
body.style-tweaker-bg-image-active.theme-light::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-color: var(--style-tweaker-mask-color);
  opacity: var(--style-tweaker-bg-opacity);
}
/* 所有承载容器透明透出 body::before 壁纸；不干预 navbar/drawer/titlebar 的 z-index，保持原生层叠。
   navbar/tabbar/drawer 的 background:transparent 等细节已由 overlay.css 图片组负责。
   覆盖桌面（.workspace 等）与移动（.app-container / .horizontal-main-container 等）两端容器。 */
.style-tweaker-bg-image-active .app-container,
.style-tweaker-bg-image-active .horizontal-main-container,
.style-tweaker-bg-image-active .workspace,
.style-tweaker-bg-image-active .workspace-drawer,
.style-tweaker-bg-image-active .workspace-drawer-header,
.style-tweaker-bg-image-active .workspace-drawer-ribbon,
.style-tweaker-bg-image-active .titlebar,
.style-tweaker-bg-image-active .titlebar-inner,
body.style-tweaker-bg-image-active > .modal {
  background-color: transparent !important;
  background-image: none !important;
}
/* 移动端抽屉打开时：navbar/tabbar 降到 z-index:-1，使其低于所有 0 层内容（含抽屉）。
 关键点：Obsidian 移动端 .mobile-navbar 原生 z-index 本就高于 .workspace-drawer，
 默认模式"正常"只是因为两者都不透明、视觉上抽屉覆盖了 navbar；透明化后 navbar 的按钮盒子
 浮在 drawer 之上，故必须显式降层。navbar 是 .app-container 直接子级、drawer 嵌在
 .horizontal-main-container（移动端常带 transform 创建独立 context）内，两者不在同级比较，
 只能把 navbar 降到根 context 的 -1 层：与 body::before（壁纸层，同为 -1）同层但 DOM 更晚，
 navbar 仍透出壁纸、非重叠区照常显示；重叠区被 0 层的抽屉覆盖。navbar 不隐藏。
 判定覆盖抽屉打开常见状态：抽屉含 .is-open，或存在抽屉遮罩 .workspace-drawer-backdrop。 */
body.is-mobile:has(.workspace-drawer.is-open) .mobile-navbar,
body.is-mobile:has(.workspace-drawer.is-open) .mobile-tabbar,
body.is-mobile:has(.workspace-drawer-backdrop) .mobile-navbar,
body.is-mobile:has(.workspace-drawer-backdrop) .mobile-tabbar {
  z-index: -1 !important;
}`;
}

// 背景层承载方式：
//   - 壁纸层统一为 body::before 双伪元素（图片层 + 遮罩层，见 buildBackgroundLayerCss），
//     根层最底、不受任何子元素 z-index / isolation 遮挡；各 UI 子内容透明即透出壁纸，
//     不透明度由 body::after 遮罩（读取 token --style-tweaker-bg-opacity）控制。
//   - 原生 UI 容器的透明化 / 玻璃浮层 / 纯色覆盖规则已全部迁移到静态 CSS
//     （src/styles/appearance/overlay.css、src/styles/appearance/solid/solid.css），
//     由 styles.css 加载。图片规则以 .style-tweaker-bg-image-active 为前缀，
//     纯色规则以 .style-tweaker-bg-solid-active 为前缀；JS 只负责注入 token 变量与挂摘
//     门控类，不再拼装这些规则字符串。
