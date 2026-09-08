import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getAccentColorOptions } from "../../utils/color-palette";

// 编辑器子页：页面内标题（inline title，文档 H1）
export function buildInlineTitleItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.inlineTitle.name"),
    desc: t("editor.inlineTitle.desc"),
    items: [
      {
        // 启用开关置于最上方
        name: t("editor.inlineTitle.enabled"),
        desc: t("editor.inlineTitle.enabled.desc"),
        control: {
          type: "toggle",
          key: "inlineTitleEnabled",
        },
      },
      {
        // 是否允许自定义标题颜色：关闭时仅使用主题色
        name: t("editor.inlineTitle.colorEnabled"),
        desc: t("editor.inlineTitle.colorEnabled.desc"),
        visible: () => plugin.settings.inlineTitleEnabled,
        control: {
          type: "toggle",
          key: "inlineTitleColorEnabled",
        },
      },
      {
        // 自定义标题颜色：仅当允许自定义时显示
        name: t("editor.inlineTitle.color"),
        desc: t("editor.inlineTitle.color.desc"),
        visible: () =>
          plugin.settings.inlineTitleEnabled &&
          plugin.settings.inlineTitleColorEnabled,
        control: {
          type: "dropdown",
          key: "inlineTitleColor",
          options: getAccentColorOptions(),
        },
      },
      {
        name: t("editor.inlineTitle.align"),
        desc: t("editor.inlineTitle.align.desc"),
        visible: () => plugin.settings.inlineTitleEnabled,
        control: {
          type: "dropdown",
          key: "inlineTitleAlign",
          options: {
            left: t("editor.inlineTitle.align.left"),
            center: t("editor.inlineTitle.align.center"),
            right: t("editor.inlineTitle.align.right"),
          },
        },
      },
      {
        name: t("editor.inlineTitle.underline"),
        desc: t("editor.inlineTitle.underline.desc"),
        visible: () => plugin.settings.inlineTitleEnabled,
        control: {
          type: "dropdown",
          key: "inlineTitleUnderline",
          options: {
            none: t("editor.inlineTitle.underline.none"),
            short: t("editor.inlineTitle.underline.short"),
            long: t("editor.inlineTitle.underline.long"),
          },
        },
      },
      {
        // 线型仅对「长下划线」生效，故仅在选长下划线时显示
        name: t("editor.inlineTitle.underlineStyle"),
        desc: t("editor.inlineTitle.underlineStyle.desc"),
        visible: () =>
          plugin.settings.inlineTitleEnabled &&
          plugin.settings.inlineTitleUnderline === "long",
        control: {
          type: "dropdown",
          key: "inlineTitleUnderlineStyle",
          options: {
            solid: t("editor.inlineTitle.underlineStyle.solid"),
            dashed: t("editor.inlineTitle.underlineStyle.dashed"),
            double: t("editor.inlineTitle.underlineStyle.double"),
          },
        },
      },
    ],
  };
}
