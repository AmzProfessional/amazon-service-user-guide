import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/explorer.scss"

// @ts-ignore
import script from "./scripts/explorer.inline"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"
import { FileTrieNode } from "../util/fileTrie"
import OverflowListFactory from "./OverflowList"
import { concatenateResources } from "../util/resources"
// import modulesGuard from "./scripts/modules-guard.inline"

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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="5 8 14 8"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="folder-icon"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
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

      const showPasswordModal = (folderName) => new Promise((resolve) => {
        const overlay = document.createElement("div");
        Object.assign(overlay.style, { position: "fixed", inset: "0", background: "rgba(0,0,0,.35)", zIndex: 9998 });

        const box = document.createElement("div");
        Object.assign(box.style, {
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          background: "#fff", padding: "20px", borderRadius: "10px",
          boxShadow: "0 8px 24px rgba(0,0,0,.2)", width: "min(420px,90vw)", zIndex: 9999
        });

        box.innerHTML =
          '<h3 style="margin:0 0 12px 0">Введіть пароль для: <b>' + folderName + '</b></h3>' +
          '<input id="module-pass" type="password" placeholder="Пароль" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px">' +
          '<div id="module-err" style="color:#d11;margin:8px 0 0 0;display:none">Невірний пароль</div>' +
          '<div style="display:flex;gap:8px;margin-top:14px">' +
            '<button id="module-ok" style="flex:1;padding:10px;border:0;border-radius:8px;cursor:pointer">Увійти</button>' +
            '<button id="module-cancel" style="flex:1;padding:10px;border:0;border-radius:8px;background:#eee;cursor:pointer">Скасувати</button>' +
          '</div>' +
          '<div style="margin-top:10px;color:#666;font-size:.9em">Доступ збережеться до кінця поточного ' + PERIOD_DAYS + '-денного періоду.</div>';

        const cleanup = () => { document.body.style.overflow = ""; overlay.remove(); box.remove(); };

        document.body.append(overlay, box);
        document.body.style.overflow = "hidden";

        const input = box.querySelector("#module-pass");
        const err = box.querySelector("#module-err");

        const submit = () => {
          const pass = (input && input.value ? input.value : "").trim();
          if (pass === expectedPassword(folderName)) { cleanup(); resolve(true); }
          else { if (err) err.style.display = "block"; }
        };

        const okBtn = box.querySelector("#module-ok");
        const cancelBtn = box.querySelector("#module-cancel");

        okBtn?.addEventListener("click", submit);
  input?.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
        cancelBtn?.addEventListener("click", () => { cleanup(); resolve(false); });
        overlay.addEventListener("click", () => { cleanup(); resolve(false); });

  input && input.focus();
      });

      // перехоплюємо клік у фазі capture (щоб встигнути заблокувати)
      document.addEventListener("click", async (ev) => {
        const el = ev.target;
        if (!(el instanceof Element)) return;

        const folderBtn = el.closest(".folder-button");
        const folderTitle = el.closest(".folder-title");
        if (!folderBtn && !folderTitle) return;

        const titleEl = (folderTitle || (folderBtn ? folderBtn.querySelector(".folder-title") : null));
        const folderName = (titleEl && titleEl.textContent ? titleEl.textContent : "").trim();

        if (!isModuleFolder(folderName)) return;
        if (hasAccess(folderName)) return;

        ev.preventDefault();
        ev.stopPropagation();

        const ok = await showPasswordModal(folderName);
        if (ok) {
          grantAccess(folderName);
          requestAnimationFrame(() => {
            const target = folderBtn || folderTitle;
            if (target) target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          });
        }
      }, true);
    })();
    `
  )

  return Explorer
}) satisfies QuartzComponentConstructor
