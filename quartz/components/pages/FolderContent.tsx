import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import style from "../styles/listPage.scss"
import { PageList, SortFn } from "../PageList"
import { Root } from "hast"
import { htmlToJsx } from "../../util/jsx"
import { i18n } from "../../i18n"
import { QuartzPluginData } from "../../plugins/vfile"
import { ComponentChildren } from "preact"
import { concatenateResources } from "../../util/resources"
import { trieFromAllFiles } from "../../util/ctx"

// @ts-ignore ─ глобальний guard (паролі, блюр, live-перевірка)
import modulesGuard from "../scripts/modules-guard.inline"

interface FolderContentOptions {
  showFolderCount: boolean
  showSubfolders: boolean
  sort?: SortFn
}

const defaultOptions: FolderContentOptions = {
  showFolderCount: true,
  showSubfolders: true,
}

export default ((opts?: Partial<FolderContentOptions>) => {
  const options: FolderContentOptions = { ...defaultOptions, ...opts }

  const FolderContent: QuartzComponent = (props: QuartzComponentProps) => {
    const { tree, fileData, allFiles, cfg } = props

    const trie = (props.ctx.trie ??= trieFromAllFiles(allFiles))
    const folder = trie.findNode(fileData.slug!.split("/"))
    if (!folder) return null

    const allPagesInFolder: QuartzPluginData[] =
      folder.children
        .map((node) => {
          if (node.data) return node.data
          if (node.isFolder && options.showSubfolders) {
            const getMostRecentDates = (): QuartzPluginData["dates"] => {
              let maybe: QuartzPluginData["dates"] | undefined
              for (const child of node.children) {
                if (child.data?.dates) {
                  if (!maybe) maybe = { ...child.data.dates }
                  else {
                    if (child.data.dates.created > maybe.created) maybe.created = child.data.dates.created
                    if (child.data.dates.modified > maybe.modified) maybe.modified = child.data.dates.modified
                    if (child.data.dates.published > maybe.published) maybe.published = child.data.dates.published
                  }
                }
              }
              return maybe ?? { created: new Date(), modified: new Date(), published: new Date() }
            }
            return { slug: node.slug, dates: getMostRecentDates(), frontmatter: { title: node.displayName, tags: [] } }
          }
        })
        .filter((page) => page !== undefined) ?? []

    const cssClasses: string[] = fileData.frontmatter?.cssclasses ?? []
    const classes = cssClasses.join(" ")
    const listProps = { ...props, sort: options.sort, allFiles: allPagesInFolder }

    const content = (
      (tree as Root).children.length === 0
        ? fileData.description
        : htmlToJsx(fileData.filePath!, tree)
    ) as ComponentChildren

    return (
      <div class="popover-hint">
        <article class={classes}>{content}</article>
        <div class="page-listing">
          {options.showFolderCount && (
            <p>
              {i18n(cfg.locale).pages.folderContent.itemsUnderFolder({
                count: allPagesInFolder.length,
              })}
            </p>
          )}
          <div>
            <PageList {...listProps} />
          </div>
        </div>
      </div>
    )
  }

  FolderContent.css = concatenateResources(style, PageList.css)

  // 🔒 підключаємо guard тут, щоб він працював на сторінках модулів/уроків
  FolderContent.afterDOMLoaded = concatenateResources(
    FolderContent.afterDOMLoaded ?? "",
    modulesGuard
  )

  return FolderContent
}) satisfies QuartzComponentConstructor
