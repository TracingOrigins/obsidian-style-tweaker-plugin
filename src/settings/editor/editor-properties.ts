import { SettingDefinitionGroup, SettingDefinitionItem, SettingGroupItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";

// 编辑器子页：属性区（frontmatter 多栏布局）
// 「属性分栏布局」是总开关：开启后才显示桌面端 / 移动端两个分组，各自设置栏数。
// 哪一端按哪个栏数生效由样式表里的 body:not(.is-mobile) / body.is-mobile 决定
// （见 editor-properties-service），因此同一份设置在多设备间同步后各端互不干扰。
// 设置键统一以 properties 前缀命名，与本页 locale 命名空间 editor.properties.* 对应。

/** 生成某一端的分栏数滑块设置项。 */
function buildColumnCountItem(platform: "desktop" | "mobile"): SettingGroupItem {
  return {
    name: t("editor.properties.columnCount"),
    desc: t("editor.properties.columnCount.desc"),
    control: {
      type: "slider",
      key: `${platform}PropertiesColumnCount`,
      min: 1,
      max: 6,
      step: 1,
    },
  };
}

export function buildPropertiesItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  const buildPlatformGroup = (
    headingKey: string,
    platform: "desktop" | "mobile",
  ): SettingDefinitionGroup => ({
    type: "group",
    heading: t(headingKey),
    visible: () => plugin.settings.propertiesColumnLayout,
    items: [buildColumnCountItem(platform)],
  });

  return {
    type: "page",
    name: t("editor.properties.name"),
    desc: t("editor.properties.desc"),
    items: [
      {
        name: t("editor.properties.columnLayout"),
        desc: t("editor.properties.columnLayout.desc"),
        control: {
          type: "toggle",
          key: "propertiesColumnLayout",
        },
      },
      buildPlatformGroup("editor.properties.group.desktop", "desktop"),
      buildPlatformGroup("editor.properties.group.mobile", "mobile"),
    ],
  };
}
