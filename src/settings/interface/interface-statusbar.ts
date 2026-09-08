import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";

// 界面子页：状态栏（默认 / 悬浮 / 固定）
export function buildStatusBarItem(_plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("interface.statusbar.name"),
    desc: t("interface.statusbar.desc"),
    items: [
      {
        name: t("interface.statusbar.style"),
        desc: t("interface.statusbar.style.desc"),
        control: {
          type: "dropdown",
          key: "statusBarStyle",
          options: {
            default: t("interface.statusbar.style.default"),
            floating: t("interface.statusbar.style.floating"),
            fixed: t("interface.statusbar.style.fixed"),
          },
        },
      },
    ],
  };
}
