import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { buildBackgroundItem } from "./appearance-background";
import { buildThemeItem } from "./appearance-theme";

// ============================================================
// 顶级分组一：外观（界面背景 + 主题色）
// ============================================================

export function buildAppearanceSection(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("appearance.name"),
    desc: t("appearance.desc"),
    items: [
      buildBackgroundItem(plugin),
      buildThemeItem(plugin),
    ],
  };
}
