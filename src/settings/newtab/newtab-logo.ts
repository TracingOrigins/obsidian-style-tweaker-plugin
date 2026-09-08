import { SettingControl, SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";

// ============================================================
// 新标签页子页：徽标
//   徽标来源（默认 / 内置矢量图标 / 自定义矢量图标 / 本地图片 / 无）
//   及各来源对应的配置项、徽标样式（缩放 / 位置 / 边距），全部平铺展示。
// ============================================================

export type NewTabPlatform = "desktop" | "mobile";

/** 由平台前缀生成新标签页设置键，如 ("desktop", "LogoType") => "desktopNewTabLogoType"。 */
export function ntKey(platform: NewTabPlatform, name: string): string {
  return `${platform}NewTab${name}`;
}

/** 读取当前平台对应设置值（键由 ntKey 生成）。 */
export function ntValue<K>(s: Record<string, unknown>, platform: NewTabPlatform, name: string): K {
  return s[ntKey(platform, name)] as K;
}

export function buildLogoPage(
  plugin: SettingTabPlugin,
  platform: NewTabPlatform,
): SettingDefinitionItem[] {
  const s = () => plugin.settings as unknown as Record<string, unknown>;
  const key = (name: string) => ntKey(platform, name);
  const logoType = () => s()[key("LogoType")] as string;
  const builtinCustomColor = () => Boolean(s()[key("LogoBuiltinCustomColor")]);
  return [
      {
        name: t("newtab.logo.type"),
        desc: t("newtab.logo.type.desc"),
        control: {
          type: "dropdown",
          key: key("LogoType"),
          options: {
            default: t("newtab.logo.type.default"),
            icon: t("newtab.logo.type.icon"),
            code: t("newtab.logo.type.code"),
            image: t("newtab.logo.type.image"),
            none: t("newtab.logo.type.none"),
          },
        },
      },
      {
        name: t("newtab.logo.icon"),
        desc: t("newtab.logo.icon.desc"),
        visible: () => logoType() === "icon",
        control: {
          type: "logo-icon",
          key: key("LogoBuiltin"),
        } as unknown as SettingControl,
      },
      {
        name: t("newtab.logo.iconCustomColor"),
        desc: t("newtab.logo.iconCustomColor.desc"),
        visible: () => logoType() === "icon",
        control: { type: "toggle", key: key("LogoBuiltinCustomColor") },
      },
      {
        name: t("newtab.logo.iconColor"),
        desc: t("newtab.logo.iconColor.desc"),
        visible: () => logoType() === "icon" && builtinCustomColor(),
        control: { type: "color", key: key("LogoBuiltinColor") },
      },
      {
        name: t("newtab.logo.code"),
        desc: t("newtab.logo.code.desc"),
        visible: () => logoType() === "code",
        control: {
          type: "logo-code",
          key: key("LogoSvg"),
        } as unknown as SettingControl,
      },
      {
        name: t("newtab.logo.image.folder"),
        desc: t("newtab.logo.image.folder.desc"),
        visible: () => logoType() === "image",
        control: { type: "folder", key: key("LogoImageFolder") },
      },
      {
        name: t("newtab.logo.image"),
        desc: t("newtab.logo.image.desc"),
        visible: () => logoType() === "image",
        control: {
          type: "logo-image",
          key: key("LogoImageIndex"),
          folderKey: key("LogoImageFolder"),
        } as unknown as SettingControl,
      },
      {
        name: t("newtab.logo.scale"),
        desc: t("newtab.logo.scale.desc"),
        control: {
          type: "slider",
          key: key("LogoScale"),
          min: 0.3,
          max: 3.0,
          step: 0.1,
          unit: "×",
        },
      },
      {
        name: t("newtab.logo.position"),
        desc: t("newtab.logo.position.desc"),
        control: {
          type: "dropdown",
          key: key("LogoPosition"),
          options: {
            top: t("newtab.logo.position.top"),
            bottom: t("newtab.logo.position.bottom"),
            left: t("newtab.logo.position.left"),
            right: t("newtab.logo.position.right"),
          },
        },
      },
      {
        name: t("newtab.logo.margin"),
        desc: t("newtab.logo.margin.desc"),
        control: {
          type: "slider",
          key: key("LogoMargin"),
          min: 0,
          max: 50,
          step: 1,
          unit: "px",
        },
      },
  ];
}
