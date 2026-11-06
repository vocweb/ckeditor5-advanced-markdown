import { ClassicEditor } from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import '../theme/advancedmarkdown.css';
import { AdvancedMarkdown } from '../src/index.js';

const SAMPLE = `---
title: Demo
tags: [a, b]
---

# Advanced Markdown

Hard wrapped paragraph that
continues on a second line, with **bold**, *italic*, \`code\` and a [link](https://example.com).

:::note[Heads up]{.warn}
A container directive with **nested** content.

- one
- two
:::

::video{src="demo.mp4"}

| Name | Qty |
|:-----|----:|
| a    |   1 |
| b    |   2 |

- [x] task done
- [ ] task open

<details>
<summary>Raw HTML block</summary>
kept as a raw block
</details>

import Chart from './chart'

\`\`\`js
console.log('hi');
\`\`\`
`;

const editor = await ClassicEditor.create( document.querySelector( '#editor' ) as HTMLElement, {
    licenseKey: 'GPL',
    plugins: [ AdvancedMarkdown ],
    initialData: SAMPLE,
    toolbar: [
        'undo', 'redo', '|', 'heading', '|', 'bold', 'italic', 'strikethrough', 'code', 'link', '|',
        'bulletedList', 'numberedList', 'todoList', 'blockQuote', 'codeBlock', 'insertTable', 'horizontalLine', '|',
        'insertDirective', 'editDirective', '|', 'importMarkdown', 'exportMarkdown', 'splitView'
    ],
    advancedMarkdown: { export: { fileName: 'demo.md' } }
} );

( window as any ).editor = editor;
( window as any ).SAMPLE = SAMPLE;

const log = document.querySelector( '#log' ) as HTMLElement;

document.querySelector( '#get' )!.addEventListener( 'click', () => {
    log.textContent = editor.getData();
} );
