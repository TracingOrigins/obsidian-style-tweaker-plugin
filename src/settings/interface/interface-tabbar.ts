import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";

// 界面子页：标签栏（活动标签高亮 /活动标签指示线）
export function buildTabsItem(_plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("interface.tabbar.name"),
    desc: t("interface.tabbar.desc"),
    items: [
      {
        name: t("interface.tabbar.activeTabHighlight"),
        desc: t("interface.tabbar.activeTabHighlight.desc"),
        control: { type: "toggle", key: "activeTabHighlight" },
      },
    ],
  };
}
