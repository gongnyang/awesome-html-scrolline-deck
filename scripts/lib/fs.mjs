/** fs.mjs — tiny filesystem helpers shared by the CLI commands. Node built-ins only. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

/** Repository root (the folder that holds engine/, templates/, scripts/). */
export const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');

export const exists = (p) => fs.existsSync(p);

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

export function writeText(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content);
  return file;
}

export function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`cannot read JSON ${file}: ${err.message}`);
  }
}

export function writeJson(file, value) {
  return writeText(file, `${JSON.stringify(value, null, 2)}\n`);
}

/** Every file under `dir`, returned as paths relative to `dir`, sorted. */
export function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out.sort();
}

/**
 * Copy a directory tree. `rename` maps a relative source path to its destination
 * path (return null to skip the file); `transform` rewrites text file contents.
 */
export function copyDir(from, to, { rename = (p) => p, transform = null, overwrite = true } = {}) {
  const copied = [];
  for (const rel of walk(from)) {
    const target = rename(rel);
    if (!target) continue;
    const dest = path.join(to, target);
    if (!overwrite && fs.existsSync(dest)) continue;
    ensureDir(path.dirname(dest));
    if (transform && /\.(js|mjs|css|html|json|md|txt|svg)$/.test(rel)) {
      fs.writeFileSync(dest, transform(fs.readFileSync(path.join(from, rel), 'utf8'), rel));
    } else {
      fs.copyFileSync(path.join(from, rel), dest);
    }
    copied.push(target);
  }
  return copied;
}

export function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function sha256File(file) {
  return sha256(fs.readFileSync(file));
}

/** Replace {{key}} placeholders. Unknown keys are left untouched on purpose. */
export function fillTemplate(text, values) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in values ? String(values[key]) : match));
}

/** "My Deck Title" -> "my-deck-title" (npm-safe package name). */
export function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 48) || 'scrolline-deck';
}

export { path, fs };

/**
 * parseFlags(argv) — minimal CLI parsing shared by every command.
 * `--key value`, `--key=value`, `--flag` (boolean true), `--no-flag` (false).
 * Anything else lands in `_`.
 */
export function parseFlags(argv) {
  const flags = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) { flags._.push(token); continue; }
    const body = token.slice(2);
    if (body.includes('=')) {
      const idx = body.indexOf('=');
      flags[body.slice(0, idx)] = body.slice(idx + 1);
      continue;
    }
    if (body.startsWith('no-')) { flags[body.slice(3)] = false; continue; }
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) flags[body] = true;
    else { flags[body] = next; i += 1; }
  }
  return flags;
}

/** HTML-escape for values injected into generated markup. */
export const escapeHtml = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
