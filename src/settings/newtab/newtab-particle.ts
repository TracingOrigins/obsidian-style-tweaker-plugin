import { SettingDefinitionItem } from "obsidian";

import { t } from "../../utils/i18n";
import { SettingTabPlugin } from "../../types/settings";
import { NewTabPlatform, ntKey } from "./newtab-logo";

// ============================================================
// 新标签页子页：粒子特效
//   总开关 → 画布 / 外观 / 交互 三组（同一页，按开关显隐）
// ============================================================

export function buildParticlePage(
  plugin: SettingTabPlugin,
  platform: NewTabPlatform,
): SettingDefinitionItem[] {
  const s = () => plugin.settings as unknown as Record<string, unknown>;
  const key = (name: string) => ntKey(platform, name);
  const on = () => Boolean(s()[key("ParticleEnabled")]);
  const customColor = () => Boolean(s()[key("ParticleCustomColor")]);
  return [
      {
        name: t("newtab.particle.enabled"),
        desc: t("newtab.particle.enabled.desc"),
        control: { type: "toggle", key: key("ParticleEnabled") },
      },
      {
        type: "group",
        heading: t("newtab.particle.canvas"),
        items: [
          {
            name: t("newtab.particle.canvasScale"),
            desc: t("newtab.particle.canvasScale.desc"),
            visible: on,
            control: {
              type: "slider",
              key: key("ParticleCanvasScale"),
              min: 1,
              max: 3,
              step: 0.1,
              unit: "×",
            },
          },
          {
            name: t("newtab.particle.radius"),
            desc: t("newtab.particle.radius.desc"),
            visible: on,
            control: {
              type: "slider",
              key: key("ParticleRadius"),
              min: 0.2,
              max: 3,
              step: 0.1,
              unit: "px",
            },
          },
          {
            name: t("newtab.particle.spacing"),
            desc: t("newtab.particle.spacing.desc"),
            visible: on,
            control: {
              type: "slider",
              key: key("ParticleSpacing"),
              min: 1,
              max: 8,
              step: 0.5,
              unit: "px",
            },
          },
        ],
      },
      {
        type: "group",
        heading: t("newtab.particle.appearance"),
        items: [
          {
            name: t("newtab.particle.customColor"),
            desc: t("newtab.particle.customColor.desc"),
            visible: on,
            control: { type: "toggle", key: key("ParticleCustomColor") },
          },
          {
            name: t("newtab.particle.logoColor"),
            desc: t("newtab.particle.logoColor.desc"),
            visible: () => on() && customColor(),
            control: { type: "color", key: key("ParticleLogoColor") },
          },
          {
            name: t("newtab.particle.titleColor"),
            desc: t("newtab.particle.titleColor.desc"),
            visible: () => on() && customColor(),
            control: { type: "color", key: key("ParticleTitleColor") },
          },
          {
            name: t("newtab.particle.motion"),
            desc: t("newtab.particle.motion.desc"),
            visible: on,
            control: {
              type: "dropdown",
              key: key("ParticleMotion"),
              options: {
                none: t("newtab.particle.motion.none"),
                float: t("newtab.particle.motion.float"),
                undulate: t("newtab.particle.motion.undulate"),
                wave: t("newtab.particle.motion.wave"),
                ripple: t("newtab.particle.motion.ripple"),
                heartbeat: t("newtab.particle.motion.heartbeat"),
                breathe: t("newtab.particle.motion.breathe"),
              },
            },
          },
        ],
      },
      {
        type: "group",
        heading: t("newtab.particle.interaction"),
        items: [
          {
            name: t("newtab.particle.disturbRadius"),
            desc: t("newtab.particle.disturbRadius.desc"),
            visible: on,
            control: {
              type: "slider",
              key: key("ParticleDisturbRadius"),
              min: 10,
              max: 150,
              step: 1,
              unit: "px",
            },
          },
          {
            name: t("newtab.particle.disturbStrength"),
            desc: t("newtab.particle.disturbStrength.desc"),
            visible: on,
            control: {
              type: "slider",
              key: key("ParticleDisturbStrength"),
              min: 0.1,
              max: 3,
              step: 0.1,
              unit: "×",
            },
          },
        ],
      },
  ];
}
