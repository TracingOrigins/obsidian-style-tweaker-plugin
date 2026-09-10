// ============================================================
// 系统字体族枚举（桌面端）
// ============================================================
// 供设置面板的字体选择框提供候选列表。两条来源依次尝试：
// 1) navigator.queryLocalFonts()（Local Font Access API，Chromium/Electron 提供）
//    —— 返回完整系统字体，需权限；在用户手势（点击/聚焦输入框）中调用成功率更高。
// 2) 内置常见字体清单 + canvas 宽度测量筛选 —— API 不可用或被拒时的回退，
//    只能覆盖清单内已安装的字体，但同步可得、无权限成本。
//
// 缓存策略：首次调用同步返回（让建议列表立即可用），同时后台发起异步枚举，
// 完成后替换缓存，后续输入即可看到完整系统字体列表。

/** 用于 canvas 探测的样本：拉丁字母 + 数字 + 汉字（覆盖中英文命名的字体） */
const PROBE_TEXT = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789永";

/** 探测基准字体（通用族，必然存在） */
const BASE_FAMILIES = ["monospace", "serif", "sans-serif"];

/** 回退清单：各平台常见字体，探测时只保留本机已安装的 */
const COMMON_FONTS: readonly string[] = [
  // 中文（Windows）
  "Microsoft YaHei",
  "Microsoft YaHei UI",
  "SimSun",
  "NSimSun",
  "SimHei",
  "KaiTi",
  "FangSong",
  "DengXian",
  "YouYuan",
  "LiSu",
  "Microsoft JhengHei",
  // 中文（macOS）
  "PingFang SC",
  "Hiragino Sans GB",
  "Songti SC",
  "Heiti SC",
  "STSong",
  "STKaiti",
  "STHeiti",
  "Yuanti SC",
  "Lantinghei SC",
  // 手写 / 装饰
  "Segoe Script",
  "Segoe Print",
  "Ink Free",
  "Comic Sans MS",
  "Lucida Handwriting",
  "Bradley Hand",
  "Chalkboard SE",
  "Marker Felt",
  "Noteworthy",
  "Snell Roundhand",
  "Vladimir Script",
  "Papyrus",
  // 衬线
  "Georgia",
  "Times New Roman",
  "Cambria",
  "Constantia",
  "Garamond",
  "Palatino Linotype",
  "Book Antiqua",
  "Baskerville",
  "Charter",
  // 无衬线
  "Segoe UI",
  "Segoe UI Variable",
  "Arial",
  "Helvetica",
  "Helvetica Neue",
  "Verdana",
  "Tahoma",
  "Calibri",
  "Candara",
  "Corbel",
  "Franklin Gothic Medium",
  "Trebuchet MS",
  "Century Gothic",
  "Futura",
  "Avenir",
  "Optima",
  "Gill Sans",
  "Inter",
  // 等宽
  "Consolas",
  "Courier New",
  "Cascadia Mono",
  "Cascadia Code",
  "Lucida Console",
  "Monaco",
  "Menlo",
  "SF Mono",
  "Source Code Pro",
  "JetBrains Mono",
  "Fira Code",
];

let cachedFonts: string[] | null = null;
let loadPromise: Promise<string[]> | null = null;

/** 字体族名 → CSS font-family 可用的带引号形式 */
function quoteFamily(family: string): string {
  return `"${family.replace(/"/g, "")}"`;
}

/**
 * 用 canvas 文本宽度比对判断字体是否安装：本机没有该字体时，
 * 实际渲染回落到基准字体，宽度与基准一致；有该字体则宽度不同。
 */
function detectInstalledCommonFonts(): string[] {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return [];
  return COMMON_FONTS.filter((family) => {
    const quoted = quoteFamily(family);
    return BASE_FAMILIES.some((base) => {
      ctx.font = `72px ${base}`;
      const baseWidth = ctx.measureText(PROBE_TEXT).width;
      ctx.font = `72px ${quoted}, ${base}`;
      const fontWidth = ctx.measureText(PROBE_TEXT).width;
      return Math.abs(baseWidth - fontWidth) > 0.5;
    });
  });
}

/**
 * 同步取字体列表（供建议框即时渲染）。
 * 首次调用会做一次 canvas 探测并在后台补全系统字体；列表始终非空。
 */
export function getFontFamilies(): string[] {
  if (cachedFonts) return cachedFonts;
  const detected = detectInstalledCommonFonts();
  // 一个都没探到（极端环境下 canvas 不可用）时给出完整清单，避免下拉为空
  cachedFonts = detected.length > 0 ? detected : [...COMMON_FONTS];
  void loadSystemFonts();
  return cachedFonts;
}

/**
 * 用 Local Font Access API 拉取完整系统字体（只执行一次）。
 * 不支持或权限被拒时静默保持回退清单。
 */
export function loadSystemFonts(): Promise<string[]> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const queryLocalFonts = (
        window as unknown as {
          queryLocalFonts?: () => Promise<Array<{ family?: string }>>;
        }
      ).queryLocalFonts;
      if (typeof queryLocalFonts !== "function") return cachedFonts ?? [];
      const fonts = await queryLocalFonts.call(window);
      const families = new Set<string>();
      for (const font of fonts) {
        const family = font?.family?.trim();
        if (family) families.add(family);
      }
      if (families.size > 0) {
        cachedFonts = [...families].sort((a, b) => a.localeCompare(b));
      }
      return cachedFonts ?? [];
    } catch {
      // 版本不支持 / 权限被拒：保持回退清单
      return cachedFonts ?? [];
    }
  })();
  return loadPromise;
}
