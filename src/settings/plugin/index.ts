import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { buildCorePluginsGroup } from "./plugin-core";
import { buildCommunityPluginsGroup } from "./plugin-community";

// ============================================================
// 顶级分组五：插件（核心插件 + 社区插件）
// ============================================================
export function buildPluginsSection(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("plugins.name"),
    desc: t("plugins.desc"),
    items: [
      buildCorePluginsGroup(plugin),
      buildCommunityPluginsGroup(plugin),
    ],
  };
}
