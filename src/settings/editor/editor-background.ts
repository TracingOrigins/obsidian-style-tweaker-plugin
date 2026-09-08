import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getAccentColorOptions } from "../../utils/color-palette";

// 编辑器子页：背景（编辑区网格/点阵图案）
export function buildBackgroundItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.background.name"),
    desc: t("editor.background.desc"),
    items: [
      {
        name: t("editor.background.type"),
        desc: t("editor.background.type.desc"),
        control: {
          type: "dropdown",
          key: "editorBgType",
          options: {
            none: t("editor.background.type.none"),
            "grid-1": t("editor.background.type.grid1"),
            "grid-2": t("editor.background.type.grid2"),
            "dotted-1": t("editor.background.type.dotted1"),
            "dotted-2": t("editor.background.type.dotted2"),
          },
        },
      },
      {
        // 图案统一颜色：网格/点阵、深色/浅色均使用同一颜色。透明度与各类型间距在 CSS 中写死，不在此配置。
        name: t("editor.background.patternColor"),
        desc: t("editor.background.patternColor.desc"),
        visible: () => plugin.settings.editorBgType !== "none",
        control: { type: "dropdown", key: "editorBgColor", options: getAccentColorOptions() },
      },
      {
        name: t("editor.background.scroll"),
        desc: t("editor.background.scroll.desc"),
        visible: () => plugin.settings.editorBgType !== "none",
        control: {
          type: "toggle",
          key: "editorBgScroll",
        },
      },
    ],
  };
}
