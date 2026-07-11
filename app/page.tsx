"use client";

import { useMemo, useRef, useState } from "react";
import { marked, Tokens } from "marked";
import DOMPurify from "dompurify";

const starter = `# Software Requirements Specification

**Project:** Folio Document Studio  
**Version:** 1.0  
**Status:** Draft

## 1. Introduction

### 1.1 Purpose

This document defines the functional and non-functional requirements for a professional Markdown publishing workspace.

### 1.2 Scope

The system allows users to upload Markdown, edit it live, apply a document standard, and export a polished PDF or editable Word document.

## 2. System Overview

> The source Markdown remains private and is processed inside the browser.

## 3. Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-001 | The system shall accept a valid .md file. | Must |
| FR-002 | The system shall display a live document preview. | Must |
| FR-003 | The system shall export PDF and DOCX. | Must |

## 4. Non-Functional Requirements

- **NFR-001 — Privacy:** Source files shall not leave the browser.
- **NFR-002 — Usability:** Export shall require no specialist knowledge.
- **NFR-003 — Compatibility:** DOCX output shall open in Microsoft Word.

## 5. Acceptance Criteria

1. Uploading a Markdown file displays its content.
2. Changing a template updates the preview immediately.
3. The exported document preserves the selected professional style.`;

const themes = {
  legal: { label: "Legal & Policy", category: "Policies, terms & agreements", accent: "#24466f", ink: "#202733", paper: "#fffefa", font: "Georgia, 'Times New Roman', serif", wordFont: "Cambria", sample: "PRIVACY\nPOLICY", description: "Formal, trustworthy and clause-ready" },
  srs: { label: "SRS Standard", category: "Requirements & specifications", accent: "#145a7a", ink: "#17252d", paper: "#ffffff", font: "Arial, Helvetica, sans-serif", wordFont: "Aptos", sample: "SOFTWARE\nREQUIREMENTS", description: "Structured, numbered and audit-ready" },
  architecture: { label: "Architecture", category: "System design documents", accent: "#5b4b9a", ink: "#222236", paper: "#fcfcff", font: "Arial, Helvetica, sans-serif", wordFont: "Aptos", sample: "SYSTEM\nARCHITECTURE", description: "Technical, precise and diagram-friendly" },
  executive: { label: "Executive", category: "Reports & proposals", accent: "#1e5f54", ink: "#17211f", paper: "#ffffff", font: "Arial, Helvetica, sans-serif", wordFont: "Aptos", sample: "QUARTERLY\nPERSPECTIVE", description: "Clear, authoritative and board-ready" },
  editorial: { label: "Editorial", category: "Articles & long-form", accent: "#9f3058", ink: "#292421", paper: "#fffdf9", font: "Georgia, 'Times New Roman', serif", wordFont: "Georgia", sample: "THE ART OF\nATTENTION", description: "Refined, literary and expressive" },
  academic: { label: "Academic", category: "Research & white papers", accent: "#7a3525", ink: "#27211f", paper: "#fffefa", font: "Georgia, 'Times New Roman', serif", wordFont: "Cambria", sample: "RESEARCH\nPAPER", description: "Formal, readable and citation-ready" },
  minimal: { label: "Technical Minimal", category: "Developer documentation", accent: "#3d4d76", ink: "#1f2430", paper: "#fbfcff", font: "ui-monospace, SFMono-Regular, Menlo, monospace", wordFont: "Aptos Mono", sample: "LESS,\nBUT BETTER.", description: "Crisp, modern and code-focused" },
} as const;

