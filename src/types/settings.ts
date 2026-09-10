// ============================================================
// Settings types & defaults
// ============================================================
import type { Plugin } from "obsidian";

// 背景类型：默认 / 纯色 / 图片。纯色与图片互斥，由 dropdown 选择。
export type BackgroundType = "default" | "solid" | "image";

// 彩色文件夹的彩色化类型（彩色背景 / 彩色标题 / 彩色边框 / 彩色色块）
export type ColorfulFolderMode = "background" | "title" | "border" | "tab";

// 彩色文件夹的配色方案（样式 1-6 + 自定义）
export type ColorfulFolderPalette =
  | "one"
  | "two"
  | "three"
  | "four"
  | "five"
  | "six"
  | "custom";

// recent-files 的彩色化类型：recent-files 是平铺文件列表（无文件夹层级），
// 仅需「标题色」与「行背景色块」两种（对应 file-explorer 的 title / background）。
export type RecentFilesMode = "title" | "background";

// 壁纸切换模式：manual（手动，仅命令切换）/ random（定时随机切换）/ sequence（定时顺序轮换）。
// 三种模式共用当前索引（currentIndex），手动模式下定时器不启动，仅命令可修改索引。
export type WallpaperMode = "manual" | "random" | "sequence";

// 新标签页自定义徽标默认 SVG（桌面/移动共用同一份默认；选择 code 类型时作为初始代码）
const DEFAULT_NEWTAB_LOGO_SVG = `<svg t="1764762561088" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2506" id="mx_n_1764762561089" width="200" height="200"><path d="M379.28 597.76c26.12-7.76 68.52-19.6 117.04-22.84a411.88 411.88 0 0 1-30.56-195.36c6.52-66.04 30.16-121.52 53-168.4l13.88-28.56 17.92-36.72c9.4-20 16.32-37.52 19.6-54.24 3.24-16.28 3.24-30.56-0.8-44.44-4.12-13.88-12.28-28.56-28.6-44.84a68.08 68.08 0 0 0-63.2 15.08l-211.24 190a68.48 68.48 0 0 0-22 40.8l-18 120.72a597.04 597.04 0 0 1 152.96 228.8zM217.8 424l-4.08 12.24-111.76 248.8a69.32 69.32 0 0 0 13.08 75.84l175.76 180.64a354.8 354.8 0 0 0 35.88-354A557.88 557.88 0 0 0 217.8 424z" fill="#785CF4" p-id="2507"></path><path d="M331.6 963.16l9.36 0.8c33.04 0.8 89.32 4.08 134.56 12.24 37.12 6.92 110.92 27.32 171.28 44.84 46.08 13.88 93.8-23.2 100.32-70.92 4.92-34.68 14.28-73.84 31-110.12a379.24 379.24 0 0 0-103.6-163.96 225.92 225.92 0 0 0-118.24-53.4 386.2 386.2 0 0 0-163.96 19.16 395.56 395.56 0 0 1-61.16 321.36h0.4z" fill="#785CF4" p-id="2508"></path><path d="M807.48 791.04a2299.48 2299.48 0 0 0 79.12-126.4 34.68 34.68 0 0 0-2.44-37.92 742.32 742.32 0 0 1-87.28-143.6c-23.64-56.64-26.92-144.32-27.32-186.76 0-16.28-4.88-32.2-15.08-44.84l-136.64-173.32c0 7.76-1.6 15.48-3.24 23.24a305.68 305.68 0 0 1-22.84 63.6l-18.8 39.2-13.44 26.88a447.8 447.8 0 0 0-48.12 152.92 375.6 375.6 0 0 0 34.68 191.68 271.6 271.6 0 0 1 158.24 66.08 397.6 397.6 0 0 1 103.2 149.24z" fill="#785CF4" p-id="2509"></path></svg>`;

