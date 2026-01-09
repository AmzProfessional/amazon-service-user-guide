
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
                <button class="folder-button">
                  <span class="folder-title"></span>
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
  /* ===== Explorer Modules Guard (ALL modules) + robust 2s access monitor ===== */
  (function () {
    const PERIOD_DAYS = 14;
    const SALT = "AMZ-Quartz-Guard-2025-01";

    const staticPasswords = {
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
      "15. Версия платформы": "w2j8z4ub"
    };

    function passwordForModule(folderName) {
      return staticPasswords[folderName] || null;
    }

    function globalPassword() {
      return "globalStaticPassword"; // Ви можете змінити цей пароль на глобальний статичний
    }

    const mkOverlay = (blur) => {
      var ov = document.createElement("div");
      Object.assign(ov.style, { position: "fixed", inset: "0", background: "rgba(0,0,0,.45)", zIndex: 9998,
        backdropFilter: blur ? "blur(8px)" : "", WebkitBackdropFilter: blur ? "blur(8px)" : "" });
      return ov;
    };

    const mkBox = () => {
      var bx = document.createElement("div");
      Object.assign(bx.style, { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        background: "#2b2b33", color: "#fff", padding: "20px", borderRadius: "14px",
        boxShadow: "0 12px 36px rgba(0,0,0,.35)", width: "min(560px, 92vw)", zIndex: 9999, fontFamily: "inherit" });
      return bx;
    };

    const showPasswordModal = (folderName) => new Promise((resolve) => {
      var overlay = mkOverlay(true);
      var box = mkBox();
      var inputStyle =
        "width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #444;" +
        "border-radius:10px;background:#1f1f1f;color:#fff;outline:none";
      var primaryBtn = "flex:1;padding:12px 14px;border:0;border-radius:10px;cursor:pointer;background:#5b5bd6;color:#fff";
      var secondaryBtn = "flex:1;padding:12px 14px;border:0;border-radius:10px;cursor:pointer;background:#444;color:#eee";

      box.innerHTML =
        '<h3 style="margin:0 0 12px 0;color:#fff;">Введіть пароль для: <b>' + folderName + '</b></h3>' +
        '<input id="module-pass" type="password" placeholder="Пароль (8 символів)" style="' + inputStyle + '">' +
        '<div id="module-err" style="color:#ff6b6b;margin:8px 0 0 0;display:none">Невірний пароль</div>' +
        '<div style="display:flex;gap:10px;margin-top:14px">' +
          '<button id="module-ok" style="' + primaryBtn + '">Увійти</button>' +
          '<button id="module-cancel" style="' + secondaryBtn + '">Скасувати</button>' +
        '</div>' +
        '<div style="margin-top:10px;opacity:.9;font-size:.9em">Доступ збережеться до кінця поточного 14-денного періоду.</div>';

      var cleanup = function() { document.body.style.overflow = ""; overlay.remove(); box.remove(); };

      document.body.append(overlay, box);
      document.body.style.overflow = "hidden";

      var input = box.querySelector("#module-pass");
      var err = box.querySelector("#module-err");
      var okBtn = box.querySelector("#module-ok");
      var cancelBtn = box.querySelector("#module-cancel");

      var submit = function() {
        var pass = (input && input.value ? input.value : "").trim();
        if (pass === passwordForModule(folderName) || pass === globalPassword()) { 
          cleanup(); 
          resolve(true); 
        }
        else { 
          if (err) err.style.display = "block"; 
        }
      };

      okBtn && okBtn.addEventListener("click", submit);
      input && input.addEventListener("keydown", function (e) { if (e && e.key === "Enter") submit(); });

      // Обробник для кнопки "Скасувати"
      cancelBtn && cancelBtn.addEventListener("click", function () { 
        cleanup(); 
        window.location.href = "https://amzprofessional.github.io/amazon-service-user-guide/";  // Перехід на головну сторінку
        resolve(false); 
      });

      // Обробник для натискання на фон (клік за межами попапу)
      overlay.addEventListener("click", function () { 
        cleanup(); 
        window.location.href = "https://amzprofessional.github.io/amazon-service-user-guide/";  // Перехід на головну сторінку
        resolve(false); 
      });

      input && input.focus();
    });

    // Обробник події для натискання на папки
    document.addEventListener('click', function (event) {
      var clickedElement = event.target;
      
      // Перевірка, чи натиснули на назву папки
      if (clickedElement && clickedElement.classList.contains('folder-title')) {
        var folderName = clickedElement.textContent.trim();
        if (staticPasswords[folderName]) {
          // Зупинити перехід на нову сторінку
          event.preventDefault();
          // Відкриття модального вікна для введення пароля
          showPasswordModal(folderName).then((accessGranted) => {
            if (accessGranted) {
              console.log("Доступ дозволено до папки: " + folderName);
              // Якщо пароль вірний, дозволяємо перехід
              window.location.href = clickedElement.closest("a").href;
            }
          });
        }
      }
    });

    const showPasswordsHelp = () => {
      var titles = Array.prototype.slice.call(document.querySelectorAll(".folder-title"))
        .map(function (el) { return el && el.textContent ? el.textContent.trim() : ""; })
        .filter(function (t) { return t && staticPasswords[t]; });
      var uniq = Array.from(new Set(titles)).sort(function(a,b){ return a.localeCompare(b, 'uk', {numeric:true, sensitivity:'base'}); });
      var overlay = mkOverlay(true);
      var box = mkBox();

      var rows = uniq.map(function (name) {
        var pw = staticPasswords[name];
        return '<tr><td style="padding:6px 10px;border-bottom:1px solid #3a3a44; color:#fff; white-space:nowrap;">' + name + '</td>' +
               '<td style="padding:6px 10px;border-bottom:1px solid #3a3a44; color:#fff;font-family:ui-monospace, SFMono-Regular, Menlo, monospace;">' + pw + '</td></tr>';
      }).join("");

      if (!rows) rows = '<tr><td colspan="2" style="padding:10px;opacity:.8">Модулі не знайдені на цій сторінці.</td></tr>';

      box.innerHTML =
        '<h3 style="margin:0 0 12px 0;">Актуальні паролі</h3>' +
        '<div style="max-height:min(60vh,480px);overflow:auto;border:1px solid #3a3a44;border-radius:10px">' +
          '<table style="width:100%;border-collapse:collapse;font-size:14px">' +
            '<thead><tr>' +
              '<th style="text-align:left;padding:8px 10px;border-bottom:1px solid #3a3a44; color:#fff; opacity:.8">Модуль</th>' +
              '<th style="text-align:left;padding:8px 10px;border-bottom:1px solid #3a3a44; color:#fff; opacity:.8">Пароль</th>' +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
        '</div>' +
        '<div style="display:flex;gap:10px;margin-top:14px">' +
          '<button id="pw-close" style="flex:1;padding:12px 14px;border:0;border-radius:10px;cursor:pointer;background:#5b5bd6;color:#fff">Закрити</button>' +
        '</div>';

      var cleanup = function() { document.body.style.overflow = ""; overlay.remove(); box.remove(); };

      document.body.append(overlay, box);
      document.body.style.overflow = "hidden";

      box.querySelector("#pw-close")?.addEventListener("click", cleanup);
      overlay.addEventListener("click", cleanup);
    };

    // === Hotkey Ctrl+Alt+P — Show current passwords
    document.addEventListener("keydown", function (e) {
      try {
        if (e && e.ctrlKey && e.altKey && (e.key === "p" || e.key === "P")) {
          e.preventDefault();
          showPasswordsHelp();
        }
      } catch(_) {}
    });

    /* ===== /Explorer Modules Guard ===== */

  })();
  `
)

  return Explorer
}) satisfies QuartzComponentConstructor
