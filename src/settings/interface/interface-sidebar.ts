import { SettingControl, SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";

// 界面子页：侧边栏（桌面端 + 移动端）
export function buildSidebarItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  return {
    type: "page",
    name: t("interface.sidebar.name"),
    desc: t("interface.sidebar.desc"),
    items: [
      {
        type: "group",
        heading: t("interface.sidebar.group.desktop"),
        items: [
          {
            name: t("interface.sidebar.desktop.customVaultName"),
            desc: t("interface.sidebar.desktop.customVaultName.desc"),
            control: {
              type: "text",
              key: "customVaultName",
              placeholder: t("interface.sidebar.desktop.customVaultName.placeholder"),
            },
          },
          {
            name: t("interface.sidebar.desktop.showVaultName"),
            desc: t("interface.sidebar.desktop.showVaultName.desc"),
            control: { type: "toggle", key: "showVaultNameInFileList" },
          },
          {
            name: t("interface.sidebar.desktop.centerVaultName"),
            desc: t("interface.sidebar.desktop.centerVaultName.desc"),
            visible: () => plugin.settings.showVaultNameInFileList,
            control: { type: "toggle", key: "centerVaultNameInFileList" },
          },
          {
            name: t("interface.sidebar.desktop.vaultNameFontSize"),
            desc: t("interface.sidebar.desktop.vaultNameFontSize.desc"),
            visible: () => plugin.settings.showVaultNameInFileList,
            control: {
              type: "slider",
              key: "vaultNameFontSizeInFileList",
              min: 10,
              max: 40,
              step: 1,
              unit: "px",
            },
          },
          {
            name: t("interface.sidebar.desktop.vaultNameFont"),
            desc: t("interface.sidebar.desktop.vaultNameFont.desc"),
            visible: () => plugin.settings.showVaultNameInFileList,
            control: {
              type: "dropdown",
              key: "vaultNameFontInFileList",
              options: {
                interface: t("newtab.title.font.interface"),
                text: t("newtab.title.font.text"),
                monospace: t("newtab.title.font.monospace"),
                custom: t("interface.sidebar.desktop.vaultNameFont.custom"),
              },
            },
          },
          {
            // 字体选择「自定义」后展开：字体选择框（可搜索系统字体，也可直接输入字体名，
            // 或逗号分隔的完整字体列表）
            name: t("interface.sidebar.desktop.vaultNameFontCustom"),
            desc: t("interface.sidebar.desktop.vaultNameFontCustom.desc"),
            visible: () =>
              plugin.settings.showVaultNameInFileList &&
              plugin.settings.vaultNameFontInFileList === "custom",
            control: {
              type: "font",
              key: "vaultNameCustomFontInFileList",
              placeholder: t("interface.sidebar.desktop.vaultNameFontCustom.placeholder"),
            } as unknown as SettingControl,
          },
          {
            // 色板下拉 + 「自定义」：由 setting-tab 的 expandColorItems 统一追加「自定义」项，
            // 并在其后插入**共用本字段**的颜色选择器（值 #rrggbb），无需在此手工声明子项。
            // 恢复默认时回到「自定义 + 跟随主题强调色」，服务层按 #rrggbb / 色名 / default 解析。
            name: t("interface.sidebar.desktop.vaultNameColor"),
            desc: t("interface.sidebar.desktop.vaultNameColor.desc"),
            visible: () => plugin.settings.showVaultNameInFileList,
            control: {
              type: "color",
              key: "vaultNameColorInFileList",
            } as unknown as SettingControl,
          },
          {
            name: t("interface.sidebar.desktop.vaultNameOpacity"),
            desc: t("interface.sidebar.desktop.vaultNameOpacity.desc"),
            visible: () => plugin.settings.showVaultNameInFileList,
            control: {
              type: "slider",
              key: "vaultNameOpacityInFileList",
              min: 0,
              max: 100,
              step: 1,
              unit: "%",
            },
          },
          {
            name: t("interface.sidebar.desktop.restoreLegacy"),
            desc: t("interface.sidebar.desktop.restoreLegacy.desc"),
            control: { type: "toggle", key: "restoreLegacySidebar" },
          },
        ],
      },
      {
        type: "group",
        heading: t("interface.sidebar.group.mobile"),
        items: [
          {
            name: t("interface.sidebar.mobile.header"),
            desc: t("interface.sidebar.mobile.header.desc"),
            control: { type: "toggle", key: "mobileDrawerHeaderTop" },
          },
          {
            name: t("interface.sidebar.mobile.tabs"),
            desc: t("interface.sidebar.mobile.tabs.desc"),
            control: { type: "toggle", key: "mobileDrawerTabsTop" },
          },
          {
            name: t("interface.sidebar.mobile.nav"),
            desc: t("interface.sidebar.mobile.nav.desc"),
            control: { type: "toggle", key: "mobileDrawerNavTop" },
          },
        ],
      },
    ],
  };
}