const cssPresets = {
  policy: { label: "Policy", description: "Legal clauses & definitions", css: `.document-preview { font-family: Georgia, serif; color: #202733; }\n.document-preview h1 { text-align: center; border: 0; font-size: 38px; }\n.document-preview h2 { color: #24466f; border-bottom: 1px solid #b9c5d3; }\n.document-preview p { text-align: justify; hyphens: auto; }\n.document-preview strong { color: #172f4d; }` },
  corporate: { label: "Corporate", description: "Clean business reporting", css: `.document-preview { font-family: Arial, sans-serif; }\n.document-preview h1 { color: #16324f; border-bottom: 4px solid #2d6a8e; padding-bottom: 16px; }\n.document-preview h2 { color: #2d6a8e; }\n.document-preview table { box-shadow: 0 0 0 1px #d5dce3; }` },
  modern: { label: "Modern", description: "Bold contemporary hierarchy", css: `.document-preview { font-family: Arial, sans-serif; }\n.document-preview h1 { font-size: 44px; letter-spacing: -0.05em; }\n.document-preview h2 { border-left: 5px solid var(--accent); padding-left: 14px; }\n.document-preview blockquote { border-radius: 4px; background: #f3f5f7; }` },
  classic: { label: "Classic", description: "Traditional book typography", css: `.document-preview { font-family: Georgia, serif; }\n.document-preview h1 { text-align: center; font-weight: 400; }\n.document-preview h2 { color: #292421; font-variant: small-caps; letter-spacing: .04em; }\n.document-preview p { text-align: justify; text-indent: 1.4em; }` },
  compact: { label: "Compact", description: "Dense policy or handbook", css: `.document-preview p, .document-preview li { font-size: 10.5px; line-height: 1.45; }\n.document-preview h2 { margin-top: 22px; margin-bottom: 7px; }\n.document-preview h3 { margin-top: 16px; margin-bottom: 5px; }\n.document-preview table { margin: 12px 0; }` },
  spacious: { label: "Spacious", description: "Premium generous layout", css: `.document-preview p, .document-preview li { line-height: 1.95; }\n.document-preview h2 { margin-top: 52px; margin-bottom: 18px; }\n.document-preview h3 { margin-top: 34px; }\n.document-preview table { margin: 34px 0; }` },
  technical: { label: "Technical", description: "Code & architecture docs", css: `.document-preview { font-family: Arial, sans-serif; }\n.document-preview h2 { color: #4d3d8f; border-left: 4px solid #6b5bb0; padding-left: 12px; }\n.document-preview code { color: #8b2f57; }\n.document-preview pre { border: 1px solid #d8d7df; border-radius: 5px; }` },
  accessible: { label: "Accessible", description: "High contrast & readable", css: `.document-preview { font-family: Arial, sans-serif; color: #111; }\n.document-preview p, .document-preview li { font-size: 14px; line-height: 1.8; }\n.document-preview h1, .document-preview h2, .document-preview h3 { color: #111; }\n.document-preview a { color: #0047ab; text-decoration: underline; }` },
} as const;

type ThemeKey = keyof typeof themes;
type CssPresetKey = keyof typeof cssPresets;
type PageSize = "a4" | "letter";
type MarginSize = "narrow" | "normal" | "wide";

