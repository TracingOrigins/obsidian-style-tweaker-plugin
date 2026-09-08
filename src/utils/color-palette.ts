// ============================================================
// accent 色板共享工具
// ------------------------------------------------------------
// 所有「颜色选项」设置项（下拉选择）统一使用本文件提供的：
//   - getAccentColorOptions 下拉选项（default + 14 个 accent 色），label 走 i18n
//   - resolveAccentCss      把色名解析为「深色系 / 浅色系」两段 CSS
//   - resolveAccentValue    把色名解析为单个 hex（不区分深浅，固定色用）
//   - accentToHex           色名 → 指定深浅色 hex
//
// 语义约定：
//   - 值 "default"（或空串）代表「不指定」，由调用方回退到主题色 / 默认值。
//   - 其余值均为 accent 色名（rosewater … lavender），映射为深浅两套 hex。
//   - 深色模式（body.theme-dark）用深色系，浅色模式（body.theme-light）用浅色系，
//     与主题色服务（ThemeColorService）保持一致，随主题自动切换。
// ============================================================

import { t } from "./i18n";

// 下拉选项：default + 14 个 accent 色。value=色名，label=翻译后的显示名。
// 键顺序即下拉显示顺序，按用户指定的顺序排列（Red → … → Lavender，default 置顶）。
export function getAccentColorOptions(): Record<string, string> {
  return {
    default: t("appearance.theme.color.default"),
    red: t("appearance.theme.color.red"),
    maroon: t("appearance.theme.color.maroon"),
    pink: t("appearance.theme.color.pink"),
    flamingo: t("appearance.theme.color.flamingo"),
    rosewater: t("appearance.theme.color.rosewater"),
    peach: t("appearance.theme.color.peach"),
    yellow: t("appearance.theme.color.yellow"),
    green: t("appearance.theme.color.green"),
    teal: t("appearance.theme.color.teal"),
    sky: t("appearance.theme.color.sky"),
    sapphire: t("appearance.theme.color.sapphire"),
    blue: t("appearance.theme.color.blue"),
    mauve: t("appearance.theme.color.mauve"),
    lavender: t("appearance.theme.color.lavender"),
  };
}

// accent 色值表（MOCHA_ACCENTS / LATTE_ACCENTS）见文件底部：统一从 FLAVORS（AnuPpuccin）推导，
// 避免此处与 FLAVORS 各维护一套、同一 flavor 的 accent 色值不一致（单一数据源）。

/**
 * 色名 → 指定深浅色的 hex。值无效（default / 空 / 未知名）时返回 null。
 * @param value 色名（如 "lavender"、"default"、""）
 * @param dark  true=深色（Mocha 系），false=浅色（Latte 系）
 */
export function accentToHex(value: string | undefined, dark: boolean): string | null {
  const name = (value ?? "").trim();
  if (!name || name === "default") return null;
  return (dark ? MOCHA_ACCENTS : LATTE_ACCENTS)[name] ?? null;
}

/**
 * 把颜色字段值解析为单个 hex 字符串。
 * - 有效色名 → 对应 hex
 * - default / 空 / 未知 → 返回 fallback（调用方传入的默认值或 CSS 变量）
 *
 * 注：本函数不区分深浅色，返回单一值；用于「固定色 / 不随主题切换」的场景
 * （如纯色背景、编辑器网格色等）。
 */
export function resolveAccentValue(
  value: string | undefined,
  fallback: string,
): string {
  const name = (value ?? "").trim();
  if (!name || name === "default") return fallback;
  // 固定色用深色系（Mocha）色值作为统一表示；如需深浅区分请用 resolveAccentCss。
  return MOCHA_ACCENTS[name] ?? LATTE_ACCENTS[name] ?? fallback;
}

