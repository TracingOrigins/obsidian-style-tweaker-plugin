import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getAccentColorOptions } from "../../utils/color-palette";

// 编辑器子页：链接（内部/外部链接颜色与下划线）
export function buildLinksItem(_plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.link.name"),
    desc: t("editor.link.desc"),
    items: [
      {
        name: t("editor.link.colorfulAnimation"),
        desc: t("editor.link.colorfulAnimation.desc"),
        control: {
          type: "toggle",
          key: "linkColorfulAnimation",
        },
      },
      {
        type: "group",
        heading: t("editor.link.group.internal"),
        items: [
          {
            name: t("editor.link.internalColor"),
            desc: t("editor.link.internalColor.desc"),
            control: {
              type: "dropdown",
              key: "linkInternalColor",
              options: getAccentColorOptions(),
            },
          },
          {
            name: t("editor.link.underlineInternal"),
            desc: t("editor.link.underlineInternal.desc"),
            control: {
              type: "toggle",
              key: "linkUnderlineInternal",
            },
          },
          {
            name: t("editor.link.underlineUnresolved"),
            desc: t("editor.link.underlineUnresolved.desc"),
            control: {
              type: "toggle",
              key: "linkUnderlineUnresolved",
            },
          },
        ],
      },
      {
        type: "group",
        heading: t("editor.link.group.external"),
        items: [
          {
            name: t("editor.link.externalColor"),
            desc: t("editor.link.externalColor.desc"),
            control: {
              type: "dropdown",
              key: "linkExternalColor",
              options: getAccentColorOptions(),
            },
          },
          {
            name: t("editor.link.underlineExternal"),
            desc: t("editor.link.underlineExternal.desc"),
            control: {
              type: "toggle",
              key: "linkUnderlineExternal",
            },
          },
          {
            name: t("editor.link.removeExternalIcon"),
            desc: t("editor.link.removeExternalIcon.desc"),
            control: {
              type: "toggle",
              key: "linkRemoveExternalIcon",
            },
          },
        ],
      },
    ],
  };
}
