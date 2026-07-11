import assert from "node:assert/strict";
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
  assert.match(html, /<title>Folio — Markdown to beautiful PDF &amp; DOCX<\/title>/i);
  assert.match(html, /From plain text to/);
  assert.match(html, /Choose a \.md file/);
  assert.match(html, /LIVE PREVIEW/);
  assert.match(html, /Custom CSS/);
  assert.match(html, /↓ PDF/);
  assert.match(html, /↓ DOCX/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});
