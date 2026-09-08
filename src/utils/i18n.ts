// 轻量 i18n：根据 Obsidian 界面语言返回对应文案
import zh from "../locales/zh.json";
import en from "../locales/en.json";
import ru from "../locales/ru.json";
import { getLanguage } from "obsidian";

const locales: Record<string, Record<string, string>> = {
  zh,
  en,
  ru,
};

// 取当前语言：优先 zh / ru，其余一律回退到 en；
// getLanguage 在极少数环境下可能抛错，故用 try 兜底
function getCurrentLang(): string {
  try {
    const obsidianLang = getLanguage();
    if (obsidianLang?.startsWith("zh")) return "zh";
    if (obsidianLang?.startsWith("ru")) return "ru";
  } catch {
    // 取语言失败，回退 en
  }
  return "en";
}

// 翻译：命中当前语言则用当前语言，否则回退 en，最后兜底返回 key（便于排查缺失文案）
export function t(key: string): string {
  const lang = getCurrentLang();
  return locales[lang]?.[key] || locales["en"]?.[key] || key;
}