export interface StyleTweakerSettings {
  // 背景类型：default=默认背景，solid=纯色背景，image=图片背景
  backgroundType: BackgroundType;
  // 纯色背景：按主题各选一个 flavor，取该 flavor 的 base 色作为背景底色。
  // 深色 flavors：Frappe / Macchiato / Mocha / Mocha Old；浅色 flavors：Latte / Rosé Pine。
  solidDarkFlavor: string; // 深色主题 flavor，默认 "mocha"
  solidLightFlavor: string; // 浅色主题 flavor，默认 "latte"
  // 桌面端壁纸文件夹（相对仓库根目录，留空则扫描整个仓库）
  backgroundFolder: string;
  // 移动端壁纸文件夹（相对仓库根目录，留空则扫描整个仓库）
  mobileBackgroundFolder: string;
  // 壁纸（每套独立，桌面/移动 × 深浅色）：
  //  - 各自的壁纸文件夹（相对仓库根目录，留空则扫描整个仓库）
  //  - 模式：manual（手动，仅命令切换）/ random（定时随机切换）/ sequence（定时顺序轮换）
  //  - 切换间隔（秒，random/sequence 模式使用）
  //  - 当前播放索引（持久化，重载后续播；也用于「上一个/下一个」命令定位）
  desktopWallpaperFolderDark: string;
  desktopWallpaperFolderLight: string;
  mobileWallpaperFolderDark: string;
  mobileWallpaperFolderLight: string;
  desktopWallpaperModeDark: WallpaperMode;
  desktopWallpaperModeLight: WallpaperMode;
  mobileWallpaperModeDark: WallpaperMode;
  mobileWallpaperModeLight: WallpaperMode;
  desktopWallpaperIntervalDark: number; // 秒
  desktopWallpaperIntervalLight: number; // 秒
  mobileWallpaperIntervalDark: number; // 秒
  mobileWallpaperIntervalLight: number; // 秒
  desktopWallpaperIndexDark: number;
  desktopWallpaperIndexLight: number;
  mobileWallpaperIndexDark: number;
  mobileWallpaperIndexLight: number;
  // 主题色：按深浅色各选一个 accent 预设色（同一套色板，深浅色通用），
  // 可应用于背景图片或纯色背景。default=不注入，沿用 Obsidian 原生强调色。
  themeDark: string; // 深色主题色（accent 名，如 "lavender"；default=跟随原生）
  themeLight: string; // 浅色主题色（accent 名，如 "lavender"；default=跟随原生）
  // 样式参数按「设备(桌面/移动) × 深浅色」各自独立配置：
  // 桌面端（Dark / Light 各一组）
  desktopBackgroundImageOpacityDark: number; // 0-100，桌面深色背景图不透明度（不影响正文）
  desktopBackgroundImageOpacityLight: number; // 0-100，桌面浅色背景图不透明度（不影响正文）
  desktopGlassBlurDark: number; // 桌面深色玻璃模糊半径(px)
  desktopGlassBlurLight: number; // 桌面浅色玻璃模糊半径(px)
  // 移动端（Dark / Light 各一组）
  mobileBackgroundImageOpacityDark: number; // 0-100，移动深色背景图不透明度（不影响正文）
  mobileBackgroundImageOpacityLight: number; // 0-100，移动浅色背景图不透明度（不影响正文）
  mobileGlassBlurDark: number; // 移动深色玻璃模糊半径(px)
  mobileGlassBlurLight: number; // 移动浅色玻璃模糊半径(px)
  // 活动标签高亮：活动标签的图标/标题与侧栏开合按钮用强调色高亮
  activeTabHighlight: boolean;
  // 桌面端侧栏布局
  customVaultName: string; // 自定义库名称（空则显示原始库名）
  showVaultNameInFileList: boolean; // 文件列表显示库名称
  centerVaultNameInFileList: boolean; // 文件列表库名称居中显示（依赖 showVaultNameInFileList）
  vaultNameFontSizeInFileList: number; // 文件列表库名称字号(px，依赖 showVaultNameInFileList)
  vaultNameFontInFileList: string; // 文件列表库名称字体（interface/text/monospace/custom）
  vaultNameCustomFontInFileList: string; // 自定义库名称字体名（仅上项为 custom 时生效；默认预填示例字体，清空=回退界面字体）
  vaultNameColorInFileList: string; // 文件列表库名称颜色（default=跟随主题强调色/预设色/custom=自定义色）
  vaultNameCustomColorInFileList: string; // 自定义库名称颜色 hex（仅上项为 custom 时生效；默认预填示例色，清空=回退主题强调色）
  restoreLegacySidebar: boolean; // 恢复传统侧栏布局
  // 移动端侧栏布局优化：三个开关对应 body.is-mobile.<class> 的类切换，仅移动端生效。
  mobileDrawerHeaderTop: boolean; // 移动端：将库信息与状态栏上移置顶
  mobileDrawerTabsTop: boolean; // 移动端：将标签控制区上移置顶
  mobileDrawerNavTop: boolean; // 移动端：将导航按钮上移置顶
  // 整体布局模式：default=默认 / border=边框布局 / cards=卡片布局
  layoutMode: "default" | "border" | "cards";
  // 状态栏样式：default=默认 / floating=悬浮 / fixed=固定
  statusBarStyle: "default" | "floating" | "fixed";
  // 核心插件 → 文件列表
  feAddFileIcon: boolean; // 添加文件前类型图标
  feReplaceFolderIcon: boolean; // 替换文件夹折叠箭头为文件夹图标
  feRemoveFirstLevelFolderIconDark: boolean; // 深色主题：去除第一层文件夹前图标（仅彩色边框/色块模式生效）
  feRemoveFirstLevelFolderIconLight: boolean; // 浅色主题：去除第一层文件夹前图标（仅彩色边框/色块模式生效）
  feFolderBadge: "none" | "dot" | "count"; // 文件夹名称后的徽标：无 / 圆点 / 笔记数量
  feColorfulFoldersEnabled: boolean; // 彩色文件夹总开关
  feColorfulFolderModeDark: ColorfulFolderMode; // 深色主题彩色化类型
  feColorfulFolderModeLight: ColorfulFolderMode; // 浅色主题彩色化类型
  feColorfulFolderPaletteDark: ColorfulFolderPalette; // 深色主题配色
  feColorfulFolderPaletteLight: ColorfulFolderPalette; // 浅色主题配色
  feColorfulFolderColorDark: string; // 深色主题自定义配色基色（palette === custom 时作为 --style-tweaker-fe-colorful-custom-color）
  feColorfulFolderColorLight: string; // 浅色主题自定义配色基色（palette === custom 时作为 --style-tweaker-fe-colorful-custom-color）
  // 社区插件 → Recent Files
  rfAddFileIcon: boolean; // 给 recent-files 文件列表加文件类型图标
  rfColorfulEnabled: boolean; // recent-files 彩色化总开关
  rfColorfulModeDark: RecentFilesMode; // 深色主题彩色化类型（title/background）
  rfColorfulModeLight: RecentFilesMode; // 浅色主题彩色化类型（title/background）
  rfColorfulPaletteDark: ColorfulFolderPalette; // 深色主题配色（1-6 + 自定义）
  rfColorfulPaletteLight: ColorfulFolderPalette; // 浅色主题配色（1-6 + 自定义）
  rfColorfulColorDark: string; // 深色主题自定义配色基色（palette === custom 时作为 --style-tweaker-rf-colorful-custom-color）
  rfColorfulColorLight: string; // 浅色主题自定义配色基色
  // 编辑器背景（网格/点阵图案，独立于界面背景）
  editorBgType: "none" | "grid-1" | "grid-2" | "dotted-1" | "dotted-2"; // 编辑器背景图案类型
  // 图案统一颜色：网格/点阵、深色/浅色均使用同一颜色（Hex，默认 #c7c7c7）。
  // 透明度在 CSS 中按深浅色写死，不在此配置：
  //   - 网格(grid-1/grid-2)：浅色 alpha 25% / 深色 alpha 12%
  //   - 点阵(dotted-1/dotted-2)：浅色 alpha 50% / 深色 alpha 12%
  editorBgColor: string; // 图案统一颜色（Hex，默认 #c7c7c7）
  // 各类型间距固定为默认值（CSS 中写死）：网格单层 20px、网格双层细格 15px、
  // 点阵单点 22px、点阵交错 30px，不提供自定义。
  editorBgScroll: boolean; // 图案是否跟随内容滚动（true=跟随，false=固定）
  // 所在行高亮（总开关 + 三个独立子开关）
  activeLineEnabled: boolean; // 总开关
  activeLineColor: string; // 高亮颜色（空=主题色 --text-accent）
  activeLineGutter: boolean; // 行号高亮
  activeLineBorder: boolean; // 左侧边框高亮
  activeLineBg: boolean; // 背景高亮
  activeLineFocused: number; // 聚焦时背景强度 0-100
  activeLineUnfocused: number; // 失焦时背景强度 0-100
  // 页面内标题样式（inline title）
  inlineTitleEnabled: boolean; // 是否启用页面内标题样式
  inlineTitleAlign: "left" | "center" | "right"; // 页面内标题对齐
  inlineTitleUnderline: "none" | "long" | "short"; // 下划线：无 / 长下划线 / 短下划线
  inlineTitleUnderlineStyle: "solid" | "dashed" | "double"; // 长下划线线型：实线/虚线/双线（宽度按线型固定：实/虚 2px、双线 4px）
  inlineTitleColorEnabled: boolean; // 是否允许自定义页面内标题颜色（关闭时仅使用主题色）
  inlineTitleColor: string; // 页面内标题与下划线颜色（仅当 inlineTitleColorEnabled 开启时生效）
  // 属性区域样式：分栏布局为总开关，开启后桌面端 / 移动端各自设置栏数，
  // 两端以 body:not(.is-mobile) / body.is-mobile 限定生效范围，互不影响。
  // 键名与设置页 locale 命名空间 editor.properties.* 保持一致（Obsidian DOM 侧的
  // .metadata-* 类名差异只体现在 CSS 层，见 editor-properties-service）。
  propertiesColumnLayout: boolean; // 属性分栏布局总开关（关闭时两端均不生效）
  desktopPropertiesColumnCount: number; // 桌面端分栏数 1-6（仅总开关开启时生效）
  mobilePropertiesColumnCount: number; // 移动端分栏数 1-6（仅总开关开启时生效）
  // 章节标题样式
  headingHover: boolean; // 悬停章节标题时显示 H1–H6 级别徽标
  headingCustomColors: boolean; // 是否启用自定义章节标题颜色
  headingH1: string; // H1 颜色（空=主题色 --text-accent）
  headingH2: string;
  headingH3: string;
  headingH4: string;
  headingH5: string;
  headingH6: string;
  // 文本装饰样式
  textDecorationCustom: boolean; // 是否启用自定义文本装饰颜色
  textBoldColor: string; // 加粗颜色（空=主题色 --text-accent）
  textItalicColor: string; // 斜体颜色（空=主题色 --text-accent）
  textItalicBoldColor: string; // 斜体加粗颜色（空=主题色 --text-accent）
  textUnderlineColor: string; // 下划线颜色（空=主题色 --text-accent）
  textStrikethroughColor: string; // 删除线颜色（空=主题色 --text-accent）
  textHighlightColor: string; // 高亮背景颜色（空=主题色 --text-accent）
  // 内联代码样式
  inlineCodeStyle: boolean; // 是否启用增强样式（圆角/边框/阴影）
  inlineCodeCustom: boolean; // 是否启用自定义内联代码颜色
  inlineCodeColor: string; // 内联代码颜色（空=主题色 --text-accent）
  // 代码块样式
  codeBlockLineNumbers: boolean; // 是否在编辑模式代码块显示行号
  codeBlockShowLang: boolean; // 是否在代码块右上角显示语言标签
  codeBlockCustomRadius: boolean; // true=启用自定义代码块圆角
  codeBlockRadius: number; // 代码块圆角大小（px，4-16）
  // 分隔线样式
  hrStyle: "default" | "icon" | "no-icon"; // 分隔线样式：默认/带图标/无图标渐变
  hrCenterIcon: string; // 分隔线中间图标（仅带图标样式生效，默认 ⚡️）
  hrIconRotate: number; // 图标旋转角度（deg，仅带图标样式生效）
  // 块引用样式
  blockquoteStyle:
    | "default"
    | "accent-fill"
    | "quotation-mark"; // 块引用样式
  blockquoteCustom: boolean; // 是否允许自定义块引用颜色
  blockquoteTextColor: string; // 文字颜色（空=主题强调色）
  blockquoteBorderColor: string; // 边框颜色（空=主题强调色）
  // 链接样式
  linkInternalColor: string; // 内部链接颜色（空=主题强调色）
  linkExternalColor: string; // 外部链接颜色（空=主题强调色）
  linkUnderlineInternal: boolean; // true=去除内部链接下划线
  linkUnderlineUnresolved: boolean; // true=去除未创建链接下划线
  linkUnderlineExternal: boolean; // true=去除外部链接下划线
  linkRemoveExternalIcon: boolean; // true=去除外部链接图标
  linkColorfulAnimation: boolean; // true=内部/外部链接悬浮彩色动画
  // 嵌入样式
  embedImageCenter: boolean; // true=图片居中
  embedMarkdownSeamless: boolean; // true=无缝嵌入（去边框/标题/链接）
  embedImageBorder: boolean; // true=图片加边框与阴影
  embedImageCustomRadius: boolean; // true=启用自定义嵌入图片圆角
  embedImageRadius: number; // 嵌入图片圆角大小（px，4-16）

