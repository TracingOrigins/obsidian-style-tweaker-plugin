import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getAccentColorOptions } from "../../utils/color-palette";

// 编辑器子页：列表（有序/无序列表颜色）
// 注意：源代码/实时预览模式始终使用主题强调色，下列自定义色仅在阅读模式生效。
export function buildListsItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.list.name"),
    desc: t("editor.list.desc"),
    items: [
      {
        name: t("editor.list.customColors"),
        desc: t("editor.list.customColors.desc"),
        control: {
          type: "toggle",
          key: "listCustomColors",
        },
      },
      {
        type: "group",
        heading: t("editor.list.group.unordered"),
        items: [
          {
            name: t("editor.list.ulIndentColor"),
            desc: t("editor.list.ulIndentColor.desc"),
            visible: () => plugin.settings.listCustomColors,
            control: {
              type: "dropdown",
              key: "listUlIndentColor",
              options: getAccentColorOptions(),
            },
          },
          {
            name: t("editor.list.ulActiveIndentColor"),
            desc: t("editor.list.ulActiveIndentColor.desc"),
            visible: () => plugin.settings.listCustomColors,
            control: {
              type: "dropdown",
              key: "listUlActiveIndentColor",
              options: getAccentColorOptions(),
            },
          },
          {
            name: t("editor.list.bulletColor"),
            desc: t("editor.list.bulletColor.desc"),
            visible: () => plugin.settings.listCustomColors,
            control: {
              type: "dropdown",
              key: "listBulletColor",
              options: getAccentColorOptions(),
            },
          },
        ],
      },
      {
        type: "group",
        heading: t("editor.list.group.ordered"),
        items: [
          {
            name: t("editor.list.olIndentColor"),
            desc: t("editor.list.olIndentColor.desc"),
            visible: () => plugin.settings.listCustomColors,
            control: {
              type: "dropdown",
              key: "listOlIndentColor",
              options: getAccentColorOptions(),
            },
          },
          {
            name: t("editor.list.olActiveIndentColor"),
            desc: t("editor.list.olActiveIndentColor.desc"),
            visible: () => plugin.settings.listCustomColors,
            control: {
              type: "dropdown",
              key: "listOlActiveIndentColor",
              options: getAccentColorOptions(),
            },
          },
          {
            name: t("editor.list.numberColor"),
            desc: t("editor.list.numberColor.desc"),
            visible: () => plugin.settings.listCustomColors,
            control: {
              type: "dropdown",
              key: "listNumberColor",
              options: getAccentColorOptions(),
            },
          },
        ],
      },
    ],
  };
}
