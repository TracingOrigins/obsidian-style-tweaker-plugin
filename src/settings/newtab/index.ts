import { SettingDefinitionItem, SettingGroupItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { buildLogoPage } from "./newtab-logo";
import { buildTitlePage } from "./newtab-title";
import { buildParticlePage } from "./newtab-particle";

// ============================================================
// 顶级分组：新标签页
//   总开关 →（桌面端 / 移动端）两个分组，各含 徽标/标题/粒子 三个子页。
//   桌面与移动端参数独立成键（desktopNewTab* / mobileNewTab*），互不影响。
// ============================================================

/** 生成某一平台下徽标/标题/粒子三个子页（group 内允许放置 page）。
    Obsidian 设置框架把 group 内的 page 视作父页下的同级导航项，page id（默认取自 name）
    必须唯一；桌面/移动两套同名子页需显式 id 区分，否则报 duplicate page id。 */
function buildPlatformPages(
  plugin: SettingTabPlugin,
  platform: "desktop" | "mobile",
  on: () => boolean,
): SettingGroupItem[] {
  const pageId = (name: string): { id: string } =>
    ({ id: `newtab-${platform}-${name}` });
  return [
    {
      ...pageId("logo"),
      type: "page",
      name: t("newtab.sub.logo"),
      desc: t("newtab.sub.logo.desc"),
      visible: on,
      items: buildLogoPage(plugin, platform),
    },
    {
      ...pageId("title"),
      type: "page",
      name: t("newtab.sub.title"),
      desc: t("newtab.sub.title.desc"),
      visible: on,
      items: buildTitlePage(plugin, platform),
    },
    {
      ...pageId("particle"),
      type: "page",
      name: t("newtab.sub.particle"),
      desc: t("newtab.sub.particle.desc"),
      visible: on,
      items: buildParticlePage(plugin, platform),
    },
  ];
}

export function buildNewTabSection(plugin: SettingTabPlugin): SettingDefinitionItem {
  const on = () => plugin.settings.newTabEnabled;
  return {
    type: "page",
    name: t("newtab.name"),
    desc: t("newtab.desc"),
    items: [
      {
        name: t("newtab.enabled"),
        desc: t("newtab.enabled.desc"),
        control: { type: "toggle", key: "newTabEnabled" },
      },
      {
        type: "group",
        heading: t("newtab.group.desktop"),
        visible: on,
        items: buildPlatformPages(plugin, "desktop", on),
      },
      {
        type: "group",
        heading: t("newtab.group.mobile"),
        visible: on,
        items: buildPlatformPages(plugin, "mobile", on),
      },
    ],
  };
}