  // 表格样式
  tableStyle: string; // 风格：default / one / two / three / academia（学术三线表）
  tableShowBorder: boolean; // true=显示单元格边框
  tableFullWidth: boolean; // true=表格占满容器宽度
  tableLineNumbers: boolean; // true=首列前显示行号
  // 标注样式
  calloutStyle: string; // 风格：default / accent-bar / sleek / split / outline / minimal / soft
  calloutCustomRadius: boolean; // true=启用自定义标注圆角
  calloutRadius: number; // 标注圆角大小（px，4-16）
  // 列表样式
  // 注意：源代码/实时预览模式始终用主题强调色，仅阅读模式使用下列自定义色。
  listCustomColors: boolean; // true=阅读模式使用下列自定义颜色（否则用主题强调色）
  listUlIndentColor: string; // 无序列表缩进辅助线颜色（空=主题强调色）
  listOlIndentColor: string; // 有序列表缩进辅助线颜色（空=主题强调色）
  listBulletColor: string; // 无序列表项目符号颜色（空=主题强调色）
  listNumberColor: string; // 有序列表数字颜色（空=主题强调色）
  listUlActiveIndentColor: string; // 无序列表当前行缩进辅助线颜色（仅源码/预览；空=跟随缩进线颜色）
  listOlActiveIndentColor: string; // 有序列表当前行缩进辅助线颜色（仅源码/预览；空=跟随缩进线颜色）
  // 任务样式
  taskCustomColors: boolean; // true=任务使用下列自定义颜色（否则用主题强调色）
  taskIndentColor: string; // 任务列表缩进辅助线颜色（空=主题强调色）
  taskActiveIndentColor: string; // 任务当前行缩进辅助线颜色（仅源码/预览；空=跟随缩进线颜色）
  taskCheckboxColor: string; // 任务复选框颜色（空=主题强调色）
  taskRemoveStrikethrough: boolean; // true=已完成任务不显示删除线
  // 标签样式
  tagDisableTextClick: boolean; // true=取消实时预览点击标签文本跳转（保留 # 号点击）
  tagStyle: string; // 标签样式：default / custom / rainbow
  tagColor: string; // 自定义标签颜色（空=主题强调色，仅 tagStyle=custom 生效）

