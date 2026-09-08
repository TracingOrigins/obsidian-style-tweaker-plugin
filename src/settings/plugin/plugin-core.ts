import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getAccentColorOptions } from "../../utils/color-palette";

// 插件分组：核心插件（文件资源管理器）
export function buildCorePluginsGroup(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "group",
    heading: t("plugins.group.core"),
    items: [
      {
        type: "page",
        name: t("plugins.fileExplorer.name"),
        desc: t("plugins.fileExplorer.desc"),
        items: [
          {
            name: t("plugins.fileExplorer.addFileIcon"),
            desc: t("plugins.fileExplorer.addFileIcon.desc"),
            control: { type: "toggle", key: "feAddFileIcon" },
          },
          {
            name: t("plugins.fileExplorer.replaceFolderIcon"),
            desc: t("plugins.fileExplorer.replaceFolderIcon.desc"),
            control: { type: "toggle", key: "feReplaceFolderIcon" },
          },
          {
            name: t("plugins.fileExplorer.folderBadge"),
            desc: t("plugins.fileExplorer.folderBadge.desc"),
            control: {
              type: "dropdown",
              key: "feFolderBadge",
              options: {
                none: t("plugins.fileExplorer.folderBadge.none"),
                dot: t("plugins.fileExplorer.folderBadge.dot"),
                count: t("plugins.fileExplorer.folderBadge.count"),
              },
            },
          },
          {
            type: "page",
            name: t("plugins.fileExplorer.coloredFolders.name"),
            desc: t("plugins.fileExplorer.coloredFolders.desc"),
            items: [
              {
                name: t("plugins.fileExplorer.coloredFolders.toggle"),
                desc: t("plugins.fileExplorer.coloredFolders.toggle.desc"),
                control: { type: "toggle", key: "feColorfulFoldersEnabled" },
              },
              {
                type: "group",
                heading: t("plugins.fileExplorer.coloredFolders.group.dark"),
                items: [
                  {
                    name: t("plugins.fileExplorer.coloredFolders.mode"),
                    desc: t("plugins.fileExplorer.coloredFolders.mode.desc"),
                    visible: () => plugin.settings.feColorfulFoldersEnabled,
                    control: {
                      type: "dropdown",
                      key: "feColorfulFolderModeDark",
                      options: {
                        background: t("plugins.fileExplorer.coloredFolders.mode.background"),
                        title: t("plugins.fileExplorer.coloredFolders.mode.title"),
                        border: t("plugins.fileExplorer.coloredFolders.mode.border"),
                        tab: t("plugins.fileExplorer.coloredFolders.mode.tab"),
                      },
                    },
                  },
                  {
                    name: t("plugins.fileExplorer.coloredFolders.palette"),
                    desc: t("plugins.fileExplorer.coloredFolders.palette.desc"),
                    visible: () => plugin.settings.feColorfulFoldersEnabled,
                    control: {
                      type: "dropdown",
                      key: "feColorfulFolderPaletteDark",
                      options: {
                        one: t("plugins.fileExplorer.coloredFolders.palette.one"),
                        two: t("plugins.fileExplorer.coloredFolders.palette.two"),
                        three: t("plugins.fileExplorer.coloredFolders.palette.three"),
                        four: t("plugins.fileExplorer.coloredFolders.palette.four"),
                        five: t("plugins.fileExplorer.coloredFolders.palette.five"),
                        six: t("plugins.fileExplorer.coloredFolders.palette.six"),
                        custom: t("plugins.fileExplorer.coloredFolders.palette.custom"),
                      },
                    },
                  },
                  {
                    name: t("plugins.fileExplorer.coloredFolders.customColor"),
                    desc: t("plugins.fileExplorer.coloredFolders.customColor.darkDesc"),
                    visible: () =>
                      plugin.settings.feColorfulFoldersEnabled &&
                      plugin.settings.feColorfulFolderPaletteDark === "custom",
                    control: { type: "dropdown", key: "feColorfulFolderColorDark", options: getAccentColorOptions() },
                  },
                  {
                    name: t("plugins.fileExplorer.removeFirstLevelFolderIcon"),
                    desc: t("plugins.fileExplorer.removeFirstLevelFolderIcon.desc"),
                    visible: () => {
                      const s = plugin.settings;
                      return (
                        s.feColorfulFoldersEnabled &&
                        (s.feColorfulFolderModeDark === "border" ||
                          s.feColorfulFolderModeDark === "tab")
                      );
                    },
                    control: { type: "toggle", key: "feRemoveFirstLevelFolderIconDark" },
                  },
                ],
              },
              {
                type: "group",
                heading: t("plugins.fileExplorer.coloredFolders.group.light"),
                items: [
                  {
                    name: t("plugins.fileExplorer.coloredFolders.mode"),
                    desc: t("plugins.fileExplorer.coloredFolders.mode.desc"),
                    visible: () => plugin.settings.feColorfulFoldersEnabled,
                    control: {
                      type: "dropdown",
                      key: "feColorfulFolderModeLight",
                      options: {
                        background: t("plugins.fileExplorer.coloredFolders.mode.background"),
                        title: t("plugins.fileExplorer.coloredFolders.mode.title"),
                        border: t("plugins.fileExplorer.coloredFolders.mode.border"),
                        tab: t("plugins.fileExplorer.coloredFolders.mode.tab"),
                      },
                    },
                  },
                  {
                    name: t("plugins.fileExplorer.coloredFolders.palette"),
                    desc: t("plugins.fileExplorer.coloredFolders.palette.desc"),
                    visible: () => plugin.settings.feColorfulFoldersEnabled,
                    control: {
                      type: "dropdown",
                      key: "feColorfulFolderPaletteLight",
                      options: {
                        one: t("plugins.fileExplorer.coloredFolders.palette.one"),
                        two: t("plugins.fileExplorer.coloredFolders.palette.two"),
                        three: t("plugins.fileExplorer.coloredFolders.palette.three"),
                        four: t("plugins.fileExplorer.coloredFolders.palette.four"),
                        five: t("plugins.fileExplorer.coloredFolders.palette.five"),
                        six: t("plugins.fileExplorer.coloredFolders.palette.six"),
                        custom: t("plugins.fileExplorer.coloredFolders.palette.custom"),
                      },
                    },
                  },
                  {
                    name: t("plugins.fileExplorer.coloredFolders.customColor"),
                    desc: t("plugins.fileExplorer.coloredFolders.customColor.lightDesc"),
                    visible: () =>
                      plugin.settings.feColorfulFoldersEnabled &&
                      plugin.settings.feColorfulFolderPaletteLight === "custom",
                    control: { type: "dropdown", key: "feColorfulFolderColorLight", options: getAccentColorOptions() },
                  },
                  {
                    name: t("plugins.fileExplorer.removeFirstLevelFolderIcon"),
                    desc: t("plugins.fileExplorer.removeFirstLevelFolderIcon.desc"),
                    visible: () => {
                      const s = plugin.settings;
                      return (
                        s.feColorfulFoldersEnabled &&
                        (s.feColorfulFolderModeLight === "border" ||
                          s.feColorfulFolderModeLight === "tab")
                      );
                    },
                    control: { type: "toggle", key: "feRemoveFirstLevelFolderIconLight" },
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
