import {
  SettingControl,
  SettingDefinitionGroup,
  SettingDefinitionItem,
  SettingGroupItem,
} from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";

// 编辑器子页：属性区（frontmatter 多栏布局 + 栏间分隔线）
// 「属性分栏布局」是总开关：开启后才显示桌面端 / 移动端两个分组；
// 每个分组内各自设置分栏数与栏间分隔线（线型 / 颜色 / 自定义色 / 不透明度）；
// 线型选「无」时，颜色 / 自定义色 / 不透明度三项隐藏。
// 哪一端按哪套配置生效由样式表里的 body:not(.is-mobile) / body.is-mobile 决定
// （见 editor-properties-service），因此同一份设置在多设备间同步后两端互不干扰。
// 设置键统一以 [desktop|mobile]Properties* 命名，与本页 locale 命名空间 editor.properties.* 对应。

type Platform = "desktop" | "mobile";

// 分隔线的设置键：线型 / 颜色（色板 + 自定义）/ 不透明度，两端各一份。
// 控件 key 与「选自定义后展开」的可见性判断共用此处键名，避免手写字符串两处不一致。
const DIVIDER_KEYS = {
  desktop: {
    style: "desktopPropertiesDividerStyle",
    color: "desktopPropertiesDividerColor",
    customColor: "desktopPropertiesCustomDividerColor",
    opacity: "desktopPropertiesDividerOpacity",
  },
  mobile: {
    style: "mobilePropertiesDividerStyle",
    color: "mobilePropertiesDividerColor",
    customColor: "mobilePropertiesCustomDividerColor",
    opacity: "mobilePropertiesDividerOpacity",
  },
} as const;

/** 生成某一端的分栏数滑块设置项。 */
function buildColumnCountItem(platform: Platform): SettingGroupItem {
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

/** 生成某一端的「栏间分隔线」4 个设置项。 */
function buildDividerItems(plugin: SettingTabPlugin, platform: Platform): SettingGroupItem[] {
  const keys = DIVIDER_KEYS[platform];
  // 线型选「无」时分隔线不渲染，颜色 / 自定义色 / 不透明度整体隐藏。
  // 每次读取实时设置值，配合 setting-tab 的 refreshDomState 做原地联动。
  const hasDivider = (): boolean => plugin.settings[keys.style] !== "none";
  return [
    {
      name: t("editor.properties.dividerStyle"),
      desc: t("editor.properties.dividerStyle.desc"),
      control: {
        type: "dropdown",
        key: keys.style,
        options: {
          dashed: t("editor.properties.dividerStyle.dashed"),
          solid: t("editor.properties.dividerStyle.solid"),
          none: t("editor.properties.dividerStyle.none"),
        },
      },
    },
    {
      name: t("editor.properties.dividerColor"),
      desc: t("editor.properties.dividerColor.desc"),
      visible: hasDivider,
      // allowCustom：在预设色板下拉末尾追加「自定义」项，选中后展开下方颜色选择器
      control: {
        type: "color",
        key: keys.color,
        allowCustom: true,
      } as unknown as SettingControl,
    },
    {
      // 颜色选择「自定义」后展开：原生颜色选择器（值为 #rrggbb）
      name: t("editor.properties.dividerColorCustom"),
      desc: t("editor.properties.dividerColorCustom.desc"),
      visible: () => hasDivider() && plugin.settings[keys.color] === "custom",
      control: {
        type: "color-picker",
        key: keys.customColor,
      } as unknown as SettingControl,
    },
    {
      name: t("editor.properties.dividerColorOpacity"),
      desc: t("editor.properties.dividerColorOpacity.desc"),
      visible: hasDivider,
      control: {
        type: "slider",
        key: keys.opacity,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
      },
    },
  ];
}

export function buildPropertiesItem(plugin: SettingTabPlugin): SettingDefinitionItem {
  const buildPlatformGroup = (
    headingKey: string,
    platform: Platform,
  ): SettingDefinitionGroup => ({
    type: "group",
    heading: t(headingKey),
    visible: () => plugin.settings.propertiesColumnLayout,
    // 分栏数 + 本端的栏间分隔线（线型 / 颜色 / 自定义色 / 不透明度）
    items: [buildColumnCountItem(platform), ...buildDividerItems(plugin, platform)],
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
