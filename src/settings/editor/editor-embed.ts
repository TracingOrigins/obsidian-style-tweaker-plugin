import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";

// 编辑器子页：嵌入内容（![[...]]）
export function buildEmbedsItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("editor.embed.name"),
    desc: t("editor.embed.desc"),
    items: [
      {
        type: "group",
        heading: t("editor.embed.group.images"),
        items: [
          {
            name: t("editor.embed.imageCenter"),
            desc: t("editor.embed.imageCenter.desc"),
            control: {
              type: "toggle",
              key: "embedImageCenter",
            },
          },
          {
            name: t("editor.embed.imageBorder"),
            desc: t("editor.embed.imageBorder.desc"),
            control: {
              type: "toggle",
              key: "embedImageBorder",
            },
          },
          {
            name: t("editor.embed.imageCustomRadius"),
            desc: t("editor.embed.imageCustomRadius.desc"),
            control: {
              type: "toggle",
              key: "embedImageCustomRadius",
            },
          },
          {
            name: t("editor.embed.imageRadius"),
            desc: t("editor.embed.imageRadius.desc"),
            visible: () => plugin.settings.embedImageCustomRadius,
            control: {
              type: "slider",
              key: "embedImageRadius",
              min: 4,
              max: 16,
              step: 1,
              unit: "px",
            },
          },
        ],
      },
      {
        type: "group",
        heading: t("editor.embed.group.notes"),
        items: [
          {
            name: t("editor.embed.markdownSeamless"),
            desc: t("editor.embed.markdownSeamless.desc"),
            control: {
              type: "toggle",
              key: "embedMarkdownSeamless",
            },
          },
        ],
      },
    ],
  };
}