  // ---- 新标签页（home tab）----
  // 总开关：开启后在 Obsidian 空标签页注入徽标 + 标题 + 粒子特效（桌面/移动共用）。
  newTabEnabled: boolean;
  // ======== 桌面端 ========
  // 徽标
  desktopNewTabLogoType: "none" | "default" | "icon" | "code" | "image"; // 徽标类型：无 / 默认 / 图标 / 代码 / 图片
  desktopNewTabLogoBuiltin: string; // 内置 lucide 图标名（仅 icon 生效）
  desktopNewTabLogoBuiltinCustomColor: boolean; // 自定义徽标颜色开关（开启后才显示颜色设置项）
  desktopNewTabLogoBuiltinColor: string; // 徽标颜色（仅开关开启时生效；default=主题色，或 14 个 theme.color 之一）
  desktopNewTabLogoSvg: string; // 自定义矢量图标 svg 代码（仅 code 生效）
  desktopNewTabLogoImageFolder: string; // 徽标图片文件夹（相对仓库根目录，留空则不显示可选图片）
  desktopNewTabLogoImageIndex: number; // 本地图片在文件夹图池中的索引（仅 image 生效）
  desktopNewTabLogoScale: number; // 徽标缩放：徽标相对标题字号的倍数（0.3-3.0，默认 1.5）
  desktopNewTabLogoPosition: "top" | "bottom" | "left" | "right"; // 徽标位置
  desktopNewTabLogoMargin: number; // 徽标四周留白（0-50，默认 12）
  // 标题
  desktopNewTabTitleType: "none" | "default" | "custom"; // 标题类型：无 / 默认 / 自定义
  desktopNewTabTitleText: string; // 自定义标题文本（仅 custom 生效）
  desktopNewTabTitleFont: "interface" | "text" | "monospace"; // 标题字体
  desktopNewTabTitleFontSize: number; // 标题字号（px）
  desktopNewTabTitleCustomColor: boolean; // 自定义标题颜色开关（开启后才显示标题颜色设置项）
  desktopNewTabTitleColor: string; // 标题颜色（仅开关开启时生效；default=主题色，或 14 个 theme.color 之一）
  // 粒子特效
  desktopNewTabParticleEnabled: boolean; // 粒子特效总开关（开启后显示画布/外观/交互三组）
  //  画布
  desktopNewTabParticleCanvasScale: number; // 画布倍率：粒子画布相对原始徽标/标题区域的缩放（1-3，默认 1.9）
  desktopNewTabParticleRadius: number; // 粒子半径（单个粒子的半径，px）
  desktopNewTabParticleSpacing: number; // 粒子间距：采样点阵间距，越小越密集
  //  外观
  desktopNewTabParticleCustomColor: boolean; // 粒子颜色开关（关闭则徽标用徽标默认色、标题用标题色）
  desktopNewTabParticleLogoColor: string; // 徽标粒子颜色（default=跟随主题，或 14 个 theme.color 之一）
  desktopNewTabParticleTitleColor: string; // 标题粒子颜色（default=跟随主题，或 14 个 theme.color 之一）
  desktopNewTabParticleMotion:
    | "none"
    | "float"
    | "undulate"
    | "wave"
    | "ripple"
    | "heartbeat"
    | "breathe"; // 粒子律动：静止/整体浮动/错落浮动/波浪/涟漪/心跳/呼吸
  //  交互
  desktopNewTabParticleDisturbRadius: number; // 扰动半径：光标扰动范围（px）
  desktopNewTabParticleDisturbStrength: number; // 扰动强度：光标把粒子推开/拉近的力度
  // ======== 移动端 ========
  // 徽标
  mobileNewTabLogoType: "none" | "default" | "icon" | "code" | "image";
  mobileNewTabLogoBuiltin: string;
  mobileNewTabLogoBuiltinCustomColor: boolean;
  mobileNewTabLogoBuiltinColor: string;
  mobileNewTabLogoSvg: string;
  mobileNewTabLogoImageFolder: string;
  mobileNewTabLogoImageIndex: number;
  mobileNewTabLogoScale: number;
  mobileNewTabLogoPosition: "top" | "bottom" | "left" | "right";
  mobileNewTabLogoMargin: number;
  // 标题
  mobileNewTabTitleType: "none" | "default" | "custom";
  mobileNewTabTitleText: string;
  mobileNewTabTitleFont: "interface" | "text" | "monospace";
  mobileNewTabTitleFontSize: number;
  mobileNewTabTitleCustomColor: boolean;
  mobileNewTabTitleColor: string;
  // 粒子特效
  mobileNewTabParticleEnabled: boolean;
  mobileNewTabParticleCanvasScale: number;
  mobileNewTabParticleRadius: number;
  mobileNewTabParticleSpacing: number;
  mobileNewTabParticleCustomColor: boolean;
  mobileNewTabParticleLogoColor: string;
  mobileNewTabParticleTitleColor: string;
  mobileNewTabParticleMotion:
    | "none"
    | "float"
    | "undulate"
    | "wave"
    | "ripple"
    | "heartbeat"
    | "breathe";
  mobileNewTabParticleDisturbRadius: number;
  mobileNewTabParticleDisturbStrength: number;
}

