/**
 * Minimal Chrome DevTools Protocol driver for local verification.
 *
 * Why this exists: this repository previously had no browser tooling, so layout
 * claims (card height, horizontal overflow, anchor visibility, 44px tap targets)
 * could not be checked. This file gives the repo a dependency-free way to drive
 * the locally installed Chrome in headless mode:
 *   - navigate a real browser to the dev server
 *   - evaluate JS in the page to measure the live layout
 *   - capture full-page screenshots as evidence
 *   - read text out of external pages when a spec needs to be re-verified
 *
 * It uses Node's built-in WebSocket (Node >= 22) and the local Chrome binary.
 * No npm dependency is added, so `npm ci` behaviour is unchanged.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

export function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    "No Chrome/Edge binary found. Set CHROME_PATH to a Chromium-based browser to run browser verification.",
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launchChrome({ port = 9333, width = 1440, height = 900 } = {}) {
  const binary = findChrome();
  const profile = join(tmpdir(), `seraya-cdp-${port}-${Date.now()}`);
  mkdirSync(profile, { recursive: true });

  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "about:blank",
  ];

  const child = spawn(binary, args, { stdio: "ignore", detached: false });

  let version = null;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        version = await res.json();
        break;
      }
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  if (!version) {
    child.kill();
    throw new Error(`Chrome did not expose CDP on port ${port}`);
  }

  return {
    port,
    version,
    kill() {
      try {
        child.kill();
      } catch {
        /* already gone */
      }
    },
  };
}

/** One CDP session bound to a single target/tab. */
export class CdpSession {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Set();
    this.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`));
        else resolve(msg.result);
        return;
      }
      for (const fn of this.listeners) fn(msg);
    });
  }

  static async attach(port) {
    const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
    const target = await res.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", () => reject(new Error("CDP websocket failed")), { once: true });
    });
    return new CdpSession(ws);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 60000);
    });
  }

  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async setViewport(width, height) {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
  }

  async goto(url, { waitMs = 700 } = {}) {
    await this.send("Page.enable");
    await this.send("Runtime.enable");
    const loaded = new Promise((resolve) => {
      const off = this.on((msg) => {
        if (msg.method === "Page.loadEventFired") {
          off();
          resolve();
        }
      });
      setTimeout(() => {
        off();
        resolve();
      }, 20000);
    });
    await this.send("Page.navigate", { url });
    await loaded;
    await sleep(waitMs);
  }

  /** Evaluate an expression in the page and return its JSON value. */
  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression: `(() => { ${expression} })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      throw new Error(
        `page evaluate failed: ${result.exceptionDetails.exception?.description ?? "unknown"}`,
      );
    }
    return result.result.value;
  }

  async screenshot(path, { fullPage = true } = {}) {
    const params = { format: "png", captureBeyondViewport: fullPage };
    if (fullPage) {
      const metrics = await this.send("Page.getLayoutMetrics");
      const size = metrics.cssContentSize ?? metrics.contentSize;
      params.clip = {
        x: 0,
        y: 0,
        width: Math.ceil(size.width),
        height: Math.ceil(size.height),
        scale: 1,
      };
    }
    const { data } = await this.send("Page.captureScreenshot", params);
    const { writeFileSync } = await import("node:fs");
    writeFileSync(path, Buffer.from(data, "base64"));
    return path;
  }

  async close() {
    try {
      await this.send("Page.close");
    } catch {
      /* ignore */
    }
    try {
      this.ws.close();
    } catch {
      /* ignore */
    }
  }
}
