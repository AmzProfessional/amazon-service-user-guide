import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 * https://quartz.jzhao.xyz/configuration
 */

// 1) Твій цільовий порядок (без цифр у назвах)
const NAV_ORDER = [
  "Добро пожаловать",
  "Начало работы",
  "Дашборд",
  "Поставщики услуг",
  "Инвентарь",
  "Запуск продукта",
  "Биржа товаров",
  "Заказы",
  "Мой склад",
  "Мои партии",
  "Магазины",
  "Финансы",
  "Уведомления",
  "Поддержка",
  "Сообщения",
  "Версия платформы",
]

// 2) Допоміжні утиліти для сортування FolderPage
type PD = any // QuartzPluginData тип доступний у плагіні; для конфіга вистачить any
const displayName = (node: PD) =>
  node?.frontmatter?.title ??
  node?.datedPath?.slice?.(-1)?.[0] ??
  node?.slug ??
  ""

// comparator для FolderPage: prop називається `sort`
const sortByNavOrder = (a: PD, b: PD) => {
  const A = displayName(a)
  const B = displayName(b)
  const ia = NAV_ORDER.indexOf(A)
  const ib = NAV_ORDER.indexOf(B)
  const oa = ia === -1 ? Number.POSITIVE_INFINITY : ia
  const ob = ib === -1 ? Number.POSITIVE_INFINITY : ib
  return oa === ob ? A.localeCompare(B, "ru") : oa - ob
}

const config: QuartzConfig = {
  configuration: {
    pageTitle: "Amazon Service",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: { provider: "plausible" },
    locale: "en-US",
    baseUrl: "quartz.jzhao.xyz",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans Pro",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#faf8f8",
          lightgray: "#e5e5e5",
          gray: "#b8b8b8",
          darkgray: "#4e4e4e",
          dark: "#2b2b2b",
          secondary: "#284b63",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#fff23688",
        },
        darkMode: {
          light: "#161618",
          lightgray: "#393639",
          gray: "#646464",
          darkgray: "#d4d4d4",
          dark: "#ebebec",
          secondary: "#7b97aa",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#b3aa0288",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({ priority: ["frontmatter", "git", "filesystem"] }),
      Plugin.SyntaxHighlighting({
        theme: { light: "github-light", dark: "github-dark" },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),

      // КЛЮЧ: FolderPage підтримує опцію `sort` (а не sortFn)
      // Документація: “sort: (f1, f2) => number” :contentReference[oaicite:2]{index=2}
      Plugin.FolderPage({ sort: sortByNavOrder }),

      Plugin.TagPage(),

      // ContentIndex не має опції sort — лишаємо як є (RSS / Sitemap) :contentReference[oaicite:3]{index=3}
      Plugin.ContentIndex({ enableSiteMap: true, enableRSS: true }),

      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      Plugin.CustomOgImages(),
    ],
  },
}

// Додаткові налаштування (як у тебе було)
export const modulePasswords = {
  module2: "defaultPassword123",
}

export default config
