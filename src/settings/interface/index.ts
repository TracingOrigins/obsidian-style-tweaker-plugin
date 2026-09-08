import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { buildLayoutItem } from "./interface-layout";
import { buildSidebarItem } from "./interface-sidebar";
import { buildTabsItem } from "./interface-tabbar";
import { buildStatusBarItem } from "./interface-statusbar";

// ============================================================
// 顶级分组二：界面（布局 + 标签栏 + 侧边栏 + 状态栏）
// ============================================================
export function buildInterfaceSection(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("interface.name"),
    desc: t("interface.desc"),
    items: [
      buildLayoutItem(),
      buildTabsItem(plugin),
      buildSidebarItem(plugin),
      buildStatusBarItem(plugin),
    ],
  };
}
