import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getAccentColorOptions } from "../../utils/color-palette";

// 编辑器子页：文字装饰（粗体 / 删除线 / 高亮颜色）
export function buildTextDecorationItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.textDecoration.name"),
    desc: t("editor.textDecoration.desc"),
    items: [
      {
        name: t("editor.textDecoration.custom"),
        desc: t("editor.textDecoration.custom.desc"),
        control: {
          type: "toggle",
          key: "textDecorationCustom",
        },
      },
      {
        name: t("editor.textDecoration.boldColor"),
        desc: t("editor.textDecoration.boldColor.desc"),
        visible: () => plugin.settings.textDecorationCustom,
        control: {
          type: "dropdown",
          key: "textBoldColor",
          options: getAccentColorOptions(),
        },
      },
      {
        name: t("editor.textDecoration.italicColor"),
        desc: t("editor.textDecoration.italicColor.desc"),
        visible: () => plugin.settings.textDecorationCustom,
        control: {
          type: "dropdown",
          key: "textItalicColor",
          options: getAccentColorOptions(),
        },
      },
      {
        name: t("editor.textDecoration.italicBoldColor"),
        desc: t("editor.textDecoration.italicBoldColor.desc"),
        visible: () => plugin.settings.textDecorationCustom,
        control: {
          type: "dropdown",
          key: "textItalicBoldColor",
          options: getAccentColorOptions(),
        },
      },
      {
        name: t("editor.textDecoration.underlineColor"),
        desc: t("editor.textDecoration.underlineColor.desc"),
        visible: () => plugin.settings.textDecorationCustom,
        control: {
          type: "dropdown",
          key: "textUnderlineColor",
          options: getAccentColorOptions(),
        },
      },
      {
        name: t("editor.textDecoration.strikethroughColor"),
        desc: t("editor.textDecoration.strikethroughColor.desc"),
        visible: () => plugin.settings.textDecorationCustom,
        control: {
          type: "dropdown",
          key: "textStrikethroughColor",
          options: getAccentColorOptions(),
        },
      },
      {
        name: t("editor.textDecoration.highlightColor"),
        desc: t("editor.textDecoration.highlightColor.desc"),
        visible: () => plugin.settings.textDecorationCustom,
        control: {
          type: "dropdown",
          key: "textHighlightColor",
          options: getAccentColorOptions(),
        },
      },
    ],
  };
}
