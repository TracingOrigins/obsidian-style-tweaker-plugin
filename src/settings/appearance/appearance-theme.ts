import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getAccentColorOptions } from "../../utils/color-palette";

// 外观子页：主题色（独立于界面背景，可应用于背景图片或纯色背景）
// 用 accent 色板下拉选择预设色，深浅色各一个，一套色板通用。
export function buildThemeItem(_plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("appearance.theme.name"),
    desc: t("appearance.theme.desc"),
    items: [
      {
        name: t("appearance.theme.dark"),
        desc: t("appearance.theme.dark.desc"),
        control: {
          type: "dropdown",
          key: "themeDark",
          options: getAccentColorOptions(),
        },
      },
      {
        name: t("appearance.theme.light"),
        desc: t("appearance.theme.light.desc"),
        control: {
          type: "dropdown",
          key: "themeLight",
          options: getAccentColorOptions(),
        },
      },
    ],
  };
}