/**
 * 把颜色字段值解析为「深色 / 浅色」两段 CSS（用于随主题切换的强调色场景）。
 *
 * 返回示例（value="lavender"）：
 *   body.theme-dark { --var: #B4BEFE; }
 *   body.theme-light { --var: #7287FD; }
 *
 * value 为 default / 空 / 未知时，返回单值声明：
 *   :root { --var: <fallback>; }
 *
 * @param value      设置项值（色名或 default/空）
 * @param variable   CSS 变量名（如 "--style-tweaker-active-line-color"）
 * @param fallback   未指定色时的回退值（如 "var(--color-accent)"、hex 或空串）
 */
export function resolveAccentCss(
  value: string | undefined,
  variable: string,
  fallback: string,
): string {
  const name = (value ?? "").trim();
  if (!name || name === "default") {
    return `:root {
  ${variable}: ${fallback};
}`;
  }
  const darkHex = MOCHA_ACCENTS[name] ?? null;
  const lightHex = LATTE_ACCENTS[name] ?? null;
  const darkBlock = darkHex
    ? `body.theme-dark {
  ${variable}: ${darkHex};
}`
    : "";
  const lightBlock = lightHex
    ? `body.theme-light {
  ${variable}: ${lightHex};
}`
    : "";
  // 色名在两张表中都无匹配时（理论上不会发生），回退 fallback
  if (!darkBlock && !lightBlock) {
    return `:root {
  ${variable}: ${fallback};
}`;
  }
  return `${darkBlock}\n${lightBlock}`;
}

// ============================================================
// flavor 色板（用于纯色背景）
// ------------------------------------------------------------
//   - 深色 flavors：Frappe / Macchiato / Mocha / Mocha Old
//   - 浅色 flavors：Latte / Rosé Pine
// 纯色背景选中 flavor 后，取该 flavor 的 base 色作为背景底色。
// ============================================================

// 深色 flavor 下拉选项（value=flavor 名，label=i18n 显示名）
export function getDarkFlavorOptions(): Record<string, string> {
  return {
    frappe: t("appearance.background.solid.flavor.frappe"),
    macchiato: t("appearance.background.solid.flavor.macchiato"),
    mocha: t("appearance.background.solid.flavor.mocha"),
    "mocha-old": t("appearance.background.solid.flavor.mochaOld"),
  };
}

// 浅色 flavor 下拉选项
export function getLightFlavorOptions(): Record<string, string> {
  return {
    latte: t("appearance.background.solid.flavor.latte"),
    "rosepine-light": t("appearance.background.solid.flavor.rosepineLight"),
  };
}

// 深色 flavor 的 base 色
const DARK_FLAVOR_BASE: Record<string, string> = {
  frappe: "#303446",
  macchiato: "#24273A",
  mocha: "#1E1E2E",
  "mocha-old": "#1E1E2E",
};

// 浅色 flavor 的 base 色
const LIGHT_FLAVOR_BASE: Record<string, string> = {
  latte: "#EFF1F5",
  "rosepine-light": "#EEE6DD",
};

/**
 * flavor 名 → base 色 hex。值无效（default / 空 / 未知名）时返回 null。
 * @param value flavor 名（如 "mocha"、"latte"、"default"、""）
 * @param dark  true=深色 flavors，false=浅色 flavors
 */
export function flavorToHex(value: string | undefined, dark: boolean): string | null {
  const name = (value ?? "").trim();
  if (!name || name === "default") return null;
  return (dark ? DARK_FLAVOR_BASE : LIGHT_FLAVOR_BASE)[name] ?? null;
}

// ============================================================
// 完整 flavor 色板（27 色）+ 完整界面配色 CSS
// ------------------------------------------------------------
// 每个 flavor 定义一套完整配色（14 个 accent + 13 个中性色 = 27 色），
// 并映射到 Obsidian 全局变量，使整个界面随所选 flavor 变色（背景/文字/边框/交互/强调等）。
// 仅纯色背景模式下生效（配合 style-tweaker-bg-solid-active 门控类）。
// ============================================================

