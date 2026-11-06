# ckeditor5-advanced-markdown

Markdown as the data format of CKEditor 5, without rewriting the parts of your document you did not touch.

- `editor.getData()` / `setData()` speak Markdown (GFM, directives, YAML frontmatter, raw MDX blocks).
- An unedited document comes back byte for byte. After an edit only the edited block changes.
- Smart paste, import/export of `.md` files, a directive UI and a side-by-side Markdown source pane (CodeMirror 6).

License: `GPL-2.0-or-later`. Works with the GPL build of CKEditor 5 (`licenseKey: 'GPL'`).

## Why this exists

| Gap in `@ckeditor/ckeditor5-markdown-gfm` | What this package does |
|---|---|
| Markdown -> HTML -> Markdown rewrites the whole document; raw HTML is stripped, nested tables break (ckeditor5 #9177, #18757) | Block-level source preservation, raw blocks for what the model cannot hold |
| Plain Markdown is only recognised when the clipboard HTML is a bare span/br/pre wrapper (#2321) | Scores `text/plain`; treats wrapper-only HTML from code editors as Markdown |
| Markdown source view is a premium, modal feature | Free split view, two panes, two-way scroll sync |

## Install

```bash
npm install ckeditor5 ckeditor5-advanced-markdown
```

```ts
import { ClassicEditor } from 'ckeditor5';
import { AdvancedMarkdown } from 'ckeditor5-advanced-markdown';
import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-advanced-markdown/theme/advancedmarkdown.css';

const editor = await ClassicEditor.create( element, {
    licenseKey: 'GPL',
    plugins: [ AdvancedMarkdown ],
    initialData: markdown,
    toolbar: [
        'undo', 'redo', '|', 'heading', '|', 'bold', 'italic', 'strikethrough', 'code', 'link', '|',
        'bulletedList', 'numberedList', 'todoList', 'blockQuote', 'codeBlock', 'insertTable', 'horizontalLine', '|',
        'insertDirective', 'editDirective', '|', 'importMarkdown', 'exportMarkdown', 'splitView'
    ],
    advancedMarkdown: { export: { fileName: 'readme.md' } }
} );

editor.getData(); // Markdown
```

`AdvancedMarkdown` pulls in the safe preset (Essentials, Paragraph, Heading, Bold, Italic, Strikethrough, Code, Link,
AutoLink, List, TodoList, BlockQuote, CodeBlock, HorizontalLine, Image, Table, Autoformat). You can register the parts
(`AdvancedMarkdownEditing`, `AdvancedMarkdownPaste`, `AdvancedMarkdownImportExport`, `AdvancedMarkdownDirectiveUI`,
`AdvancedMarkdownSplitView`) individually instead, but `AdvancedMarkdownEditing` is required.

Do not combine it with `@ckeditor/ckeditor5-markdown-gfm`: both replace `editor.data.processor`.

## Toolbar items

| Item | Action |
|---|---|
| `insertDirective` | Balloon form: name, label, attributes (`.class #id key="v"`), optional leaf (`::name`) |
| `editDirective` | Same form for the selected directive; for a raw inline or raw block it edits the source |
| `importMarkdown` | Pick a `.md` file and `setData()` it; asks first if the document has unsaved changes |
| `exportMarkdown` | Downloads `getData()` as UTF-8 (`advancedMarkdown.export.fileName`, default `document.md`) |
| `splitView` | Toggles the Markdown source pane |

## Configuration

```ts
advancedMarkdown: {
    export: { fileName: 'document.md' },
    import: { confirm: message => window.confirm( message ) }, // may be async
    splitView: { debounce: 300, height: '70vh' }
}
```

## Dialect

GFM (tables, task lists, strikethrough, autolinks) plus:

- **Directives** (`remark-directive`): container `:::name[label]{attrs}`, leaf `::name`, text `:name`. Any name, no registration.
  Containers hold editable nested content; leaf and text directives are widgets.
- **YAML frontmatter**: a raw block at the top, kept as written.
- **MDX**: `import`/`export` lines, `{expressions}` and JSX blocks are kept as raw blocks. Nothing is executed or rendered.
- **HTML**, link reference definitions, footnotes: raw blocks (block level) or raw inline widgets (inline level).

Not in this version: math, GitHub alerts, TOML/JSON frontmatter.

## Guarantees

1. **Unedited documents are byte-identical.** Verified on the CommonMark 0.31.2 spec examples (652), the GFM spec examples
   (672) and 27 real READMEs (`test/corpus`, see `SOURCES.md` there for provenance and licenses).
2. **Editing one block changes only that block.** The other blocks, the blank lines between them and the file tail keep
   their bytes. If keeping a single-newline gap would merge two blocks, that one gap is widened to a blank line.
3. **Reserializing an edited block is a fixed point** on the same corpora.

How: after `setData()` the plugin records the serialization of every top-level block of the freshly loaded model
(the baseline). On `getData()` it serializes again and aligns the result with the baseline (LCS); blocks equal to the
baseline are emitted from the original source, the rest are emitted in the fixed style below. See
`docs/adr/0002-source-preserving-muc-block.md`.

Fixed output style: `-` bullets, `*` emphasis and strong, `---` rules, backtick fences, `listItemIndent: one`,
GFM tables with aligned pipes, CRLF if the document used CRLF.

### Known limits

- An edited block can change style inside itself: hard-wrapped paragraphs are joined onto one line, `_x_` becomes `*x*`,
  link titles, code fence meta, ordered list start numbers and table column alignment are not kept in the model.
- Adjacent lists of the same kind (`*` list directly followed by `-` list) are one list in CKEditor, so the pair is one block.
- Lists whose items contain anything but paragraphs and nested lists, and task lists that mix checked and plain items,
  are kept as a raw block instead of being half-mapped.
- Raw block text is committed when its textarea loses focus (or on `change`), not on every keystroke.
- When the baseline block count differs from the source block count, only the "nothing changed" shortcut applies and an
  edit rewrites the whole document in the fixed style. The test corpora do not trigger this.
- The split view synchronizes text, not the caret. Scroll sync is proportional, not block-aligned.
  Pushing text from the code pane uses `editor.data.set()` with an undoable batch, so one Ctrl+Z undoes the whole replacement.

## CK-only features

The default preset only enables what GFM can represent. If you add features that have no Markdown form (alignment,
font color, image resize, merged cells), their output is written as XHTML-valid HTML (`<p style="text-align:center;">`,
`<span style="color:red">`, self-closing `<img ... />`) instead of being stripped. On reload that HTML is a raw block, not
an editable paragraph.

Checked against `POST https://api.github.com/markdown` (GFM mode): `style` is removed (`<span style="color:red">x</span>`
renders as `<span>x</span>`), while `align="center"` and `width`/`height` on `<img>` survive. Prefer `align`-style
attributes over `style` if the Markdown is rendered on GitHub.

## Security

- MDX is never executed and no component is rendered.
- HTML in the Markdown is not interpreted by this package: it is stored as text in raw blocks / raw inlines and written
  back verbatim. The editing view shows it as text in a `<textarea>` or `<span>`, never as live HTML.
- Nothing is fetched from URLs inside raw blocks. Image `src` values are kept untouched and are not uploaded.
- **You are responsible for sanitizing the Markdown/HTML at the place where you render it.**

## Development

```bash
npm install
npm run typecheck
npm test        # ~1 minute: spec corpora and 27 READMEs run in the jsdom CKEditor
npm run dev     # Vite harness on http://localhost:5183
npm run build
```

CI should run the suite against the latest CKEditor 5 (49.x) and the previous major. The minimum supported version is
whatever that matrix proves; `peerDependencies` says `ckeditor5 >= 48.5.3`: the suite has been run locally against 48.5.3 and 49.0.1 only, versions in between are untested.

Contributions need a DCO sign-off, see `CONTRIBUTING.md`. Do not copy code from CKSource packages.
