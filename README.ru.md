<div align="center">
    <h1>Style Tweaker</h1>
    <p>
        <img src="https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22style-tweaker%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json" alt="Obsidian Downloads">
        <img src="https://img.shields.io/github/downloads/TracingOrigins/obsidian-style-tweaker-plugin/total?logo=github" alt="GitHub Downloads">
    </p>
    <p>[<a href="https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/blob/master/README.zh.md">中文</a> | <a href="https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/blob/master/README.md">English</a> | Русский]</p>
    <p><a href="https://community.obsidian.md/plugins/style-tweaker" target="_blank">Style Tweaker</a> — это плагин Obsidian, который позволяет точно настраивать внешний вид приложения — цвета, отступы, шрифты и макет — без написания собственных CSS-сниппетов.</p>
</div>

## Возможности

- **Без CSS** — настраивайте цвета, отступы, шрифты и макет из интерфейса настроек, без сниппетов
- **Живой предпросмотр** — изменения применяются мгновенно по мере настройки
- **Ноль зависимостей** — никаких внешних библиотек во время выполнения, только API Obsidian
- **Многоязычный интерфейс** — English, 中文, Русский

## Что можно настраивать

Вкладка настроек организована по группам, все изменения применяются мгновенно:

- **Внешний вид** — фон интерфейса (сплошной цвет или обои) и акцентные цвета темы. Обои настраиваются отдельно для desktop/mobile и тёмной/светлой темы, с прозрачностью, стеклом и автоматической сменой.
- **Интерфейс** — общий макет (обычный / рамки / карточки), подсветка вкладок, боковые панели (desktop и mobile), строка состояния.
- **Редактор** — 17 групп стилей заметок: фон редактора, подсветка активной строки, заголовок страницы, свойства, заголовки, инлайн-код, блоки кода, разделители, цитаты, ссылки, встраивания, таблицы, коллаутсы, списки, задачи и теги.
- **Новая вкладка** — настраиваемая страница новой вкладки: логотип, заголовок и интерактивный частичный wordmark.
- **Плагины** — стилевые улучшения для встроенного файлового менеджера (цветные папки, иконки файлов/папок, значки папок) и для плагина сообщества **Recent Files** (иконки файлов и цветные строки).
- **Сброс** — вернуть все настройки к значениям по умолчанию одним кликом.

> **Требования:** Obsidian 1.14.1 или новее.

## Установка

### Из официального каталога плагинов (рекомендуется)

1. Откройте Obsidian и перейдите в **Настройки → Сторонние плагины**
2. Отключите **Безопасный режим**
3. Нажмите **Обзор** и найдите "Style Tweaker"
4. Нажмите **Установить**, затем **Включить**

### Ручная установка

1. Скачайте последние версии `main.js`, `manifest.json` и `styles.css` на странице [Releases](https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/releases)
2. Создайте папку `style-tweaker` в каталоге плагинов хранилища (например, `ВашеХранилище/.obsidian/plugins/style-tweaker/`) и поместите в неё эти три файла
3. Включите плагин в **Настройки → Сторонние плагины**

### Установка через BRAT (рекомендуется для тестировщиков)

1. Установите плагин [BRAT](https://github.com/TfTHacker/obsidian42-brat)
2. В настройках BRAT нажмите **Add Beta plugin**
3. Введите `TracingOrigins/obsidian-style-tweaker-plugin`
4. Включите плагин

## Руководство по разработке

1. Клонируйте репозиторий:

    ```bash
    git clone https://github.com/TracingOrigins/obsidian-style-tweaker-plugin.git
    cd obsidian-style-tweaker-plugin
    ```

2. Скопируйте `.env.example` в `.env` и укажите `VAULT_PATH` — путь к вашему хранилищу Obsidian:

   ```
   VAULT_PATH=C:/Users/YourName/Documents/MyVault
   ```

3. Установите зависимости и начните разработку:

    ```bash
    npm install        # установка зависимостей
    npm run dev        # режим отслеживания (авто-деплой в хранилище)
    npm run build      # production сборка (авто-деплой в хранилище)
    npm run lint       # запуск eslint
    ```

## Поддержка и обратная связь

Если этот плагин вам помог, пожалуйста, рассмотрите возможность:

- ⭐ **Поставить звезду репозиторию**
- 🐛 Сообщить об ошибке по [шаблону bug report](https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/issues/new?template=bug_report.md)
- 💡 Предложить функцию по [шаблону feature request](https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/issues/new?template=feature_request.md)
- ❓ Задать вопрос или поделиться идеей в [GitHub Issues](https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/issues)
- 📝 Ознакомиться с [руководством по контрибуции](https://github.com/TracingOrigins/obsidian-style-tweaker-plugin/blob/master/docs/contributing/contributing.md) и внести вклад кодом или документацией
- 💰 Поддержать разработчика на [странице поддержки](https://support.tracingorigins.top/) (если доступно)

## Благодарности

Дизайн и реализация этого плагина вдохновлены следующими замечательными проектами с открытым исходным кодом. Особая благодарность их авторам:

| Проект | Автор | GitHub | Поддержка |
|--------|-------|--------|-----------|
| Тема **Blue Topaz** | WhyI ([whyt-byte](https://github.com/whyt-byte)) | [PKM-er/Blue-Topaz_Obsidian-css](https://github.com/PKM-er/Blue-Topaz_Obsidian-css) | [Buy Me a Coffee](https://www.buymeacoffee.com/whyi) |
| Тема **AnuPpuccin** | Anubis ([AnubisNekhet](https://github.com/AnubisNekhet)) | [AnubisNekhet/anuppuccin](https://github.com/AnubisNekhet/anuppuccin) | [Buy Me a Coffee](https://www.buymeacoffee.com/anubisnekhet) |
| Плагин **Home Tab Plus** | Moyf ([Moyf](https://github.com/Moyf)) | [Moyf/home-tab-plus](https://github.com/Moyf/home-tab-plus) | Автором не предоставлена |
| Плагин **Style Context** | Moyf ([Moyf](https://github.com/Moyf)) | [Moyf/style-context](https://github.com/Moyf/style-context) | Автором не предоставлена |
| Плагин **File Explorer Note Count** | Ozan Tellioglu ([ozntel](https://github.com/ozntel)) | [ozntel/file-explorer-note-count](https://github.com/ozntel/file-explorer-note-count) | [Ko-fi](https://ko-fi.com/ozante) |
