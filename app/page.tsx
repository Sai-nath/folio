"use client";

import { useMemo, useRef, useState } from "react";
import { marked, Tokens } from "marked";
import DOMPurify from "dompurify";

const starter = `# The quiet craft of clear thinking

Great documents do not call attention to themselves. They make the ideas inside them feel inevitable.

## A better way to publish

Folio turns plain Markdown into a document you can be proud to share. Write naturally, refine the details, and export when it feels right.

> “Simplicity is the soul of efficiency.”

### What makes it different

- Thoughtful typography out of the box
- Live editing with an honest preview
- Clean PDF and editable Word exports

| Format | Best for |
| --- | --- |
| PDF | Sharing a finished document |
| DOCX | Continuing work in Word |

**Your words, beautifully delivered.**`;

const themes = {
  editorial: { label: "Editorial", accent: "#9f3058", ink: "#292421", paper: "#fffdf9", font: "Georgia, 'Times New Roman', serif" },
  executive: { label: "Executive", accent: "#1e5f54", ink: "#17211f", paper: "#ffffff", font: "Arial, Helvetica, sans-serif" },
  minimal: { label: "Minimal", accent: "#3d4d76", ink: "#1f2430", paper: "#fbfcff", font: "ui-monospace, SFMono-Regular, Menlo, monospace" },
} as const;

type ThemeKey = keyof typeof themes;

