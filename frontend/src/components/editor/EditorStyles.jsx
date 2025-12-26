const EditorStyles = () => {
  return (
    <style>{`
      .tiptap-editor h1 {
        font-size: 42px;
        font-weight: 700;
        margin-top: 56px;
        margin-bottom: 6px;
        line-height: 1.04;
        letter-spacing: -0.015em;
      }
      .tiptap-editor h2 {
        font-size: 34px;
        font-weight: 700;
        margin-top: 43px;
        margin-bottom: 4px;
        line-height: 1.15;
        letter-spacing: -0.015em;
      }
      .tiptap-editor h3 {
        font-size: 28px;
        font-weight: 700;
        margin-top: 39px;
        margin-bottom: 4px;
        line-height: 1.22;
        letter-spacing: -0.012em;
      }
      .tiptap-editor h4 {
        font-size: 24px;
        font-weight: 700;
        margin-top: 34px;
        margin-bottom: 4px;
        line-height: 1.33;
      }
      .tiptap-editor h5 {
        font-size: 22px;
        font-weight: 700;
        margin-top: 32px;
        margin-bottom: 4px;
        line-height: 1.4;
      }
      .tiptap-editor h6 {
        font-size: 20px;
        font-weight: 700;
        margin-top: 29px;
        margin-bottom: 4px;
        line-height: 1.45;
      }
      .tiptap-editor ul, .tiptap-editor ol {
        margin: 29px 0;
        padding-left: 30px;
      }
      .tiptap-editor ul {
        list-style-type: disc;
      }
      .tiptap-editor ol {
        list-style-type: decimal;
      }
      .tiptap-editor li {
        margin-top: 8px;
        font-size: 21px;
        line-height: 1.58;
      }
      .tiptap-editor blockquote {
        border-left: 3px solid rgba(0, 0, 0, 0.84);
        padding-left: 20px;
        margin: 29px 0;
        margin-left: -23px;
        padding-bottom: 3px;
        font-style: italic;
        font-size: 21px;
        line-height: 1.58;
      }
      .tiptap-editor code {
        background-color: #f3f4f6;
        padding: 0.2em 0.4em;
        border-radius: 0.25rem;
        font-size: 0.875em;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      .tiptap-editor pre {
        background-color: #f3f4f6;
        padding: 1em;
        border-radius: 0.5rem;
        overflow-x: auto;
        margin: 1em 0;
      }
      .tiptap-editor pre code {
        background-color: transparent;
        padding: 0;
      }
      .tiptap-editor {
        max-width: 680px;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 21px;
        line-height: 1.58;
        letter-spacing: -0.003em;
        color: rgba(0, 0, 0, 0.84);
      }
      .tiptap-editor img {
        max-width: 100%;
        border-radius: 3px;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .tiptap-editor img:hover {
        opacity: 0.9;
        outline: 2px solid #64748b;
        outline-offset: 2px;
      }
      /* Default image styling when no custom style is applied */
      .tiptap-editor img:not([style*="float"]) {
        display: block;
        margin: 43px auto;
        max-height: 600px;
        object-fit: contain;
      }
      /* Support for floated images */
      .tiptap-editor img[style*="float: left"] {
        float: left;
        margin-right: 20px;
        margin-bottom: 10px;
      }
      .tiptap-editor img[style*="float: right"] {
        float: right;
        margin-left: 20px;
        margin-bottom: 10px;
      }
      /* Clear floats after paragraphs with floated images */
      .tiptap-editor p:has(img[style*="float"])::after {
        content: "";
        display: table;
        clear: both;
      }
      .tiptap-editor p {
        margin-bottom: 0;
        margin-top: 0;
        font-size: 21px;
        line-height: 1.58;
        letter-spacing: -0.003em;
      }
      /* Clear floats after paragraphs */
      .tiptap-editor p::after {
        content: "";
        display: block;
        clear: both;
      }
      .tiptap-editor p:has(img) {
        margin: 0;
      }
      .tiptap-editor p:has(img:not([style*="float"])) img {
        margin: 43px auto;
      }
      .tiptap-editor video {
        max-width: 100%;
        width: 100%;
        height: auto;
        margin: 43px auto;
        display: block;
        border-radius: 3px;
      }
      .tiptap-editor iframe {
        max-width: 100%;
        width: 100%;
        height: auto;
        min-height: 400px;
        margin: 43px auto;
        border: none;
        display: block;
        border-radius: 3px;
      }
      @media (max-width: 768px) {
        .tiptap-editor {
          font-size: 18px;
          line-height: 1.58;
        }
        .tiptap-editor h1 {
          font-size: 32px;
        }
        .tiptap-editor h2 {
          font-size: 28px;
        }
        .tiptap-editor h3 {
          font-size: 24px;
        }
        .tiptap-editor p {
          font-size: 18px;
        }
        .tiptap-editor li {
          font-size: 18px;
        }
        .tiptap-editor blockquote {
          font-size: 18px;
          margin-left: -20px;
          padding-left: 15px;
        }
        .tiptap-editor img {
          margin: 32px auto;
          max-height: 400px;
        }
        .tiptap-editor video {
          margin: 32px auto;
        }
        .tiptap-editor iframe {
          min-height: 300px;
          margin: 32px auto;
        }
      }
      .tiptap-editor a {
        color: #475569;
        text-decoration: underline;
      }
      .tiptap-editor strong {
        font-weight: 700;
      }
      .tiptap-editor em {
        font-style: italic;
      }
      .tiptap-editor u {
        text-decoration: underline;
      }
      .tiptap-editor s {
        text-decoration: line-through;
      }
      .tiptap-editor p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: left;
        color: #9ca3af;
        pointer-events: none;
        height: 0;
      }
      /* Table Styles */
      .tiptap-editor table {
        border-collapse: collapse;
        table-layout: fixed;
        width: 100%;
        margin: 1.5em 0;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
      }
      .tiptap-editor table td,
      .tiptap-editor table th {
        min-width: 1em;
        border: 1px solid #e5e7eb;
        padding: 8px 12px;
        vertical-align: top;
        box-sizing: border-box;
        position: relative;
      }
      .tiptap-editor table th {
        font-weight: 600;
        text-align: left;
        background-color: #f9fafb;
        color: #374151;
      }
      .tiptap-editor table .selectedCell:after {
        z-index: 2;
        position: absolute;
        content: "";
        left: 0; right: 0; top: 0; bottom: 0;
        background: rgba(200, 200, 255, 0.4);
        pointer-events: none;
      }
      .tiptap-editor table .column-resize-handle {
        position: absolute;
        right: -2px;
        top: 0;
        bottom: -2px;
        width: 4px;
        background-color: #64748b;
        pointer-events: none;
      }
      .tiptap-editor table p {
        margin: 0;
      }
      .blog-table {
        border-collapse: collapse;
        margin: 1.5em 0;
        width: 100%;
        overflow: hidden;
      }
    `}</style>
  );
};

export default EditorStyles;