/** 单个 flavor 的 27 色色板。 */
export interface FlavorColors {
  rosewater: string;
  flamingo: string;
  pink: string;
  mauve: string;
  red: string;
  maroon: string;
  peach: string;
  yellow: string;
  green: string;
  teal: string;
  sky: string;
  sapphire: string;
  blue: string;
  lavender: string;
  text: string;
  subtext1: string;
  subtext0: string;
  overlay2: string;
  overlay1: string;
  overlay0: string;
  surface2: string;
  surface1: string;
  surface0: string;
  base: string;
  mantle: string;
  crust: string;
}

/** flavor 完整色板。 */
export const FLAVORS: Record<string, { mode: "dark" | "light"; colors: FlavorColors }> = {
  mocha: {
    mode: "dark",
    colors: {
      rosewater: "#F5E0DC", flamingo: "#F2CDCD", pink: "#F5C2E7", mauve: "#CBA6F7",
      red: "#F38BA8", maroon: "#EBA0AC", peach: "#FAB387", yellow: "#F9E2AF",
      green: "#A6E3A1", teal: "#94E2D5", sky: "#89DCEB", sapphire: "#74C7EC",
      blue: "#87B0F9", lavender: "#B4BEFE",
      text: "#C6D0F5", subtext1: "#B3BCDF", subtext0: "#A1A8C9",
      overlay2: "#8E95B3", overlay1: "#7B819D", overlay0: "#696D86",
      surface2: "#565970", surface1: "#43465A", surface0: "#313244",
      base: "#1E1E2E", mantle: "#181825", crust: "#11111B",
    },
  },
  macchiato: {
    mode: "dark",
    colors: {
      rosewater: "#F4DBD6", flamingo: "#F0C6C6", pink: "#F5BDE6", mauve: "#C6A0F6",
      red: "#ED8796", maroon: "#EE99A0", peach: "#F5A97F", yellow: "#EED49F",
      green: "#A6DA95", teal: "#8BD5CA", sky: "#91D7E3", sapphire: "#7DC4E4",
      blue: "#8AADF4", lavender: "#B7BDF8",
      text: "#C5CFF5", subtext1: "#B3BCE0", subtext0: "#A1AACB",
      overlay2: "#8F97B7", overlay1: "#7D84A2", overlay0: "#6C728D",
      surface2: "#5A5F78", surface1: "#484C64", surface0: "#363A4F",
      base: "#24273A", mantle: "#1E2030", crust: "#181926",
    },
  },
  frappe: {
    mode: "dark",
    colors: {
      rosewater: "#F2D5CF", flamingo: "#EEBEBE", pink: "#F4B8E4", mauve: "#CA9EE6",
      red: "#E78284", maroon: "#EA999C", peach: "#EF9F76", yellow: "#E5C890",
      green: "#A6D189", teal: "#81C8BE", sky: "#99D1DB", sapphire: "#85C1DC",
      blue: "#8CAAEE", lavender: "#BABBF1",
      text: "#C6CEEF", subtext1: "#B5BDDC", subtext0: "#A5ACC9",
      overlay2: "#949BB7", overlay1: "#838AA4", overlay0: "#737891",
      surface2: "#62677E", surface1: "#51566C", surface0: "#414559",
      base: "#303446", mantle: "#292C3C", crust: "#232634",
    },
  },
  "mocha-old": {
    mode: "dark",
    colors: {
      rosewater: "#F5E0DC", flamingo: "#F2CDCD", pink: "#F5C2E7", mauve: "#CBA6F7",
      red: "#F38BA8", maroon: "#EBA0AC", peach: "#FAB387", yellow: "#F9E2AF",
      green: "#A6E3A1", teal: "#94E2D5", sky: "#89DCEB", sapphire: "#74C7EC",
      blue: "#87B0F9", lavender: "#B4BEFE",
      text: "#D9E0EE", subtext1: "#D3CDD6", subtext0: "#BEB3C1",
      overlay2: "#A79CB0", overlay1: "#988BA2", overlay0: "#6D6B7D",
      surface2: "#575269", surface1: "#2D2848", surface0: "#302D41",
      base: "#1E1E2E", mantle: "#1A1826", crust: "#161320",
    },
  },
  latte: {
    mode: "light",
    colors: {
      rosewater: "#DE9584", flamingo: "#DD7878", pink: "#EC83D0", mauve: "#8839EF",
      red: "#D20F39", maroon: "#E64553", peach: "#FE640B", yellow: "#E49320",
      green: "#40A02B", teal: "#179299", sky: "#04A5E5", sapphire: "#209FB5",
      blue: "#2A6EF5", lavender: "#7287FD",
      text: "#4C4F69", subtext1: "#5C5F77", subtext0: "#6C6F85",
      overlay2: "#7C7F93", overlay1: "#8C8FA1", overlay0: "#9CA0B0",
      surface2: "#ACB0BE", surface1: "#BCC0CC", surface0: "#CCD0DA",
      base: "#EFF1F5", mantle: "#E6E9EF", crust: "#DCE0E8",
    },
  },
  "rosepine-light": {
    mode: "light",
    colors: {
      rosewater: "#D6817D", flamingo: "#D6817D", pink: "#907AA9", mauve: "#907AA9",
      red: "#B4637A", maroon: "#B4637A", peach: "#D6817D", yellow: "#EA9D34",
      green: "#56949F", teal: "#56949F", sky: "#286983", sapphire: "#286983",
      blue: "#286983", lavender: "#907AA9",
      text: "#575279", subtext1: "#615C84", subtext0: "#797593",
      overlay2: "#807C99", overlay1: "#9893A5", overlay0: "#A19CAD",
      surface2: "#CAC1B9", surface1: "#D1C9C2", surface0: "#DCD3CB",
      base: "#EEE6DD", mantle: "#E6DBD1", crust: "#DDD0C6",
    },
  },
};

