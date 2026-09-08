import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";

// 编辑器子页：属性区（frontmatter 多栏布局）
export function buildPropertiesItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.properties.name"),
    desc: t("editor.properties.desc"),
    items: [
      {
        name: t("editor.properties.columnLayout"),
        desc: t("editor.properties.columnLayout.desc"),
        control: {
          type: "toggle",
          key: "metadataColumnLayout",
        },
      },
      {
        name: t("editor.properties.columnCount"),
        desc: t("editor.properties.columnCount.desc"),
        visible: () => plugin.settings.metadataColumnLayout,
        control: {
          type: "slider",
          key: "metadataColumnCount",
          min: 2,
          max: 6,
          step: 1,
        },
      },
    ],
  };
}
