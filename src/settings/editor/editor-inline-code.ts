import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getAccentColorOptions } from "../../utils/color-palette";

// 编辑器子页：行内代码
export function buildInlineCodeItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.inlineCode.name"),
    desc: t("editor.inlineCode.desc"),
    items: [
      {
        name: t("editor.inlineCode.style"),
        desc: t("editor.inlineCode.style.desc"),
        control: {
          type: "toggle",
          key: "inlineCodeStyle",
        },
      },
      {
        name: t("editor.inlineCode.custom"),
        desc: t("editor.inlineCode.custom.desc"),
        control: {
          type: "toggle",
          key: "inlineCodeCustom",
        },
      },
      {
        name: t("editor.inlineCode.color"),
        desc: t("editor.inlineCode.color.desc"),
        visible: () => plugin.settings.inlineCodeCustom,
        control: {
          type: "dropdown",
          key: "inlineCodeColor",
          options: getAccentColorOptions(),
        },
      },
    ],
  };
}
