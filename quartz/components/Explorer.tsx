import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/explorer.scss"

// @ts-ignore
import script from "./scripts/explorer.inline"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"
import { FileTrieNode } from "../util/fileTrie"
import OverflowListFactory from "./OverflowList"
import { concatenateResources } from "../util/resources"

type OrderEntries = "sort" | "filter" | "map"

export interface Options {
  title?: string
  folderDefaultState: "collapsed" | "open"
  folderClickBehavior: "collapse" | "link"
  useSavedState: boolean
  sortFn: (a: FileTrieNode, b: FileTrieNode) => number
  filterFn: (node: FileTrieNode) => boolean
  mapFn: (node: FileTrieNode) => void
  order: OrderEntries[]
}

const defaultOptions: Options = {
  folderDefaultState: "collapsed",
  folderClickBehavior: "link",
  useSavedState: true,
  mapFn: (node) => {
    return node
  },
  sortFn: (a, b) => {
    // Sort order: folders first, then files. Sort folders and files alphabetically
    if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
      return a.displayName.localeCompare(b.displayName, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    }
    if (!a.isFolder && b.isFolder) {
      return 1
    } else {
      return -1
    }
  },
  filterFn: (node) => node.slugSegment !== "tags",
  order: ["filter", "map", "sort"],
}

export type FolderState = {
  path: string
  collapsed: boolean
}

// Карта паролів для кожного розділу
const modulePasswords: { [key: string]: string } = {
  "1. Введение": "zf0d47xa",
  "2. Dashboard": "a9d2kq8x",
  "3. Поставщики услуг": "m0x7p2aa",
  "4. Инвентарь": "i3fgc5bd",
  "5. Запуск продукта": "t9b8d4x1",
  "6. Биржа товаров": "h7k8s9da",
  "7. Заказы": "p2m9l3tz",
  "8. Мой склад": "z6t5f4bb",
  "9. Мои партии": "d3v0t6kd",
  "10. Магазины": "y7m3h8c2",
  "11. Финансы": "g4a2k9r7",
  "12. Уведомления": "o8e3r5tn",
  "13. Поддержка": "x7s5v1dq",
  "14. Сообщения": "r9b1v6na",
  "15. Версия платформы": "w2j8z4ub",
};

// Функція для перевірки пароля
export function checkPassword(moduleName: string, password: string): boolean {
  return modulePasswords[moduleName] === password; // Тепер це працюватиме без помилки
}

// Запит пароля для конкретного модуля
export function requestPassword(moduleName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const storedPassword = localStorage.getItem(`access_${moduleName}`);
    if (storedPassword) {
      resolve(true);
      return;
    }

    const password = prompt(`Enter password for ${moduleName}:`);

    if (password && checkPassword(moduleName, password)) {
      // Зберігаємо доступ у localStorage
      localStorage.setItem(`access_${moduleName}`, "granted");
      alert(`Access granted to ${moduleName}`);
      resolve(true);
    } else {
      alert(`Incorrect password for ${moduleName}`);
      resolve(false);
    }
  });
}

export default ((userOpts?: Partial<Options>) => {
  const opts: Options = { ...defaultOptions, ...userOpts }
  const { OverflowList, overflowListAfterDOMLoaded } = OverflowListFactory()

  const Explorer: QuartzComponent = ({ cfg, displayClass }: QuartzComponentProps) => {
    return (
      <div
        class={classNames(displayClass, "explorer")}
        data-behavior={opts.folderClickBehavior}
        data-collapsed={opts.folderDefaultState}
        data-savestate={opts.useSavedState}
        data-data-fns={JSON.stringify({
          order: opts.order,
          sortFn: opts.sortFn.toString(),
          filterFn: opts.filterFn.toString(),
          mapFn: opts.mapFn.toString(),
        })}
      >
        <button
          type="button"
          class="explorer-toggle mobile-explorer hide-until-loaded"
          data-mobile={true}
          aria-controls="explorer-content"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            class="lucide-menu"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>

        <button
          type="button"
          class="title-button explorer-toggle desktop-explorer"
          data-mobile={false}
          aria-expanded={true}
        >
          <h2>{opts.title ?? i18n(cfg.locale).components.explorer.title}</h2>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="5 8 14 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            class="fold"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <div class="explorer-content" aria-expanded={false}>
          <OverflowList class="explorer-ul" />
        </div>

        <template id="template-file">
          <li>
            <a href="#"></a>
          </li>
        </template>

        <template id="template-folder">
          <li>
            <div class="folder-container">
              <div>
                <button class="folder-button" onClick={() => requestPassword("2. Dashboard")}>
                  <span class="folder-title">Dashboard</span>
                </button>
              </div>
            </div>
            <div class="folder-outer">
              <ul class="content"></ul>
            </div>
          </li>
        </template>
      </div>
    )
  }

  Explorer.css = style

  Explorer.afterDOMLoaded = concatenateResources(
    script,
    overflowListAfterDOMLoaded,
    `
  /* === Password protection for folders === */
  function enforcePasswordProtection() {
    const folders = document.querySelectorAll('.folder-title');
    folders.forEach(folder => {
      folder.addEventListener('click', function() {
        const folderName = folder.textContent.trim();
        if (folderName && !localStorage.getItem(\`access_\${folderName}\`)) {
          requestPassword(folderName);
        }
      });
    });
  }

  enforcePasswordProtection();
  `
  )

  return Explorer
}) satisfies QuartzComponentConstructor
