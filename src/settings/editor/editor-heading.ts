import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getAccentColorOptions } from "../../utils/color-palette";

// 编辑器子页：标题（H1–H6 颜色与悬停徽标）
export function buildHeadingsItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.heading.name"),
    desc: t("editor.heading.desc"),
    items: [
      {
        name: t("editor.heading.hover"),
        desc: t("editor.heading.hover.desc"),
        control: {
          type: "toggle",
          key: "headingHover",
        },
      },
      {
        name: t("editor.heading.customColors"),
        desc: t("editor.heading.customColors.desc"),
        control: {
          type: "toggle",
          key: "headingCustomColors",
        },
      },
      ...(["H1", "H2", "H3", "H4", "H5", "H6"] as const).map(
        (lvl) =>
          ({
            name: t(`editor.heading.${lvl.toLowerCase()}Color`),
            desc: t(`editor.heading.${lvl.toLowerCase()}Color.desc`),
            visible: () => plugin.settings.headingCustomColors,
            control: {
              type: "dropdown",
              key: `heading${lvl}`,
              options: getAccentColorOptions(),
            },
          }) as const
      ),
    ],
  };
}
