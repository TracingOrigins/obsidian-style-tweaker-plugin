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
            name: t("interface.sidebar.desktop.vaultNameColor"),
            desc: t("interface.sidebar.desktop.vaultNameColor.desc"),
            visible: () => plugin.settings.showVaultNameInFileList,
            // allowCustom：在预设色板下拉末尾追加「自定义」项，选中后展开下方颜色选择器
            control: {
              type: "color",
              key: "vaultNameColorInFileList",
              allowCustom: true,
            } as unknown as SettingControl,
          },
          {
            // 颜色选择「自定义」后展开：原生颜色选择器（值为 #rrggbb）
            name: t("interface.sidebar.desktop.vaultNameColorCustom"),
            desc: t("interface.sidebar.desktop.vaultNameColorCustom.desc"),
            visible: () =>
              plugin.settings.showVaultNameInFileList &&
              plugin.settings.vaultNameColorInFileList === "custom",
            control: {
              type: "color-picker",
              key: "vaultNameCustomColorInFileList",
            } as unknown as SettingControl,
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
