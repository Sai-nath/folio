import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the Folio Markdown converter", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Folio — Professional documents from Markdown<\/title>/i);
  assert.match(html, /Your Markdown/);
  assert.match(html, /Upload a \.md file/);
  assert.match(html, /DOCUMENT PREVIEW/);
  assert.match(html, /SRS Standard/);
  assert.match(html, /Architecture/);
  assert.match(html, /Legal &amp; Policy/);
  assert.match(html, /Document setup/);
  assert.match(html, /Style Lab/);
  assert.match(html, /Scrollable document preview/);
  assert.match(html, /Zoom out/);
  assert.match(html, /Zoom in/);
  assert.match(html, /↓ PDF/);
  assert.match(html, /Professional DOCX/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("keeps long previews on a readable paper canvas", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.page-a4, \.page-letter \{ aspect-ratio: auto; \}/);
  assert.match(css, /\.document-preview \{[^}]*background: var\(--paper\)/);
  assert.match(css, /\.preview-scroll \{[^}]*overflow: auto/);
});

test("detects legal Markdown and exposes unrestricted styling", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /privacy policy\|terms/);
  assert.match(page, /setThemeKey\("legal"\)/);
  assert.match(page, /Always enabled/);
  assert.match(page, /Object\.keys\(cssPresets\)/);
});
