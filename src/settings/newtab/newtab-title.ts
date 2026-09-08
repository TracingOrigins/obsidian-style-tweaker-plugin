import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { NewTabPlatform, ntKey } from "./newtab-logo";

// ============================================================
// 新标签页子页：标题
//   - 标题类型：默认 / 自定义（自定义时显示标题文本输入）
//   - 标题字体：界面字体 / 正文字体 / 等宽字体
//   - 标题字号：滑块
//   - 标题颜色：默认 / 14 个 theme.color
// ============================================================

export function buildTitlePage(
  plugin: SettingTabPlugin,
  platform: NewTabPlatform,
): SettingDefinitionItem[] {
  const s = () => plugin.settings as unknown as Record<string, unknown>;
  const key = (name: string) => ntKey(platform, name);
  const titleType = () => s()[key("TitleType")] as string;
  const customColor = () => Boolean(s()[key("TitleCustomColor")]);
  return [
      {
        name: t("newtab.title.type"),
        desc: t("newtab.title.type.desc"),
        control: {
          type: "dropdown",
          key: key("TitleType"),
          options: {
            default: t("newtab.title.type.default"),
            custom: t("newtab.title.type.custom"),
            none: t("newtab.title.type.none"),
          },
        },
      },
      {
        name: t("newtab.title.text"),
        desc: t("newtab.title.text.desc"),
        visible: () => titleType() === "custom",
        control: { type: "text", key: key("TitleText") },
      },
      {
        name: t("newtab.title.font"),
        desc: t("newtab.title.font.desc"),
        control: {
          type: "dropdown",
          key: key("TitleFont"),
          options: {
            interface: t("newtab.title.font.interface"),
            text: t("newtab.title.font.text"),
            monospace: t("newtab.title.font.monospace"),
          },
        },
      },
      {
        name: t("newtab.title.fontSize"),
        desc: t("newtab.title.fontSize.desc"),
        control: {
          type: "slider",
          key: key("TitleFontSize"),
          min: 24,
          max: 120,
          step: 1,
          unit: "px",
        },
      },
      {
        name: t("newtab.title.customColor"),
        desc: t("newtab.title.customColor.desc"),
        control: { type: "toggle", key: key("TitleCustomColor") },
      },
      {
        name: t("newtab.title.color"),
        desc: t("newtab.title.color.desc"),
        visible: () => customColor(),
        control: { type: "color", key: key("TitleColor") },
      },
  ];
}