// ============================================================
// accent 色值表（单一数据源）：从 FLAVORS（AnuPpuccin）推导，
// 避免与 FLAVORS 各维护一套、同一 flavor 的 accent 色值不一致。
//   深色系 → MOCHA_ACCENTS，浅色系 → LATTE_ACCENTS
// ------------------------------------------------------------
/** 14 个 accent 色名（从 FlavorColors 提取 accent 子集用）。 */
const ACCENT_KEYS = [
  "rosewater",
  "flamingo",
  "pink",
  "mauve",
  "red",
  "maroon",
  "peach",
  "yellow",
  "green",
  "teal",
  "sky",
  "sapphire",
  "blue",
  "lavender",
] as const;

type AccentKey = (typeof ACCENT_KEYS)[number];

/** 从 flavor 颜色表提取 accent 子集。 */
function pickAccent(colors: FlavorColors): Record<AccentKey, string> {
  const out = {} as Record<AccentKey, string>;
  for (const k of ACCENT_KEYS) out[k] = colors[k];
  return out;
}

/** 深色系（Mocha）accent 色值表。 */
export const MOCHA_ACCENTS: Record<string, string> = pickAccent(FLAVORS.mocha.colors);

/** 浅色系（Latte）accent 色值表。 */
export const LATTE_ACCENTS: Record<string, string> = pickAccent(FLAVORS.latte.colors);

/** hex → "r g b" 三元组（Obsidian 部分 -rgb 变量需要）。 */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/**
 * 根据选中的 flavor 生成「完整界面配色」CSS（映射到 Obsidian 全局变量）。
 * 仅需在纯色背景门控类下生效。
 *
 * @param flavor flavor 名（"mocha" / "latte" 等）
 * @param gating 门控选择器前缀，如 "body.theme-dark.style-tweaker-bg-solid-active"
 * @returns 一段 CSS，或 flavor 无效时返回空串
 */
