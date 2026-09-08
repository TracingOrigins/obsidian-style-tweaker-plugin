import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getAccentColorOptions } from "../../utils/color-palette";

// 编辑器子页：标签（#tag 颜色与样式）
export function buildTagsItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.tag.name"),
    desc: t("editor.tag.desc"),
    items: [
      {
        name: t("editor.tag.disableTextClick"),
        desc: t("editor.tag.disableTextClick.desc"),
        control: {
          type: "toggle",
          key: "tagDisableTextClick",
        },
      },
      {
        name: t("editor.tag.style"),
        desc: t("editor.tag.style.desc"),
        control: {
          type: "dropdown",
          key: "tagStyle",
          options: {
            default: t("editor.tag.style.default"),
            custom: t("editor.tag.style.custom"),
            rainbow: t("editor.tag.style.rainbow"),
          },
        },
      },
      {
        name: t("editor.tag.color"),
        desc: t("editor.tag.color.desc"),
        visible: () => plugin.settings.tagStyle === "custom",
        control: {
          type: "dropdown",
          key: "tagColor",
          options: getAccentColorOptions(),
        },
      },
    ],
  };
}