// 新标签页平台视图：把 desktop/mobile 两套键投影成"当前生效平台"的简写字段（newTabXxx）。
// 这样 newtab-service 内部可用同一套字段名读写，运行层根据当前平台（Platform.isMobile）
// 自动落在 desktop 或 mobile 键上；总开关 newTabEnabled 全局不变。
export type NewTabSettingsView = Pick<StyleTweakerSettings, "newTabEnabled"> & {
  newTabLogoType: StyleTweakerSettings["desktopNewTabLogoType"];
  newTabLogoBuiltin: string;
  newTabLogoBuiltinCustomColor: boolean;
  newTabLogoBuiltinColor: string;
  newTabLogoSvg: string;
  newTabLogoImageFolder: string;
  newTabLogoImageIndex: number;
  newTabLogoScale: number;
  newTabLogoPosition: StyleTweakerSettings["desktopNewTabLogoPosition"];
  newTabLogoMargin: number;
  newTabTitleType: StyleTweakerSettings["desktopNewTabTitleType"];
  newTabTitleText: string;
  newTabTitleFont: StyleTweakerSettings["desktopNewTabTitleFont"];
  newTabTitleFontSize: number;
  newTabTitleCustomColor: boolean;
  newTabTitleColor: string;
  newTabParticleEnabled: boolean;
  newTabParticleCanvasScale: number;
  newTabParticleRadius: number;
  newTabParticleSpacing: number;
  newTabParticleCustomColor: boolean;
  newTabParticleLogoColor: string;
  newTabParticleTitleColor: string;
  newTabParticleMotion: StyleTweakerSettings["desktopNewTabParticleMotion"];
  newTabParticleDisturbRadius: number;
  newTabParticleDisturbStrength: number;
};