function plainText(token: Tokens.Generic): string {
  if (typeof token.text === "string") return token.text.replace(/<[^>]+>/g, "");
  if (Array.isArray(token.tokens)) return token.tokens.map(plainText).join(" ");
  if (typeof token.raw === "string") return token.raw.replace(/[#>*_`\[\]]/g, "").trim();
  return "";
}

export default function Home() {
  const [markdown, setMarkdown] = useState(starter);
  const [filename, setFilename] = useState("software-requirements.md");
  const [themeKey, setThemeKey] = useState<ThemeKey>("srs");
  const [customCss, setCustomCss] = useState(".document-preview h1 { letter-spacing: -0.035em; }\n.document-preview table { break-inside: avoid; }");
  const [activePreset, setActivePreset] = useState<CssPresetKey | "custom">("custom");
  const [accentOverride, setAccentOverride] = useState("");
  const [bodySize, setBodySize] = useState(12.5);
  const [lineHeight, setLineHeight] = useState(1.72);
  const [panel, setPanel] = useState<"settings" | "css" | null>(null);
  const [notice, setNotice] = useState("");
  const [title, setTitle] = useState("Software Requirements Specification");
  const [author, setAuthor] = useState("Product & Engineering Team");
  const [organization, setOrganization] = useState("Your Organization");
  const [version, setVersion] = useState("1.0");
  const [classification, setClassification] = useState("Internal");
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [marginSize, setMarginSize] = useState<MarginSize>("normal");
  const [coverPage, setCoverPage] = useState(true);
  const [tableOfContents, setTableOfContents] = useState(true);
  const [numberedHeadings, setNumberedHeadings] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [zoom, setZoom] = useState(95);
  const fileRef = useRef<HTMLInputElement>(null);
  const theme = themes[themeKey];
  const activeAccent = accentOverride || theme.accent;

  const html = useMemo(() => {
    const previewMarkdown = numberedHeadings ? markdown.replace(/^(#{2,3})\s+\d+(?:\.\d+)*\.?\s+/gm, "$1 ") : markdown;
    const dirty = marked.parse(previewMarkdown, { gfm: true, breaks: true }) as string;
    return typeof window === "undefined" ? dirty : DOMPurify.sanitize(dirty);
  }, [markdown, numberedHeadings]);
  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(words / 220));
  const padding = marginSize === "narrow" ? "42px" : marginSize === "wide" ? "88px" : "68px";

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
      const value = String(reader.result ?? "");
      setMarkdown(value);
      setFilename(file.name);
      const firstHeading = value.match(/^#\s+(.+)$/m)?.[1]?.trim();
      const lines = value.split(/\r?\n/).map((line) => line.replace(/^#+\s*|[*_`>]/g, "").trim()).filter(Boolean);
      const namedLine = lines.slice(0, 60).filter((line) => line.length <= 100 && /privacy policy|terms(?: of (?:use|service))?|user agreement|cookie policy|refund policy|acceptable use|service agreement/i.test(line)).sort((a, b) => a.length - b.length)[0];
      const filenameTitle = file.name.replace(/\.md$/i, "").replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
      const detectedTitle = firstHeading || namedLine || filenameTitle || "Untitled Document";
      const fingerprint = `${file.name}\n${value.slice(0, 8000)}`.toLowerCase();
      setTitle(detectedTitle);
      if (/privacy|terms|policy|agreement|legal|cookie/.test(fingerprint)) {
        setThemeKey("legal");
        setCustomCss(cssPresets.policy.css);
        setActivePreset("policy");
        const owner = detectedTitle.match(/^(.+?)\s+(?:privacy policy|terms|policy|agreement)/i)?.[1];
        if (owner && owner.length <= 40) setOrganization(owner);
      } else if (/architecture|system design|technical design/.test(fingerprint)) setThemeKey("architecture");
      else if (/requirement|\bsrs\b/.test(fingerprint)) setThemeKey("srs");
      else if (/research|abstract|methodology|bibliography/.test(fingerprint)) setThemeKey("academic");
      document.querySelector("#studio")?.scrollIntoView({ behavior: "smooth" });
      flash("Markdown loaded privately in your browser.");
    };
    reader.readAsText(file);
  };

  const exportPdf = () => {
    flash("Print dialog opened — choose “Save as PDF”.");
    window.setTimeout(() => window.print(), 150);
  };

  const exportDocx = async () => {
    flash("Building your professional Word document…");
    const {
      AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, PageBreak, PageNumber,
      Packer, Paragraph, ShadingType, Table, TableCell, TableOfContents, TableRow, TextRun,
      VerticalAlign, WidthType,
    } = await import("docx");
    const tokens = marked.lexer(markdown);
    const accent = activeAccent.slice(1);
    const ink = theme.ink.slice(1);
    const children: Array<InstanceType<typeof Paragraph> | InstanceType<typeof Table> | InstanceType<typeof TableOfContents>> = [];
    const margins = marginSize === "narrow" ? 720 : marginSize === "wide" ? 1440 : 1080;
    const page = pageSize === "letter" ? { width: 12240, height: 15840 } : { width: 11906, height: 16838 };
    const run = (text: string, options: { bold?: boolean; italics?: boolean; code?: boolean; color?: string } = {}) => new TextRun({
      text,
      bold: options.bold,
      italics: options.italics,
      font: options.code ? "Aptos Mono" : theme.wordFont,
      color: options.color ?? ink,
      size: options.code ? 19 : 22,
    });

    if (coverPage) {
      children.push(
        new Paragraph({ text: organization.toUpperCase(), alignment: AlignmentType.CENTER, spacing: { before: 900, after: 700 }, style: "CoverEyebrow" }),
        new Paragraph({ text: title, alignment: AlignmentType.CENTER, style: "CoverTitle", spacing: { after: 320 } }),
        new Paragraph({ text: `${themes[themeKey].label} document`, alignment: AlignmentType.CENTER, style: "Subtitle", spacing: { after: 900 } }),
        new Paragraph({ text: `Prepared by ${author}`, alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
        new Paragraph({ text: `Version ${version}  •  ${classification}`, alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
        new Paragraph({ text: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new PageBreak()] }),
      );
    }

    if (tableOfContents) {
      children.push(new Paragraph({ text: "Table of contents", heading: HeadingLevel.HEADING_1, spacing: { after: 240 } }));
      children.push(new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-3" }));
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

    let sectionNumber = 0;
    let subsectionNumber = 0;
    for (const token of tokens) {
      if (token.type === "heading") {
        const level = token.depth === 1 ? HeadingLevel.TITLE : token.depth === 2 ? HeadingLevel.HEADING_1 : token.depth === 3 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
        const cleanHeading = plainText(token).replace(/^\d+(?:\.\d+)*\.?\s+/, "");
        let headingText = plainText(token);
        if (numberedHeadings && token.depth === 2) { sectionNumber += 1; subsectionNumber = 0; headingText = `${sectionNumber}. ${cleanHeading}`; }
        if (numberedHeadings && token.depth === 3) { subsectionNumber += 1; headingText = `${sectionNumber}.${subsectionNumber} ${cleanHeading}`; }
        children.push(new Paragraph({ text: headingText, heading: level, spacing: { before: token.depth === 1 ? 0 : 300, after: 120 }, keepNext: true }));
      } else if (token.type === "paragraph" || token.type === "text") {
        children.push(new Paragraph({ children: [run(plainText(token))], spacing: { after: 180, line: 330 }, widowControl: true }));
      } else if (token.type === "blockquote") {
        children.push(new Paragraph({ children: [run(plainText(token), { italics: true, color: accent })], indent: { left: 420, right: 220 }, border: { left: { style: BorderStyle.SINGLE, size: 16, color: accent, space: 14 } }, shading: { type: ShadingType.CLEAR, fill: "F5F6F8" }, spacing: { before: 160, after: 200 } }));
      } else if (token.type === "list") {
        for (const item of token.items) children.push(new Paragraph({ children: [run(plainText(item))], bullet: token.ordered ? undefined : { level: 0 }, numbering: token.ordered ? { reference: "numbered-list", level: 0 } : undefined, spacing: { after: 90, line: 300 } }));
      } else if (token.type === "code") {
        children.push(new Paragraph({ children: [run(token.text, { code: true })], shading: { type: ShadingType.CLEAR, fill: "F1F3F5" }, border: { left: { style: BorderStyle.SINGLE, size: 10, color: accent, space: 10 } }, spacing: { before: 140, after: 200 }, indent: { left: 180, right: 180 } }));
      } else if (token.type === "hr") {
        children.push(new Paragraph({ text: "", border: { bottom: { style: BorderStyle.SINGLE, size: 5, color: "CCD1D6", space: 8 } }, spacing: { before: 160, after: 160 } }));
      } else if (token.type === "table") {
        const rows = [token.header, ...token.rows].map((row, rowIndex) => new TableRow({
          tableHeader: rowIndex === 0,
          children: row.map((cell: { text: string }) => new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            shading: rowIndex === 0 ? { type: ShadingType.CLEAR, fill: accent } : undefined,
            margins: { top: 110, bottom: 110, left: 130, right: 130 },
            children: [new Paragraph({ children: [run(cell.text, { bold: rowIndex === 0, color: rowIndex === 0 ? "FFFFFF" : ink })], spacing: { after: 0 } })],
          })),
        }));
        children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCD1D6" }, bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCD1D6" }, left: { style: BorderStyle.SINGLE, size: 4, color: "CCD1D6" }, right: { style: BorderStyle.SINGLE, size: 4, color: "CCD1D6" }, insideHorizontal: { style: BorderStyle.SINGLE, size: 3, color: "DDE1E5" }, insideVertical: { style: BorderStyle.SINGLE, size: 3, color: "DDE1E5" } } }));
        children.push(new Paragraph({ text: "", spacing: { after: 120 } }));
      }
    }

    const doc = new Document({
      creator: author,
      title,
      subject: themes[themeKey].category,
      description: `Generated by Folio from ${filename}`,
      styles: {
        default: { document: { run: { font: theme.wordFont, size: 22, color: ink }, paragraph: { spacing: { line: 330 } } } },
        paragraphStyles: [
          { id: "CoverEyebrow", name: "Cover Eyebrow", basedOn: "Normal", run: { font: theme.wordFont, size: 18, bold: true, color: accent, characterSpacing: 80 } },
          { id: "CoverTitle", name: "Cover Title", basedOn: "Title", run: { font: theme.wordFont, size: 48, bold: true, color: ink } },
          { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: theme.wordFont, size: 40, bold: true, color: ink }, paragraph: { spacing: { before: 120, after: 260 }, outlineLevel: 0 } },
          { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: theme.wordFont, size: 30, bold: true, color: accent }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, keepNext: true } },
          { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: theme.wordFont, size: 25, bold: true, color: ink }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1, keepNext: true } },
          { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: theme.wordFont, size: 22, bold: true, color: accent }, paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 2, keepNext: true } },
        ],
      },
      numbering: {
        config: [
          { reference: "numbered-list", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 260 } } } }] },
        ],
      },
      sections: [{
        properties: { page: { size: page, margin: { top: margins, right: margins, bottom: margins, left: margins } } },
        headers: showHeader ? { default: new Header({ children: [new Paragraph({ children: [run(`${organization}  /  ${title}`, { bold: true, color: "6C737A" })], border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: "D8DCE0", space: 6 } } })] }) } : undefined,
        footers: showPageNumbers ? { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [run(`${classification}   •   Version ${version}   •   `, { color: "747A80" }), new TextRun({ children: [PageNumber.CURRENT], font: theme.wordFont, size: 18, color: "747A80" })] })] }) } : undefined,
        children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.replace(/\.md$/i, "") + ".docx";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash("Professional DOCX downloaded.");
  };

  const settingsPanel = <aside className="inspector-pane">
    <div className="pane-label"><span>DOCUMENT SETUP</span><button onClick={() => setPanel(null)}>×</button></div>
    <div className="inspector-scroll">
      <div className="setting-section"><b>Document identity</b>
        <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label>Author<input value={author} onChange={(e) => setAuthor(e.target.value)} /></label>
        <label>Organization<input value={organization} onChange={(e) => setOrganization(e.target.value)} /></label>
        <div className="field-row"><label>Version<input value={version} onChange={(e) => setVersion(e.target.value)} /></label><label>Classification<input value={classification} onChange={(e) => setClassification(e.target.value)} /></label></div>
      </div>
      <div className="setting-section"><b>Page setup</b>
        <div className="segmented"><button className={pageSize === "a4" ? "selected" : ""} onClick={() => setPageSize("a4")}>A4</button><button className={pageSize === "letter" ? "selected" : ""} onClick={() => setPageSize("letter")}>Letter</button></div>
        <label>Margins<select value={marginSize} onChange={(e) => setMarginSize(e.target.value as MarginSize)}><option value="narrow">Narrow</option><option value="normal">Professional</option><option value="wide">Wide</option></select></label>
      </div>
      <div className="setting-section"><b>Document structure</b>
        {[["Cover page", coverPage, setCoverPage], ["Table of contents", tableOfContents, setTableOfContents], ["Numbered heading style", numberedHeadings, setNumberedHeadings], ["Running header", showHeader, setShowHeader], ["Page numbers", showPageNumbers, setShowPageNumbers]].map(([label, value, setter]) => <label className="toggle" key={String(label)}><span>{String(label)}</span><input type="checkbox" checked={value as boolean} onChange={(e) => (setter as (value: boolean) => void)(e.target.checked)} /></label>)}
      </div>
      <p className="setting-note">These settings are applied to the PDF preview and professional DOCX export.</p>
    </div>
  </aside>;

  const styleLabPanel = <aside className="inspector-pane css-pane">
    <div className="pane-label"><span>STYLE LAB</span><button onClick={() => setPanel(null)}>×</button></div>
    <div className="style-lab-scroll">
      <div className="style-intro"><b>Design without limits</b><p>Start with a professional recipe, adjust the controls, then edit every CSS detail.</p></div>
      <div className="style-section"><div className="style-section-title"><span>CSS recipes</span><small>{Object.keys(cssPresets).length} presets</small></div>
        <div className="css-preset-grid">{(Object.keys(cssPresets) as CssPresetKey[]).map((key) => <button key={key} className={activePreset === key ? "selected" : ""} onClick={() => { setCustomCss(cssPresets[key].css); setActivePreset(key); }}><b>{cssPresets[key].label}</b><small>{cssPresets[key].description}</small></button>)}</div>
      </div>
      <div className="style-section"><div className="style-section-title"><span>Quick controls</span><button className="reset-style" onClick={() => { setAccentOverride(""); setBodySize(12.5); setLineHeight(1.72); setCustomCss(""); setActivePreset("custom"); }}>Reset</button></div>
        <label className="color-control"><span>Accent colour</span><input type="color" value={activeAccent} onChange={(e) => setAccentOverride(e.target.value)} /></label>
        <label className="range-control"><span>Body size <b>{bodySize}px</b></span><input type="range" min="10" max="16" step="0.5" value={bodySize} onChange={(e) => setBodySize(Number(e.target.value))} /></label>
        <label className="range-control"><span>Line height <b>{lineHeight.toFixed(2)}</b></span><input type="range" min="1.3" max="2.1" step="0.05" value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} /></label>
      </div>
      <div className="style-section css-editor-section"><div className="style-section-title"><span>Custom CSS</span><small>Always enabled</small></div><textarea aria-label="Custom CSS editor" value={customCss} onChange={(e) => { setCustomCss(e.target.value); setActivePreset("custom"); }} spellCheck="false"/><small>Target the page with <code>.document-preview</code>. Changes appear instantly and are included in PDF.</small></div>
    </div>
  </aside>;

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="Folio home"><span>F</span>Folio</a>
        <div className="nav-links"><a href="#features">Features</a><a href="#templates">Standards</a><a href="#studio">Studio</a></div>
        <button className="nav-cta" onClick={() => fileRef.current?.click()}>Upload Markdown <span>↗</span></button>
      </nav>

      <section className="hero shell" id="top">
        <div className="eyebrow"><span /> Professional document studio</div>
        <h1>Your Markdown,<br/><em>document ready.</em></h1>
        <p className="hero-copy">Upload one Markdown file. Turn it into a policy, terms document, SRS, architecture document, executive report, research paper, or beautifully typeset publication.</p>
        <div className="hero-actions"><button className="primary" onClick={() => fileRef.current?.click()}>Upload a .md file <span>→</span></button><a className="secondary" href="#studio">Explore the studio</a></div>
        <p className="privacy"><span>✓</span> Private by design — your Markdown never leaves your browser</p>
        <div className="hero-rule"><span>01</span><i /><span>7 PROFESSIONAL STANDARDS</span></div>
      </section>

      <section className="studio-wrap" id="studio">
        <div className="studio-heading shell"><div><span className="section-kicker">THE DOCUMENT STUDIO</span><h2>One source.<br/><em>Publication quality.</em></h2></div><p>Apply professional structure, page settings and Word styles to any uploaded Markdown file.</p></div>
        <div className="studio shell-wide">
          <div className="studio-bar">
            <div className="file-name"><span className="file-mark">MD</span><div><b>{filename}</b><small>{themes[themeKey].label} · {pageSize.toUpperCase()}</small></div></div>
            <div className="bar-tools">
              <button onClick={() => fileRef.current?.click()}>＋ Upload .md</button>
              <button className={panel === "settings" ? "active" : ""} onClick={() => setPanel(panel === "settings" ? null : "settings")}>⚙ Document setup</button>
              <button className={panel === "css" ? "active" : ""} onClick={() => setPanel(panel === "css" ? null : "css")}>✦ Style Lab</button>
              <span className="divider"/><button onClick={exportPdf}>↓ PDF</button><button className="export" onClick={exportDocx}>↓ Professional DOCX</button>
            </div>
          </div>
          <div className="workspace">
            <section className="editor-pane"><div className="pane-label"><span>MARKDOWN SOURCE</span><span>{words} words · {readingTime} min</span></div><textarea aria-label="Markdown editor" value={markdown} onChange={(e) => setMarkdown(e.target.value)} spellCheck="false" /></section>
            <section className="preview-pane">
              <div className="pane-label preview-toolbar"><span>DOCUMENT PREVIEW · {pageSize.toUpperCase()}</span><div className="preview-actions"><button aria-label="Zoom out" onClick={() => setZoom(Math.max(55, zoom - 10))}>−</button><span>{zoom}%</span><button aria-label="Zoom in" onClick={() => setZoom(Math.min(125, zoom + 10))}>＋</button><button className="fit-button" onClick={() => setZoom(95)}>Fit</button><span className="live"><i/> Live</span></div></div>
              <div className="preview-scroll" tabIndex={0} aria-label="Scrollable document preview">
                <div className="page-stage">
                  <div className={`paper document-shell page-${pageSize} margin-${marginSize}`} style={{ "--accent": activeAccent, "--ink": theme.ink, "--paper": theme.paper, "--doc-font": theme.font, "--page-padding": padding, "--body-size": `${bodySize}px`, "--line-height": lineHeight, zoom: zoom / 100 } as React.CSSProperties}>
                    {showHeader && <div className="paper-header"><span>{organization}</span><span>{classification} · V{version}</span></div>}
                    {coverPage && <section className="cover-preview"><small>{organization}</small><h1>{title}</h1><p>{themes[themeKey].category}</p><div><span>{author}</span><span>Version {version}</span></div></section>}
                    <article className={`document-preview theme-${themeKey} ${numberedHeadings ? "numbered-headings" : ""}`} dangerouslySetInnerHTML={{ __html: html }} />
                    {showPageNumbers && <div className="paper-footer"><span>{filename}</span><span>01</span></div>}
                  </div>
                </div>
              </div>
            </section>
            {panel === "settings" && settingsPanel}
            {panel === "css" && styleLabPanel}
          </div>
        </div>
      </section>

      <section className="templates shell" id="templates">
        <div className="section-title"><span className="section-kicker">PROFESSIONAL STANDARDS</span><h2>Built for real documents.</h2><p>Choose a standard and Folio applies its typography, hierarchy, spacing, tables and Word styles to your Markdown.</p></div>
        <div className="template-grid">
          {(Object.keys(themes) as ThemeKey[]).map((key, index) => <button key={key} className={`template-card ${themeKey === key ? "selected" : ""}`} onClick={() => { setThemeKey(key); setAccentOverride(""); }}>
            <div className={`mini-page mini-${key}`}><small>FOLIO / 0{index + 1}</small><h3>{themes[key].sample}</h3><i/><p>{themes[key].category}</p></div>
            <div className="template-meta"><div><b>{themes[key].label}</b><small>{themes[key].description}</small></div><span>{themeKey === key ? "✓" : "→"}</span></div>
          </button>)}
        </div>
      </section>

      <section className="features" id="features"><div className="shell feature-grid"><div><span className="feature-no">01</span><h3>Standards, not skins</h3><p>Legal, SRS, architecture, executive, editorial, academic and technical standards shape preview and export.</p></div><div><span className="feature-no">02</span><h3>Style without limits</h3><p>Eight CSS recipes, live colour and typography controls, plus unrestricted custom CSS for every uploaded file.</p></div><div><span className="feature-no">03</span><h3>Word-native output</h3><p>Real headings, styled tables, numbered lists, code blocks and editable document structure.</p></div></div></section>

      <footer className="shell"><a className="brand" href="#top"><span>F</span>Folio</a><p>Professional documents from one Markdown file.</p><small>Private · precise · publication ready</small></footer>
      <input ref={fileRef} className="sr-only" type="file" accept=".md,text/markdown,text/plain" onChange={(e) => openFile(e.target.files?.[0])}/>
      <style>{`${customCss}\n@media print { @page { size: ${pageSize === "a4" ? "A4" : "Letter"}; } }`}</style>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}