function plainText(token: Tokens.Generic): string {
  if (typeof token.text === "string") return token.text.replace(/<[^>]+>/g, "");
  if (Array.isArray(token.tokens)) return token.tokens.map(plainText).join(" ");
  if (typeof token.raw === "string") return token.raw.replace(/[#>*_`\[\]]/g, "").trim();
  return "";
}

export default function Home() {
  const [markdown, setMarkdown] = useState(starter);
  const [filename, setFilename] = useState("untitled.md");
  const [themeKey, setThemeKey] = useState<ThemeKey>("editorial");
  const [customCss, setCustomCss] = useState(".document-preview h1 { letter-spacing: -0.04em; }\n.document-preview blockquote { font-style: italic; }");
  const [showCss, setShowCss] = useState(false);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const theme = themes[themeKey];

  const html = useMemo(() => {
    const dirty = marked.parse(markdown, { gfm: true, breaks: true }) as string;
    return typeof window === "undefined" ? dirty : DOMPurify.sanitize(dirty);
  }, [markdown]);
  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const openFile = (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".md") && file.type !== "text/markdown") {
      flash("Please choose a Markdown (.md) file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setMarkdown(String(reader.result ?? ""));
      setFilename(file.name);
      document.querySelector("#studio")?.scrollIntoView({ behavior: "smooth" });
    };
    reader.readAsText(file);
  };

  const exportPdf = () => {
    flash("Print dialog opened — choose “Save as PDF”.");
    window.setTimeout(() => window.print(), 150);
  };

  const exportDocx = async () => {
    flash("Preparing your Word document…");
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import("docx");
    const tokens = marked.lexer(markdown);
    const children: InstanceType<typeof Paragraph>[] = [];
    const textRun = (text: string, bold = false) => new TextRun({ text, bold, font: themeKey === "minimal" ? "Aptos Mono" : themeKey === "executive" ? "Aptos" : "Georgia", color: theme.ink.slice(1) });

    for (const token of tokens) {
      if (token.type === "heading") {
        children.push(new Paragraph({ text: plainText(token), heading: token.depth === 1 ? HeadingLevel.TITLE : token.depth === 2 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }));
      } else if (token.type === "paragraph" || token.type === "text") {
        children.push(new Paragraph({ children: [textRun(plainText(token))], spacing: { after: 180 }, lineSpacing: 320 }));
      } else if (token.type === "blockquote") {
        children.push(new Paragraph({ children: [new TextRun({ text: plainText(token), italics: true, color: theme.accent.slice(1) })], indent: { left: 420 }, border: { left: { style: BorderStyle.SINGLE, size: 14, color: theme.accent.slice(1), space: 14 } }, spacing: { before: 160, after: 200 } }));
      } else if (token.type === "list") {
        for (const item of token.items) children.push(new Paragraph({ children: [textRun(plainText(item))], bullet: token.ordered ? undefined : { level: 0 }, numbering: token.ordered ? { reference: "numbered-list", level: 0 } : undefined, spacing: { after: 80 } }));
      } else if (token.type === "code") {
        children.push(new Paragraph({ children: [new TextRun({ text: token.text, font: "Aptos Mono", size: 19, color: "3D4350" })], shading: { fill: "F2F0EB" }, spacing: { before: 120, after: 180 } }));
      } else if (token.type === "hr") {
        children.push(new Paragraph({ text: "", border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D9D3CC", space: 8 } }, spacing: { before: 160, after: 160 } }));
      } else if (token.type === "table") {
        children.push(new Paragraph({ children: [textRun(token.header.map((cell) => cell.text).join("   •   "), true)], spacing: { before: 140, after: 80 } }));
        for (const row of token.rows) children.push(new Paragraph({ children: [textRun(row.map((cell) => cell.text).join("   |   "))], spacing: { after: 70 } }));
      }
    }

    const doc = new Document({
      numbering: { config: [{ reference: "numbered-list", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 260 } } } }] }] },
      sections: [{ properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } }, children }],
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.replace(/\.md$/i, "") + ".docx";
    a.click();
    URL.revokeObjectURL(url);
    flash("DOCX downloaded.");
  };

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="Folio home"><span>F</span>Folio</a>
        <div className="nav-links"><a href="#features">Features</a><a href="#templates">Templates</a><a href="#studio">Editor</a></div>
        <button className="nav-cta" onClick={() => fileRef.current?.click()}>Open Markdown <span>↗</span></button>
      </nav>

      <section className="hero shell" id="top">
        <div className="eyebrow"><span /> Markdown, beautifully finished</div>
        <h1>From plain text to<br/><em>polished pages.</em></h1>
        <p className="hero-copy">Upload your Markdown. Refine it live. Export a document that looks like you spent hours designing it.</p>
        <div className="hero-actions">
          <button className="primary" onClick={() => fileRef.current?.click()}>Choose a .md file <span>→</span></button>
          <a className="secondary" href="#studio">Try the editor</a>
        </div>
        <p className="privacy"><span>✓</span> Private by design — your files never leave your browser</p>
        <div className="hero-rule"><span>01</span><i /><span>PDF & DOCX</span></div>
      </section>

      <section className="studio-wrap" id="studio">
        <div className="studio-heading shell">
          <div><span className="section-kicker">THE WORKSPACE</span><h2>Everything you need.<br/><em>Nothing you don’t.</em></h2></div>
          <p>Write on the left. Watch your document take shape on the right. Every change appears instantly.</p>
        </div>

        <div className="studio shell-wide">
          <div className="studio-bar">
            <div className="file-name"><span className="file-mark">M↓</span><div><b>{filename}</b><small>Saved locally</small></div></div>
            <div className="bar-tools">
              <button onClick={() => fileRef.current?.click()}>＋ Open</button>
              <button className={showCss ? "active" : ""} onClick={() => setShowCss(!showCss)}>⌘ Custom CSS</button>
              <span className="divider" />
              <button onClick={exportPdf}>↓ PDF</button>
              <button className="export" onClick={exportDocx}>↓ DOCX</button>
            </div>
          </div>
          <div className="workspace">
            <section className="editor-pane">
              <div className="pane-label"><span>MARKDOWN</span><span>{words} words</span></div>
              <textarea aria-label="Markdown editor" value={markdown} onChange={(e) => setMarkdown(e.target.value)} spellCheck="false" />
            </section>
            <section className="preview-pane">
              <div className="pane-label"><span>LIVE PREVIEW</span><span className="live"><i /> Synced</span></div>
              <article className={`paper document-preview theme-${themeKey}`} style={{ "--accent": theme.accent, "--ink": theme.ink, "--paper": theme.paper, "--doc-font": theme.font } as React.CSSProperties} dangerouslySetInnerHTML={{ __html: html }} />
            </section>
            {showCss && <aside className="css-pane">
              <div className="pane-label"><span>CUSTOM CSS</span><button onClick={() => setShowCss(false)}>×</button></div>
              <p>Fine-tune the PDF preview with your own styles.</p>
              <textarea aria-label="Custom CSS editor" value={customCss} onChange={(e) => setCustomCss(e.target.value)} spellCheck="false" />
              <small>Use <code>.document-preview</code> to target the page.</small>
            </aside>}
          </div>
        </div>
      </section>

      <section className="templates shell" id="templates">
        <div className="section-title"><span className="section-kicker">DOCUMENT STYLES</span><h2>Start with a point of view.</h2><p>Each template is tuned for clarity, character, and a beautiful printed page.</p></div>
        <div className="template-grid">
          {(Object.keys(themes) as ThemeKey[]).map((key, index) => <button key={key} className={`template-card ${themeKey === key ? "selected" : ""}`} onClick={() => setThemeKey(key)}>
            <div className={`mini-page mini-${key}`}><small>FOLIO / 0{index + 1}</small><h3>{key === "editorial" ? "The Art of\nAttention" : key === "executive" ? "Quarterly\nPerspective" : "LESS,\nBUT BETTER."}</h3><i/><p>A considered approach to ideas, structure and the page.</p></div>
            <div className="template-meta"><div><b>{themes[key].label}</b><small>{key === "editorial" ? "Refined & literary" : key === "executive" ? "Clear & authoritative" : "Crisp & modern"}</small></div><span>{themeKey === key ? "✓" : "→"}</span></div>
          </button>)}
        </div>
      </section>

      <section className="features" id="features">
        <div className="shell feature-grid">
          <div><span className="feature-no">01</span><h3>Edit without friction</h3><p>Your Markdown stays Markdown. Make changes in a focused editor and see the finished page in real time.</p></div>
          <div><span className="feature-no">02</span><h3>Make it unmistakably yours</h3><p>Choose a template, then use custom CSS for precise control over type, spacing, color, and layout.</p></div>
          <div><span className="feature-no">03</span><h3>Export with confidence</h3><p>Save a presentation-ready PDF or an editable DOCX that opens cleanly in Microsoft Word.</p></div>
        </div>
      </section>

      <footer className="shell"><a className="brand" href="#top"><span>F</span>Folio</a><p>Beautiful documents, from simple Markdown.</p><small>Built for the words that matter.</small></footer>

      <input ref={fileRef} className="sr-only" type="file" accept=".md,text/markdown,text/plain" onChange={(e) => openFile(e.target.files?.[0])} />
      <style>{customCss}</style>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}
