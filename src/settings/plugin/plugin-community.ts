import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getAccentColorOptions } from "../../utils/color-palette";

/** 与文件列表彩色文件夹同文案的配色下拉选项（样式 1-6 + 自定义）。 */
function paletteOptions(): Record<string, string> {
  return {
    one: t("plugins.fileExplorer.coloredFolders.palette.one"),
    two: t("plugins.fileExplorer.coloredFolders.palette.two"),
    three: t("plugins.fileExplorer.coloredFolders.palette.three"),
    four: t("plugins.fileExplorer.coloredFolders.palette.four"),
    five: t("plugins.fileExplorer.coloredFolders.palette.five"),
    six: t("plugins.fileExplorer.coloredFolders.palette.six"),
    custom: t("plugins.fileExplorer.coloredFolders.palette.custom"),
  };
}

/** recent-files 彩色化类型下拉选项（仅 title / background；背景在前，标题在后）。 */
function modeOptions(): Record<string, string> {
  return {
    background: t("plugins.fileExplorer.coloredFolders.mode.background"),
    title: t("plugins.fileExplorer.coloredFolders.mode.title"),
  };
}

// 插件分组：社区插件（Buttons Panel / Recent Files）
export function buildCommunityPluginsGroup(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "group",
    heading: t("plugins.group.community"),
    items: [
      {
        type: "page",
        name: t("plugins.recentFiles.name"),
        desc: t("plugins.recentFiles.desc"),
        items: [
          {
            name: t("plugins.recentFiles.addFileIcon"),
            desc: t("plugins.recentFiles.addFileIcon.desc"),
            control: { type: "toggle", key: "rfAddFileIcon" },
          },
          {
            name: t("plugins.recentFiles.hoverRevealFileTag"),
            desc: t("plugins.recentFiles.hoverRevealFileTag.desc"),
            control: { type: "toggle", key: "rfHoverRevealFileTag" },
          },
          {
            type: "page",
            name: t("plugins.recentFiles.coloredFiles.name"),
            desc: t("plugins.recentFiles.coloredFiles.desc"),
            items: [
              {
                name: t("plugins.recentFiles.coloredFiles.toggle"),
                desc: t("plugins.recentFiles.coloredFiles.toggle.desc"),
                control: { type: "toggle", key: "rfColorfulEnabled" },
              },
              {
                type: "group",
                heading: t("plugins.recentFiles.coloredFiles.group.dark"),
                items: [
                  {
                    name: t("plugins.recentFiles.coloredFiles.mode"),
                    desc: t("plugins.recentFiles.coloredFiles.mode.desc"),
                    visible: () => plugin.settings.rfColorfulEnabled,
                    control: { type: "dropdown", key: "rfColorfulModeDark", options: modeOptions() },
                  },
                  {
                    name: t("plugins.recentFiles.coloredFiles.palette"),
                    desc: t("plugins.recentFiles.coloredFiles.palette.desc"),
                    visible: () => plugin.settings.rfColorfulEnabled,
                    control: { type: "dropdown", key: "rfColorfulPaletteDark", options: paletteOptions() },
                  },
                  {
                    name: t("plugins.recentFiles.coloredFiles.customColor"),
                    desc: t("plugins.recentFiles.coloredFiles.customColor.darkDesc"),
                    visible: () =>
                      plugin.settings.rfColorfulEnabled &&
                      plugin.settings.rfColorfulPaletteDark === "custom",
                    control: { type: "dropdown", key: "rfColorfulColorDark", options: getAccentColorOptions() },
                  },
                ],
              },
              {
                type: "group",
                heading: t("plugins.recentFiles.coloredFiles.group.light"),
                items: [
                  {
                    name: t("plugins.recentFiles.coloredFiles.mode"),
                    desc: t("plugins.recentFiles.coloredFiles.mode.desc"),
                    visible: () => plugin.settings.rfColorfulEnabled,
                    control: { type: "dropdown", key: "rfColorfulModeLight", options: modeOptions() },
                  },
                  {
                    name: t("plugins.recentFiles.coloredFiles.palette"),
                    desc: t("plugins.recentFiles.coloredFiles.palette.desc"),
                    visible: () => plugin.settings.rfColorfulEnabled,
                    control: { type: "dropdown", key: "rfColorfulPaletteLight", options: paletteOptions() },
                  },
                  {
                    name: t("plugins.recentFiles.coloredFiles.customColor"),
                    desc: t("plugins.recentFiles.coloredFiles.customColor.lightDesc"),
                    visible: () =>
                      plugin.settings.rfColorfulEnabled &&
                      plugin.settings.rfColorfulPaletteLight === "custom",
                    control: { type: "dropdown", key: "rfColorfulColorLight", options: getAccentColorOptions() },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}