/**
 * 把完整设置按当前平台投影成新标签页视图（mobile=true 取 mobileNewTab*，否则 desktopNewTab*）。
 * 供 NewTabService 使用；设置面板的桌面/移动分组各自直接读写 desktop/mobile 原键，不经过此投影。
 */
export function resolveNewTabSettingsView(
  s: StyleTweakerSettings,
  isMobile: boolean,
): NewTabSettingsView {
  const p = isMobile ? "mobile" : "desktop";
  const src = s as unknown as Record<string, unknown>;
  const v = (name: string): unknown => src[`${p}NewTab${name}`];
  return {
    newTabEnabled: s.newTabEnabled,
    newTabLogoType: v("LogoType") as NewTabSettingsView["newTabLogoType"],
    newTabLogoBuiltin: v("LogoBuiltin") as string,
    newTabLogoBuiltinCustomColor: v("LogoBuiltinCustomColor") as boolean,
    newTabLogoBuiltinColor: v("LogoBuiltinColor") as string,
    newTabLogoSvg: v("LogoSvg") as string,
    newTabLogoImageFolder: v("LogoImageFolder") as string,
    newTabLogoImageIndex: v("LogoImageIndex") as number,
    newTabLogoScale: v("LogoScale") as number,
    newTabLogoPosition: v("LogoPosition") as NewTabSettingsView["newTabLogoPosition"],
    newTabLogoMargin: v("LogoMargin") as number,
    newTabTitleType: v("TitleType") as NewTabSettingsView["newTabTitleType"],
    newTabTitleText: v("TitleText") as string,
    newTabTitleFont: v("TitleFont") as NewTabSettingsView["newTabTitleFont"],
    newTabTitleFontSize: v("TitleFontSize") as number,
    newTabTitleCustomColor: v("TitleCustomColor") as boolean,
    newTabTitleColor: v("TitleColor") as string,
    newTabParticleEnabled: v("ParticleEnabled") as boolean,
    newTabParticleCanvasScale: v("ParticleCanvasScale") as number,
    newTabParticleRadius: v("ParticleRadius") as number,
    newTabParticleSpacing: v("ParticleSpacing") as number,
    newTabParticleCustomColor: v("ParticleCustomColor") as boolean,
    newTabParticleLogoColor: v("ParticleLogoColor") as string,
    newTabParticleTitleColor: v("ParticleTitleColor") as string,
    newTabParticleMotion: v("ParticleMotion") as NewTabSettingsView["newTabParticleMotion"],
    newTabParticleDisturbRadius: v("ParticleDisturbRadius") as number,
    newTabParticleDisturbStrength: v("ParticleDisturbStrength") as number,
  };
}

