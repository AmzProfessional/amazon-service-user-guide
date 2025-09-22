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
    // Sort order: folders first, then files. Sort folders and files alphabeticall
    if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
      // numeric: true: Whether numeric collation should be used, such that "1" < "2" < "10"
      // sensitivity: "base": Only strings that differ in base letters compare as unequal. Examples: a ≠ b, a = á, a = A
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
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
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
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
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
    /* ===== Explorer Modules Guard (ALL modules) ===== */
    (function () {
      const PERIOD_DAYS = 14;
      const DEFAULT_PASSWORD = "12345";
      const PASSWORDS_PER_MODULE = { /* "1 модуль": "m1", "2 модуль": "m2" */ };

      const nowMs = () => Date.now();
      const periodIndex = () => Math.floor(nowMs() / (PERIOD_DAYS * 86400e3));
      const periodEndISO = () => new Date((periodIndex() + 1) * PERIOD_DAYS * 86400e3).toISOString();

      // блокуємо "N модуль" або "N module"
      const isModuleFolder = (name) => {
        if (!name) return false;
        return /^\\s*\\d+\\s*(модуль|module)/i.test(name.trim());
      };

      const accessKey = (folderName) => 'moduleAccess::' + folderName + '::p' + periodIndex();

      const hasAccess = (folderName) => {
        try {
          const raw = localStorage.getItem(accessKey(folderName));
          if (!raw) return false;
          const data = JSON.parse(raw);
          const granted = !!data.granted;
          const expiresAt = data.expiresAt ? new Date(data.expiresAt).getTime() : 0;
          if (!granted) return false;
          if (expiresAt && expiresAt < nowMs()) return false;
          return true;
        } catch { return false; }
      };

      const grantAccess = (folderName) => {
        localStorage.setItem(
          accessKey(folderName),
          JSON.stringify({ granted: true, expiresAt: periodEndISO() })
        );
      };

      const expectedPassword = (folderName) =>
        PASSWORDS_PER_MODULE[folderName] ?? DEFAULT_PASSWORD;

      // === Модалка (blur фон, білий текст, input не "вилазить", темна/світла тема ок) ===
      const showPasswordModal = (folderName) => new Promise((resolve) => {
        var isDark = false;
        try {
          isDark =
            (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
            document.documentElement.classList.contains('dark') ||
            document.body.classList.contains('dark');
        } catch(e){}

        var overlay = document.createElement("div");
        Object.assign(overlay.style, {
          position: "fixed",
          inset: "0",
          background: isDark ? "rgba(0,0,0,.45)" : "rgba(0,0,0,.35)",
          zIndex: 9998,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)"
        });

        var box = document.createElement("div");
        Object.assign(box.style, {
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          background: isDark ? "#1f1f1f" : "#2b2b33",
          color: "#fff", /* форсуємо білий текст у всій модалці */
          padding: "20px", borderRadius: "14px",
          boxShadow: "0 12px 36px rgba(0,0,0,.35)",
          width: "min(520px, 92vw)",
          zIndex: 9999, fontFamily: "inherit"
        });

        var inputStyle =
          "width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid " + (isDark ? "#333" : "#444") +
          ";border-radius:10px;background:#1f1f1f;color:#fff;outline:none";

        var primaryBtn =
          "flex:1;padding:12px 14px;border:0;border-radius:10px;cursor:pointer;" +
          "background:#5b5bd6;color:#fff";

        var secondaryBtn =
          "flex:1;padding:12px 14px;border:0;border-radius:10px;cursor:pointer;" +
          "background:#444;color:#eee";

        box.innerHTML =
          '<h3 style="margin:0 0 12px 0;">Введіть пароль для: <b>' + folderName + '</b></h3>' +
          '<input id="module-pass" type="password" placeholder="Пароль" style="' + inputStyle + '">' +
          '<div id="module-err" style="color:#ff6b6b;margin:8px 0 0 0;display:none">Невірний пароль</div>' +
          '<div style="display:flex;gap:10px;margin-top:14px">' +
            '<button id="module-ok" style="' + primaryBtn + '">Увійти</button>' +
            '<button id="module-cancel" style="' + secondaryBtn + '">Скасувати</button>' +
          '</div>' +
          '<div style="margin-top:10px;opacity:.9;font-size:.9em">Доступ збережеться до кінця поточного ' + PERIOD_DAYS + '-денного періоду.</div>';

        var cleanup = function() { document.body.style.overflow = ""; overlay.remove(); box.remove(); };

        document.body.append(overlay, box);
        document.body.style.overflow = "hidden";

        var input = box.querySelector("#module-pass");
        var err = box.querySelector("#module-err");
        var okBtn = box.querySelector("#module-ok");
        var cancelBtn = box.querySelector("#module-cancel");

        var submit = function() {
          var pass = (input && input.value ? input.value : "").trim();
          if (pass === expectedPassword(folderName)) { cleanup(); resolve(true); }
          else { if (err) err.style.display = "block"; }
        };

        okBtn && okBtn.addEventListener("click", submit);
        input && input.addEventListener("keydown", function (e) { if (e && e.key === "Enter") submit(); });
        cancelBtn && cancelBtn.addEventListener("click", function () { cleanup(); resolve(false); });
        overlay.addEventListener("click", function () { cleanup(); resolve(false); });

        input && input.focus();
      });

      // === Перехоплення кліків у фазі capture НА КОНТЕЙНЕРІ .explorer (ловимо будь-який клік по рядку папки) ===
      document.querySelector(".explorer")?.addEventListener("click", async function (ev) {
        var el = ev.target;
        if (!(el instanceof Element)) return;

        // піднімаємось до <li> вузла папки
        var li = el.closest("li");
        if (!li) return;

        // назва папки завжди в .folder-title
        var titleEl = li.querySelector(".folder-title");
        var folderName = titleEl && titleEl.textContent ? titleEl.textContent.trim() : "";
        if (!folderName) return;

        if (!isModuleFolder(folderName)) return;
        if (hasAccess(folderName)) return;

        // блокуємо стандартну дію (розкриття)
        ev.preventDefault();
        ev.stopPropagation();

        var ok = await showPasswordModal(folderName);
        if (ok) {
          grantAccess(folderName);
          // повторний "нормальний" клік для розкриття
          requestAnimationFrame(function () {
            titleEl && titleEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          });
        }
      }, true);

      // === Guard для прямих лінків у середину модуля (blur + редірект на домашню) ===
      (function () {
        try {
          var computeHomePath = function () {
            var parts = (location.pathname || "/").split("/").filter(Boolean);
            // якщо перший сегмент схожий на "2-модуль" — сайт у корені
            if (parts.length === 0 || /^\\d+/.test(parts[0])) return "/";
            return "/" + parts[0] + "/";
          };
          var HOME = computeHomePath();

          var path = decodeURIComponent(location.pathname || "");
          var first = path.replace(/^\\/+/, "").split("/")[0] || "";
          if (!first) return;

          var normalized = first.replace(/-/g, " ").trim(); // "1-модуль" -> "1 модуль"

          if (!isModuleFolder(normalized)) return;
          if (hasAccess(normalized)) return;

          // миттєво ховаємо сторінку за оверлеєм з блюром
          var cover = document.createElement("div");
          Object.assign(cover.style, {
            position: "fixed", inset: "0", zIndex: 9997,
            background: "rgba(0,0,0,.6)",
            backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)"
          });
          document.body.append(cover);
          document.body.style.overflow = "hidden";

          showPasswordModal(normalized).then(function (ok) {
            if (ok) {
              try { cover.remove(); } catch(e){}
              document.body.style.overflow = "";
            } else {
              try { location.href = HOME; } catch(e){}
            }
          });
        } catch(e){}
      })();

    })();
    `
  )

  return Explorer
}) satisfies QuartzComponentConstructor

