import { describe, test, expect } from "bun:test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const PROJECT_DIR = path.resolve(import.meta.dir, "..");
const SCRIPTS_DIR = path.join(PROJECT_DIR, "scripts");

// ── format-wechat.ts ──────────────────────────────────────────────────────

describe("format-wechat.ts", () => {
  test("converts markdown to styled HTML", () => {
    const tmpMd = path.join(os.tmpdir(), `cp-test-${Date.now()}.md`);
    const tmpHtml = path.join(os.tmpdir(), `cp-test-${Date.now()}.html`);

    fs.writeFileSync(tmpMd, "# Hello\n\nThis is a **test** paragraph.\n\n- item 1\n- item 2\n");

    try {
      const result = spawnSync(
        "bun",
        [path.join(SCRIPTS_DIR, "format-wechat.ts"), "--input", tmpMd, "--output", tmpHtml],
        { timeout: 15000 }
      );

      expect(result.status).toBe(0);
      expect(fs.existsSync(tmpHtml)).toBe(true);

      const html = fs.readFileSync(tmpHtml, "utf-8");
      expect(html).toContain("Hello");
      expect(html).toContain("<strong");
      expect(html).toContain("test");
    } finally {
      for (const f of [tmpMd, tmpHtml]) {
        try { fs.unlinkSync(f); } catch {}
      }
    }
  });

  test("lists available styles with --list", () => {
    const result = spawnSync(
      "bun",
      [path.join(SCRIPTS_DIR, "format-wechat.ts"), "--list"],
      { timeout: 10000 }
    );

    expect(result.status).toBe(0);
    const stdout = result.stdout.toString();
    expect(stdout).toContain("wechat-default");
  });
});

// ── simple-md-to-html.ts ──────────────────────────────────────────────────

describe("simple-md-to-html.ts", () => {
  test("converts markdown and outputs JSON", () => {
    const tmpMd = path.join(os.tmpdir(), `cp-simple-${Date.now()}.md`);

    fs.writeFileSync(tmpMd, [
      "---",
      "title: Test Article",
      "author: Tester",
      "---",
      "",
      "# Test Article",
      "",
      "Hello **world**.",
      "",
    ].join("\n"));

    try {
      const result = spawnSync(
        "bun",
        [path.join(SCRIPTS_DIR, "simple-md-to-html.ts"), tmpMd],
        { timeout: 15000 }
      );

      expect(result.status).toBe(0);

      const json = JSON.parse(result.stdout.toString());
      expect(json.title).toBe("Test Article");
      expect(json.author).toBe("Tester");
      expect(json.htmlPath).toBeTruthy();
      expect(fs.existsSync(json.htmlPath)).toBe(true);

      // cleanup generated html
      try { fs.unlinkSync(json.htmlPath); } catch {}
    } finally {
      try { fs.unlinkSync(tmpMd); } catch {}
    }
  });

  test("exits 1 with no arguments", () => {
    const result = spawnSync(
      "bun",
      [path.join(SCRIPTS_DIR, "simple-md-to-html.ts")],
      { timeout: 10000 }
    );
    expect(result.status).toBe(1);
  });
});

// ── doctor.sh ─────────────────────────────────────────────────────────────

describe("doctor.sh", () => {
  test("runs without crashing", () => {
    const result = spawnSync("bash", [path.join(SCRIPTS_DIR, "doctor.sh")], {
      timeout: 15000,
      cwd: PROJECT_DIR,
    });

    // doctor may warn about missing Chrome port etc, but should not crash
    expect(result.status).not.toBeNull();
    const stdout = result.stdout.toString();
    expect(stdout).toContain("Environment Check");
  });
});

// ── Path convergence ──────────────────────────────────────────────────────

describe("path convergence", () => {
  test("gemini-image-gen.ts respects CONTENT_PUBLISHER_CONFIG_DIR", () => {
    const src = fs.readFileSync(path.join(SCRIPTS_DIR, "gemini-image-gen.ts"), "utf-8");
    expect(src).toContain("CONTENT_PUBLISHER_CONFIG_DIR");
  });

  test("gemini-image-gen.ts respects DOWNLOAD_DIR", () => {
    const src = fs.readFileSync(path.join(SCRIPTS_DIR, "gemini-image-gen.ts"), "utf-8");
    expect(src).toContain("DOWNLOAD_DIR");
  });

  test("gemini-image-gen.ts respects GEMINI_WEB_IMAGE_SCRIPT", () => {
    const src = fs.readFileSync(path.join(SCRIPTS_DIR, "gemini-image-gen.ts"), "utf-8");
    expect(src).toContain("GEMINI_WEB_IMAGE_SCRIPT");
  });

  test("publish-wechat.ts respects CONTENT_PUBLISHER_CONFIG_DIR", () => {
    const src = fs.readFileSync(path.join(SCRIPTS_DIR, "publish-wechat.ts"), "utf-8");
    expect(src).toContain("CONTENT_PUBLISHER_CONFIG_DIR");
  });

  test("cdp.ts respects WECHAT_BROWSER_CHROME_PATH", () => {
    const src = fs.readFileSync(path.join(SCRIPTS_DIR, "cdp.ts"), "utf-8");
    expect(src).toContain("WECHAT_BROWSER_CHROME_PATH");
  });
});
