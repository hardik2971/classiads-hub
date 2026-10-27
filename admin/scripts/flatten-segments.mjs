/**
 * Post-build fix for `output: "export"`: Next writes segment-prefetch payloads as nested
 * folders (`__next.dashboard/verification/__PAGE__.txt`) while the client router requests
 * the dotted form (`__next.dashboard.verification.__PAGE__.txt`). Write the dotted copies so
 * client-side navigation works on static hosting instead of falling back to full reloads.
 */
import { copyFile, readdir, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const root = new URL("../out/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
let written = 0;

async function walk(dir) {
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    if ((await stat(full)).isDirectory()) {
      if (name.startsWith("__next.")) await flatten(dir, full);
      else if (name !== "_next") await walk(full);
    }
  }
}

async function flatten(parent, segDir) {
  for (const name of await readdir(segDir)) {
    const full = join(segDir, name);
    if ((await stat(full)).isDirectory()) await flatten(parent, full);
    else if (name.endsWith(".txt")) {
      const dotted = relative(parent, full).split(sep).join(".");
      await copyFile(full, join(parent, dotted));
      written++;
    }
  }
}

await walk(root);
console.log(`flatten-segments: wrote ${written} dotted segment file(s)`);