/** 完整 `--style-tweaker-*` 变量名顺序。 */
const PALETTE_ORDER = [
  "rosewater", "flamingo", "pink", "mauve", "red", "maroon", "peach", "yellow",
  "green", "teal", "sky", "sapphire", "blue", "lavender", "text", "subtext1",
  "subtext0", "overlay2", "overlay1", "overlay0", "surface2", "surface1",
  "surface0", "base", "mantle", "crust",
] as const;

/**
 * 生成某个 flavor 的完整 `--style-tweaker-*` 变量声明块（RGB 三元组，不含 gating 包裹）。
 * 布局 CSS（border/cards）及任何需要这些配色的规则可直接引用 var(--style-tweaker-*)。
 */
function buildFlavorVars(f: { colors: FlavorColors }): string {
  return PALETTE_ORDER.map((k) => `  --style-tweaker-${k}: ${hexToRgb(f.colors[k])};`).join("\n");
}

/**
 * 仅注入 flavor 的 `--style-tweaker-*` 变量（包裹在 gating 选择器下）。
 * 用于 ThemeFlavorService：让这些变量在默认/纯色背景下都存在（深色默认 mocha、浅色默认 latte），
 * 从而 border/cards 布局不依赖纯色背景也能正常工作。
 */
export function buildFlavorVarsCss(flavor: string | undefined, gating: string): string {
  const f = FLAVORS[(flavor ?? "").trim()];
  if (!f) return "";
  return `${gating} {\n${buildFlavorVars(f)}\n}`;
}

export function buildFlavorCss(flavor: string | undefined, gating: string): string {
  const f = FLAVORS[(flavor ?? "").trim()];
  if (!f) return "";
  const c = f.colors;

  const flavorVars = buildFlavorVars(f);

  // 中性色做基础变量映射（背景/文字/边框/交互/选中）
  const vars = [
    ["--color-base-00", c.crust],
    ["--color-base-10", c.mantle],
    ["--color-base-20", c.base],
    ["--color-base-25", c.surface0],
    ["--color-base-30", c.surface1],
    ["--color-base-35", c.surface2],
    ["--color-base-40", c.overlay0],
    ["--color-base-50", c.overlay1],
    ["--color-base-60", c.overlay2],
    ["--color-base-70", c.subtext0],
    ["--color-base-100", c.text],
    ["--text-normal", c.text],
    ["--text-muted", c.overlay2],
    ["--text-faint", c.subtext0],
    ["--text-on-accent", c.base],
    ["--background-primary", c.base],
    ["--background-primary-alt", c.mantle],
    ["--background-secondary", c.mantle],
    ["--background-secondary-alt", c.crust],
    ["--interactive-normal", c.surface0],
    ["--interactive-hover", c.surface1],
    ["--background-modifier-border", f.mode === "dark" ? c.surface0 : c.surface1],
    ["--background-modifier-border-hover", f.mode === "dark" ? c.surface1 : c.surface2],
    ["--background-modifier-border-focus", f.mode === "dark" ? c.surface2 : c.overlay0],
    ["--blockquote-background-color", `rgba(${hexToRgb(c.crust)}, 0.5)`],
    ["--text-error", c.red],
    ["--text-success", c.green],
  ]
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");

  // 注意：accent（--color-accent 等）统一由 ThemeColorService 管理，此处不注入，
  // 以免 flavor 的默认 accent 覆盖用户设置的主题色（见 theme-color-service.ts）。
  return `${gating} {\n${flavorVars}\n${vars}\n}`;
}

/**
 * 返回指定 flavor 的主强调色（lavender）hex，供 ThemeColorService 在主题色为
 * default 且纯色模式时作为默认 accent 使用。
 */
export function getFlavorAccentHex(flavor: string | undefined): string | null {
  const f = FLAVORS[(flavor ?? "").trim()];
  return f ? f.colors.lavender : null;
}
