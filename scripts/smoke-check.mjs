#!/usr/bin/env node
/**
 * Read-only readiness checks for the deployed Cloudflare Pages app.
 *
 * This script never writes to KV. It verifies local JS syntax, focus page
 * service worker registration, deployed GET endpoints, snapshot dates, and
 * the deployed service worker cache version.
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BASE = process.env.SMOKE_BASE_URL || "https://trainingunit.pages.dev";
const PEOPLE = ["marlie", "olivia", "carolina", "ashley"];
const JS_FILES = [
  "scripts/refresh-tasks.mjs",
  "scripts/generate-focus-pages.mjs",
  "scripts/smoke-check.mjs",
  "functions/_lib/monday-tasks.js",
  "functions/api/data/[slug].js",
  "functions/api/tasks/[slug].js",
];

const results = [];

function pass(label) {
  results.push({ ok: true, label });
  console.log("ok  " + label);
}

function skip(label, detail) {
  results.push({ ok: true, label, skipped: true, detail });
  console.log("skip " + label + (detail ? " - " + detail : ""));
}

function fail(label, detail) {
  results.push({ ok: false, label, detail });
  console.error("bad " + label + (detail ? " - " + detail : ""));
}

function localText(path) {
  return readFileSync(join(ROOT, path), "utf8");
}

function cacheVersion(text) {
  return text.match(/const CACHE = "([^"]+)"/)?.[1] || "";
}

async function fetchText(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(BASE + path, { signal: controller.signal, cache: "no-store" });
    const text = await res.text();
    return { res, text };
  } finally {
    clearTimeout(timer);
  }
}

for (const file of JS_FILES) {
  const check = spawnSync(process.execPath, ["--check", join(ROOT, file)], {
    encoding: "utf8",
  });
  if (check.status === 0) pass("syntax " + file);
  else if (check.error?.code === "EPERM" || check.error?.code === "EACCES") {
    skip("syntax " + file, `subprocess blocked (${check.error.code}); run node --check directly`);
  }
  else fail("syntax " + file, (check.stderr || check.stdout || "").trim());
}

const localSwVersion = cacheVersion(localText("sw.js"));
if (localSwVersion) pass("local service worker cache " + localSwVersion);
else fail("local service worker cache", "CACHE constant not found");

for (const person of PEOPLE) {
  const html = localText(`${person}/index.html`);
  const snapshot = html.match(/const SNAPSHOT_DATE = "([\d-]{10})";/)?.[1];
  if (!snapshot) fail(`${person} local snapshot`, "SNAPSHOT_DATE not found");
  else pass(`${person} local snapshot ${snapshot}`);

  if (html.includes('navigator.serviceWorker.register("/sw.js")')) {
    pass(`${person} registers root service worker`);
  } else {
    fail(`${person} registers root service worker`, "missing /sw.js registration");
  }
}

const { res: swRes, text: swText } = await fetchText("/sw.js");
if (swRes.ok) pass("deployed /sw.js status " + swRes.status);
else fail("deployed /sw.js status", String(swRes.status));

const remoteSwVersion = cacheVersion(swText);
if (remoteSwVersion === localSwVersion) {
  pass("deployed service worker cache matches " + remoteSwVersion);
} else {
  fail("deployed service worker cache", `local ${localSwVersion || "missing"}, deployed ${remoteSwVersion || "missing"}`);
}

for (const person of PEOPLE) {
  const page = await fetchText(`/${person}/`);
  if (page.res.ok) pass(`deployed /${person}/ status ${page.res.status}`);
  else fail(`deployed /${person}/ status`, String(page.res.status));

  const data = await fetchText(`/api/data/${person}`);
  if (!data.res.ok) {
    fail(`deployed /api/data/${person}`, String(data.res.status));
  } else {
    const body = JSON.parse(data.text);
    if (body?.v === 1 && Array.isArray(body.pins) && Array.isArray(body.todos)) {
      pass(`deployed /api/data/${person}`);
    } else {
      fail(`deployed /api/data/${person}`, "unexpected JSON shape");
    }
  }

  const tasks = await fetchText(`/api/tasks/${person}`);
  if (!tasks.res.ok) {
    fail(`deployed /api/tasks/${person}`, String(tasks.res.status));
  } else {
    const body = JSON.parse(tasks.text);
    const localSnapshot = localText(`${person}/index.html`).match(/const SNAPSHOT_DATE = "([\d-]{10})";/)?.[1];
    if (body?.v === 1 && body.slug === person && Array.isArray(body.tasks) && body.snapshotDate === localSnapshot) {
      pass(`deployed /api/tasks/${person} snapshot ${body.snapshotDate}`);
    } else {
      fail(`deployed /api/tasks/${person}`, "unexpected JSON shape or snapshot date");
    }
  }
}

const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.error(`\n${failed.length} smoke check(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${results.length} smoke checks passed.`);
