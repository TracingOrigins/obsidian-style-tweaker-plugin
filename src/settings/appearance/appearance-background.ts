import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { getDarkFlavorOptions, getLightFlavorOptions } from "../../utils/color-palette";

// 外观子页：背景（none=默认背景，solid=纯色背景，image=图片背景）
export function buildBackgroundItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("appearance.background.name"),
    desc: t("appearance.background.desc"),
    items: [
      {
        name: t("appearance.background.type"),
        desc: t("appearance.background.type.desc"),
        control: {
          type: "dropdown",
          key: "backgroundType",
          options: {
            default: t("appearance.background.type.default"),
            solid: t("appearance.background.type.solid"),
            image: t("appearance.background.type.image"),
          },
        },
      },
      {
        name: t("appearance.background.solid.dark"),
        desc: t("appearance.background.solid.dark.desc"),
        visible: () => plugin.settings.backgroundType === "solid",
        control: { type: "dropdown", key: "solidDarkFlavor", options: getDarkFlavorOptions() },
      },
      {
        name: t("appearance.background.solid.light"),
        desc: t("appearance.background.solid.light.desc"),
        visible: () => plugin.settings.backgroundType === "solid",
        control: { type: "dropdown", key: "solidLightFlavor", options: getLightFlavorOptions() },
      },
      {
        // 桌面端背景（图片模式）：深色/浅色各一套独立文件夹 + 自动切换
        type: "page",
        name: t("appearance.background.image.device.desktop"),
        desc: t("appearance.background.image.device.desktop.desc"),
        visible: () => plugin.settings.backgroundType === "image",
        items: [
          {
            type: "group",
            heading: t("appearance.background.image.style.dark"),
            items: [
              {
                name: t("appearance.background.image.desktop.folder"),
                desc: t("appearance.background.image.desktop.folder.desc"),
                control: { type: "folder", key: "desktopWallpaperFolderDark" },
              },
              {
                name: t("appearance.background.image.mode"),
                desc: t("appearance.background.image.mode.desc"),
                control: {
                  type: "dropdown",
                  key: "desktopWallpaperModeDark",
                  options: {
                    manual: t("appearance.background.image.mode.manual"),
                    random: t("appearance.background.image.mode.random"),
                    sequence: t("appearance.background.image.mode.sequence"),
                  },
                },
              },
              {
                name: t("appearance.background.image.manualImage"),
                desc: t("appearance.background.image.manualImage.desc"),
                visible: () => plugin.settings.desktopWallpaperModeDark === "manual",
                control: {
                  type: "file",
                  key: "desktopWallpaperIndexDark",
                  folderKey: "desktopWallpaperFolderDark",
                },
              },
              {
                name: t("appearance.background.image.interval"),
                desc: t("appearance.background.image.interval.desc"),
                visible: () => plugin.settings.desktopWallpaperModeDark !== "manual",
                control: {
                  type: "slider",
                  key: "desktopWallpaperIntervalDark",
                  min: 30,
                  max: 1800,
                  step: 30,
                  unit: "s",
                },
              },
              {
                name: t("appearance.background.image.opacity"),
                desc: t("appearance.background.image.opacity.desc"),
                control: {
                  type: "slider",
                  key: "desktopBackgroundImageOpacityDark",
                  min: 0,
                  max: 100,
                  step: 1,
                  unit: "%",
                },
              },
              {
                name: t("appearance.background.image.glassBlur"),
                desc: t("appearance.background.image.glassBlur.desc"),
                control: {
                  type: "slider",
                  key: "desktopGlassBlurDark",
                  min: 0,
                  max: 40,
                  step: 1,
                  unit: "px",
                },
              },
            ],
          },
          {
            type: "group",
            heading: t("appearance.background.image.style.light"),
            items: [
              {
                name: t("appearance.background.image.desktop.folder"),
                desc: t("appearance.background.image.desktop.folder.desc"),
                control: { type: "folder", key: "desktopWallpaperFolderLight" },
              },
              {
                name: t("appearance.background.image.mode"),
                desc: t("appearance.background.image.mode.desc"),
                control: {
                  type: "dropdown",
                  key: "desktopWallpaperModeLight",
                  options: {
                    manual: t("appearance.background.image.mode.manual"),
                    random: t("appearance.background.image.mode.random"),
                    sequence: t("appearance.background.image.mode.sequence"),
                  },
                },
              },
              {
                name: t("appearance.background.image.manualImage"),
                desc: t("appearance.background.image.manualImage.desc"),
                visible: () => plugin.settings.desktopWallpaperModeLight === "manual",
                control: {
                  type: "file",
                  key: "desktopWallpaperIndexLight",
                  folderKey: "desktopWallpaperFolderLight",
                },
              },
              {
                name: t("appearance.background.image.interval"),
                desc: t("appearance.background.image.interval.desc"),
                visible: () => plugin.settings.desktopWallpaperModeLight !== "manual",
                control: {
                  type: "slider",
                  key: "desktopWallpaperIntervalLight",
                  min: 30,
                  max: 1800,
                  step: 30,
                  unit: "s",
                },
              },
              {
                name: t("appearance.background.image.opacity"),
                desc: t("appearance.background.image.opacity.desc"),
                control: {
                  type: "slider",
                  key: "desktopBackgroundImageOpacityLight",
                  min: 0,
                  max: 100,
                  step: 1,
                  unit: "%",
                },
              },
              {
                name: t("appearance.background.image.glassBlur"),
                desc: t("appearance.background.image.glassBlur.desc"),
                control: {
                  type: "slider",
                  key: "desktopGlassBlurLight",
                  min: 0,
                  max: 40,
                  step: 1,
                  unit: "px",
                },
              },
            ],
          },
        ],
      },
      {
        // 移动端背景（图片模式）：深色/浅色各一套独立文件夹 + 自动切换
        type: "page",
        name: t("appearance.background.image.device.mobile"),
        desc: t("appearance.background.image.device.mobile.desc"),
        visible: () => plugin.settings.backgroundType === "image",
        items: [
          {
            type: "group",
            heading: t("appearance.background.image.style.dark"),
            items: [
              {
                name: t("appearance.background.image.mobile.folder"),
                desc: t("appearance.background.image.mobile.folder.desc"),
                control: { type: "folder", key: "mobileWallpaperFolderDark" },
              },
              {
                name: t("appearance.background.image.mode"),
                desc: t("appearance.background.image.mode.desc"),
                control: {
                  type: "dropdown",
                  key: "mobileWallpaperModeDark",
                  options: {
                    manual: t("appearance.background.image.mode.manual"),
                    random: t("appearance.background.image.mode.random"),
                    sequence: t("appearance.background.image.mode.sequence"),
                  },
                },
              },
              {
                name: t("appearance.background.image.manualImage"),
                desc: t("appearance.background.image.manualImage.desc"),
                visible: () => plugin.settings.mobileWallpaperModeDark === "manual",
                control: {
                  type: "file",
                  key: "mobileWallpaperIndexDark",
                  folderKey: "mobileWallpaperFolderDark",
                },
              },
              {
                name: t("appearance.background.image.interval"),
                desc: t("appearance.background.image.interval.desc"),
                visible: () => plugin.settings.mobileWallpaperModeDark !== "manual",
                control: {
                  type: "slider",
                  key: "mobileWallpaperIntervalDark",
                  min: 30,
                  max: 1800,
                  step: 30,
                  unit: "s",
                },
              },
              {
                name: t("appearance.background.image.opacity"),
                desc: t("appearance.background.image.opacity.desc"),
                control: {
                  type: "slider",
                  key: "mobileBackgroundImageOpacityDark",
                  min: 0,
                  max: 100,
                  step: 1,
                  unit: "%",
                },
              },
              {
                name: t("appearance.background.image.glassBlur"),
                desc: t("appearance.background.image.glassBlur.desc"),
                control: {
                  type: "slider",
                  key: "mobileGlassBlurDark",
                  min: 0,
                  max: 40,
                  step: 1,
                  unit: "px",
                },
              },
            ],
          },
          {
            type: "group",
            heading: t("appearance.background.image.style.light"),
            items: [
              {
                name: t("appearance.background.image.mobile.folder"),
                desc: t("appearance.background.image.mobile.folder.desc"),
                control: { type: "folder", key: "mobileWallpaperFolderLight" },
              },
              {
                name: t("appearance.background.image.mode"),
                desc: t("appearance.background.image.mode.desc"),
                control: {
                  type: "dropdown",
                  key: "mobileWallpaperModeLight",
                  options: {
                    manual: t("appearance.background.image.mode.manual"),
                    random: t("appearance.background.image.mode.random"),
                    sequence: t("appearance.background.image.mode.sequence"),
                  },
                },
              },
              {
                name: t("appearance.background.image.manualImage"),
                desc: t("appearance.background.image.manualImage.desc"),
                visible: () => plugin.settings.mobileWallpaperModeLight === "manual",
                control: {
                  type: "file",
                  key: "mobileWallpaperIndexLight",
                  folderKey: "mobileWallpaperFolderLight",
                },
              },
              {
                name: t("appearance.background.image.interval"),
                desc: t("appearance.background.image.interval.desc"),
                visible: () => plugin.settings.mobileWallpaperModeLight !== "manual",
                control: {
                  type: "slider",
                  key: "mobileWallpaperIntervalLight",
                  min: 30,
                  max: 1800,
                  step: 30,
                  unit: "s",
                },
              },
              {
                name: t("appearance.background.image.opacity"),
                desc: t("appearance.background.image.opacity.desc"),
                control: {
                  type: "slider",
                  key: "mobileBackgroundImageOpacityLight",
                  min: 0,
                  max: 100,
                  step: 1,
                  unit: "%",
                },
              },
              {
                name: t("appearance.background.image.glassBlur"),
                desc: t("appearance.background.image.glassBlur.desc"),
                control: {
                  type: "slider",
                  key: "mobileGlassBlurLight",
                  min: 0,
                  max: 40,
                  step: 1,
                  unit: "px",
                },
              },
            ],
          },
        ],
      },
    ],
  };
}