export const DEFAULT_SETTINGS: StyleTweakerSettings = {
  backgroundType: "default",
  solidDarkFlavor: "mocha",
  solidLightFlavor: "latte",
  backgroundFolder: "",
  mobileBackgroundFolder: "",
  desktopWallpaperFolderDark: "",
  desktopWallpaperFolderLight: "",
  mobileWallpaperFolderDark: "",
  mobileWallpaperFolderLight: "",
  desktopWallpaperModeDark: "manual",
  desktopWallpaperModeLight: "manual",
  mobileWallpaperModeDark: "manual",
  mobileWallpaperModeLight: "manual",
  desktopWallpaperIntervalDark: 60,
  desktopWallpaperIntervalLight: 60,
  mobileWallpaperIntervalDark: 60,
  mobileWallpaperIntervalLight: 60,
  desktopWallpaperIndexDark: 0,
  desktopWallpaperIndexLight: 0,
  mobileWallpaperIndexDark: 0,
  mobileWallpaperIndexLight: 0,
  // 主题色默认值：深/浅色均为 default（不注入，沿用原生强调色）
  themeDark: "default",
  themeLight: "default",
  // 背景图片参数按「设备(桌面/移动) × 深浅色」各自独立配置（互不共用）：
  // 桌面端深/浅、移动端深/浅共 4 组不透明度（均 30%）与 4 组玻璃模糊（均 30px）
  desktopBackgroundImageOpacityDark: 30,
  desktopBackgroundImageOpacityLight: 30,
  desktopGlassBlurDark: 30,
  desktopGlassBlurLight: 30,
  mobileBackgroundImageOpacityDark: 30,
  mobileBackgroundImageOpacityLight: 30,
  mobileGlassBlurDark: 30,
  mobileGlassBlurLight: 30,
  activeTabHighlight: false,
  customVaultName: "",
  showVaultNameInFileList: false,
  centerVaultNameInFileList: false,
  vaultNameFontSizeInFileList: 16,
  vaultNameFontInFileList: "interface",
  // 示例值：选中「自定义」字体时预填到输入框（可整段替换或清空以回退界面字体）
  vaultNameCustomFontInFileList: "Lucida Handwriting, Segoe UI Emoji",
  vaultNameColorInFileList: "default",
  // 示例值：选中「自定义」颜色时预填（可替换或清空以回退主题强调色）
  vaultNameCustomColorInFileList: "#1296db",
  restoreLegacySidebar: false,
  mobileDrawerHeaderTop: false,
  mobileDrawerTabsTop: false,
  mobileDrawerNavTop: false,
  layoutMode: "default",
  statusBarStyle: "default",
  feAddFileIcon: false,
  feReplaceFolderIcon: false,
  feRemoveFirstLevelFolderIconDark: false,
  feRemoveFirstLevelFolderIconLight: false,
  feFolderBadge: "none",
  feColorfulFoldersEnabled: false,
  feColorfulFolderModeDark: "border",
  feColorfulFolderModeLight: "border",
  feColorfulFolderPaletteDark: "six",
  feColorfulFolderPaletteLight: "six",
  feColorfulFolderColorDark: "default",
  feColorfulFolderColorLight: "default",
  // recent-files 默认值：关闭图标、关闭彩色、title 模式、six 配色、custom 基色 default
  rfAddFileIcon: false,
  rfColorfulEnabled: false,
  rfColorfulModeDark: "title",
  rfColorfulModeLight: "title",
  rfColorfulPaletteDark: "six",
  rfColorfulPaletteLight: "six",
  rfColorfulColorDark: "default",
  rfColorfulColorLight: "default",
  // 编辑器背景默认值：关闭；统一图案颜色 #c7c7c7。
  // 各类型间距在 CSS 中写死，无需默认值。
  editorBgType: "none",
  editorBgColor: "default",
  editorBgScroll: true,
  // 所在行高亮默认值：总开关关闭；行号/背景子开关默认开启，边框高亮默认关闭
  activeLineEnabled: false,
  activeLineColor: "default",
  activeLineGutter: true,
  activeLineBorder: false,
  activeLineBg: true,
  activeLineFocused: 12,
  activeLineUnfocused: 6,
  // 文档标题默认值：关闭、左对齐、无下划线、主题色、2px 宽
  inlineTitleEnabled: false,
  inlineTitleAlign: "left",
  inlineTitleUnderline: "none",
  inlineTitleUnderlineStyle: "solid",
  inlineTitleColorEnabled: false,
  inlineTitleColor: "default",
  // 属性区域默认值：分栏总开关关闭；桌面端 2 栏、移动端 1 栏
  propertiesColumnLayout: false,
  desktopPropertiesColumnCount: 2,
  mobilePropertiesColumnCount: 1,
  // 章节标题默认值：关闭悬浮徽标、默认关闭自定义颜色
  headingHover: false,
  headingCustomColors: false,
  headingH1: "red",
  headingH2: "peach",
  headingH3: "green",
  headingH4: "teal",
  headingH5: "lavender",
  headingH6: "mauve",
  // 文本装饰默认值：关闭自定义、颜色均为空
  textDecorationCustom: false,
  textBoldColor: "default",
  textItalicColor: "default",
  textItalicBoldColor: "default",
  textUnderlineColor: "default",
  textStrikethroughColor: "default",
  textHighlightColor: "default",
  // 内联代码默认值：关闭增强样式、关闭自定义、颜色为空
  inlineCodeStyle: false,
  inlineCodeCustom: false,
  inlineCodeColor: "default",
  // 代码块默认值：均关闭
  codeBlockLineNumbers: false,
  codeBlockShowLang: false,
  codeBlockCustomRadius: false,
  codeBlockRadius: 8,
  // 分隔线默认值：默认样式、图标 ⚡️、旋转 0deg
  hrStyle: "default",
  hrCenterIcon: "⚡️",
  hrIconRotate: 0,
  // 块引用默认值：默认样式、关闭自定义、颜色均为空
  blockquoteStyle: "default",
  blockquoteCustom: false,
  blockquoteTextColor: "default",
  blockquoteBorderColor: "default",
  // 链接默认值：颜色为空（主题色）、开关类默认 false（原生行为）
  linkInternalColor: "default",
  linkExternalColor: "default",
  linkUnderlineInternal: false,
  linkUnderlineUnresolved: false,
  linkUnderlineExternal: false,
  linkRemoveExternalIcon: false,
  linkColorfulAnimation: false,
  // 嵌入默认值：开关类默认 false（原生行为）
  embedImageCenter: false,
  embedMarkdownSeamless: false,
  embedImageBorder: false,
  embedImageCustomRadius: false,
  embedImageRadius: 8,

  // 表格默认值：风格 default（不挂类），开关类默认 false（原生行为）
  tableStyle: "default",
  tableShowBorder: false,
  tableFullWidth: false,
  tableLineNumbers: false,
  // 标注默认值：风格 default（不挂类），自定义圆角默认 false（原生）
  calloutStyle: "default",
  calloutCustomRadius: false,
  calloutRadius: 8,
  // 列表默认值：关闭自定义颜色、颜色均为空（主题色）
  listCustomColors: false,
  listUlIndentColor: "default",
  listOlIndentColor: "default",
  listBulletColor: "default",
  listNumberColor: "default",
  listUlActiveIndentColor: "default",
  listOlActiveIndentColor: "default",
  // 任务默认值：关闭自定义颜色、颜色均为空（主题色）、保留删除线
  taskCustomColors: false,
  taskIndentColor: "default",
  taskActiveIndentColor: "default",
  taskCheckboxColor: "default",
  taskRemoveStrikethrough: false,
  // 标签默认值：均关闭、颜色为空（主题色）
  // 标签默认值：不禁用点击、样式默认、颜色为空（主题色）
  tagDisableTextClick: false,
  tagStyle: "default",
  tagColor: "default",
  // 新标签页默认值：关闭总开关
  newTabEnabled: false,
  // ======== 桌面端默认（徽标默认类型 = Obsidian 徽标）========
  desktopNewTabLogoType: "default",
  desktopNewTabLogoBuiltin: "feather",
  desktopNewTabLogoBuiltinCustomColor: false,
  desktopNewTabLogoBuiltinColor: "default",
  desktopNewTabLogoSvg: DEFAULT_NEWTAB_LOGO_SVG,
  desktopNewTabLogoImageFolder: "",
  desktopNewTabLogoImageIndex: -1,
  desktopNewTabLogoScale: 1.2,
  desktopNewTabLogoPosition: "top",
  desktopNewTabLogoMargin: 12,
  desktopNewTabTitleType: "default",
  desktopNewTabTitleText: "",
  desktopNewTabTitleFont: "interface",
  desktopNewTabTitleFontSize: 64,
  desktopNewTabTitleCustomColor: false,
  desktopNewTabTitleColor: "default",
  desktopNewTabParticleEnabled: false,
  desktopNewTabParticleCanvasScale: 1.9,
  desktopNewTabParticleRadius: 0.5,
  desktopNewTabParticleSpacing: 2,
  desktopNewTabParticleCustomColor: false,
  desktopNewTabParticleLogoColor: "default",
  desktopNewTabParticleTitleColor: "default",
  desktopNewTabParticleMotion: "none",
  desktopNewTabParticleDisturbRadius: 124,
  desktopNewTabParticleDisturbStrength: 1.8,
  // ======== 移动端默认（与桌面端独立）========
  mobileNewTabLogoType: "default",
  mobileNewTabLogoBuiltin: "feather",
  mobileNewTabLogoBuiltinCustomColor: false,
  mobileNewTabLogoBuiltinColor: "default",
  mobileNewTabLogoSvg: DEFAULT_NEWTAB_LOGO_SVG,
  mobileNewTabLogoImageFolder: "",
  mobileNewTabLogoImageIndex: -1,
  mobileNewTabLogoScale: 1.2,
  mobileNewTabLogoPosition: "top",
  mobileNewTabLogoMargin: 12,
  mobileNewTabTitleType: "default",
  mobileNewTabTitleText: "",
  mobileNewTabTitleFont: "interface",
  mobileNewTabTitleFontSize: 32,
  mobileNewTabTitleCustomColor: false,
  mobileNewTabTitleColor: "default",
  mobileNewTabParticleEnabled: false,
  mobileNewTabParticleCanvasScale: 1.9,
  mobileNewTabParticleRadius: 0.5,
  mobileNewTabParticleSpacing: 2,
  mobileNewTabParticleCustomColor: false,
  mobileNewTabParticleLogoColor: "default",
  mobileNewTabParticleTitleColor: "default",
  mobileNewTabParticleMotion: "none",
  mobileNewTabParticleDisturbRadius: 124,
  mobileNewTabParticleDisturbStrength: 1.8,
};

// 设置面板所需的插件类型（Plugin 实例 + 本插件额外成员）
export type SettingTabPlugin = Plugin & {
  settings: StyleTweakerSettings;
  saveSettings(): Promise<void>;
};
