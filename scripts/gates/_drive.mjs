/**
 * _drive.mjs — 브라우저 게이트가 공유하는 한 번의 주행.
 *
 * G5·G6·G8·G9는 같은 주행에서 나온 기하·캡처·오류를 본다. 게이트마다 크롬을 다시 띄우면
 * 검수가 분 단위로 길어지고, 더 나쁘게는 게이트마다 다른 레이아웃을 보게 된다.
 * ctx.mainDrive()는 한 번만 돌고 결과를 ctx.cache에 남긴다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { openPage } from '../lib/browser.mjs';
import {
  wheelTo, wheelToBottom, wheelHome, sceneRanges, collectEntries, countVisible,
  horizontalOverflow, probeY,
} from '../lib/wheel.mjs';
import { deckPaths, orderedScenes } from './_util.mjs';

export const PROBES = [30, 55, 85];

async function solidTextContrast(page, id) {
  return page.evaluate((sceneId) => {
    const scene = document.querySelector(`[data-scene="${sceneId}"]`);
    if (!scene) return [];
    const rgba = (value) => {
      const match = String(value).match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      const parts = match[1].split(/[ ,/]+/).map(Number);
      return parts.length >= 3 ? [parts[0], parts[1], parts[2], parts[3] ?? 1] : null;
    };
    const lum = (rgb) => {
      const channel = rgb.slice(0, 3).map((v) => {
        const n = v / 255;
        return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
      });
      return channel[0] * .2126 + channel[1] * .7152 + channel[2] * .0722;
    };
    const problems = [];
    for (const el of scene.querySelectorAll('h1,h2,h3,p,li,a,span,small')) {
      const label = el.textContent?.trim();
      if (!label || el.children.length) continue;
      const box = el.getBoundingClientRect();
      if (box.width < 4 || box.height < 4 || box.bottom < 0 || box.top > innerHeight) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) < .05) continue;
      const fg = rgba(style.color);
      if (!fg) continue;
      let bg = null;
      for (let parent = el; parent; parent = parent.parentElement) {
        const surface = getComputedStyle(parent);
        if (surface.backgroundImage !== 'none') { bg = null; break; }
        const color = rgba(surface.backgroundColor);
        if (color && color[3] >= .99) { bg = color; break; }
      }
      if (!bg) continue; // Image/gradient overlay needs human screenshot review.
      const a = lum(fg);
      const b = lum(bg);
      const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      const size = parseFloat(style.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
      if (ratio < (large ? 3 : 4.5)) problems.push(`${label.slice(0, 40)} (${ratio.toFixed(2)}:1)`);
    }
    return problems.slice(0, 12);
  }, id);
}

/** 페이지를 열고 폰트·프리로더가 끝나길 기다린다. */
export async function openDeck(ctx, options = {}) {
  const opened = await openPage(ctx.browser, options);
  await opened.page.goto(ctx.baseURL, { waitUntil: 'networkidle', timeout: 60_000 });
  await opened.page.waitForTimeout(1500);
  return opened;
}

/**
 * 1440x900에서 전 장면을 휠로 굴리며 기하·가시요소·캡처·오류를 한꺼번에 거둔다.
 * @returns {Promise<{ranges, visible:Map, captures:string[], errors:string[], overflow:number, innerHeight:number}>}
 */
export async function mainDrive(ctx) {
  if (ctx.cache.mainDrive) return ctx.cache.mainDrive;

  const { page, context, errors } = await openDeck(ctx, { width: 1440, height: 900 });
  const { qaDir } = deckPaths(ctx.dir);
  fs.mkdirSync(qaDir, { recursive: true });
  for (const file of fs.readdirSync(qaDir)) {
    if (/-(?:30|55|85|cue-\d{2})\.jpg$/.test(file)) fs.rmSync(path.join(qaDir, file));
  }

  const innerHeight = await page.evaluate(() => window.innerHeight);
  let overflow = await horizontalOverflow(page);

  // 핀 스페이서는 ScrollTrigger가 트리거를 만들 때 생긴다. 끝까지 한 번 굴려야 전부 선다.
  await wheelToBottom(page);
  overflow = Math.max(overflow, await horizontalOverflow(page));
  const ranges = await sceneRanges(page);
  await wheelHome(page);

  const visible = new Map();
  const contrast = new Map();
  const mediaVisible = new Map();
  const captures = [];
  const ordered = orderedScenes(ctx.deck);
  const byId = new Map(ranges.map((r) => [r.id, r]));

  for (const scene of ordered) {
    const range = byId.get(scene.id);
    if (!range) continue;
    const cueProbes = Array.isArray(scene.cues) ? scene.cues.map((ratio, index) => ({ ratio, file: `${scene.id}-cue-${String(index + 1).padStart(2, '0')}.jpg` })) : [];
    const probes = [
      ...PROBES.map((probe) => ({ ratio: probe / 100, file: `${scene.id}-${probe}.jpg`, isHold: probe === 55 })),
      ...cueProbes,
    ].sort((a, b) => a.ratio - b.ratio);
    for (const probe of probes) {
      await wheelTo(page, probeY(range, probe.ratio, innerHeight));
      overflow = Math.max(overflow, await horizontalOverflow(page));
      if (probe.isHold) {
        const entries = await collectEntries(page, scene.id);
        visible.set(scene.id, countVisible(entries, { width: 1440, height: 900 }));
        contrast.set(scene.id, await solidTextContrast(page, scene.id));
        mediaVisible.set(scene.id, await page.evaluate((id) => {
          const section = document.querySelector(`[data-scene="${id}"]`);
          if (!section) return 0;
          return [...section.querySelectorAll('img,canvas,video')].filter((el) => {
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            const loaded = el.tagName === 'IMG' ? el.naturalWidth > 0
              : el.tagName === 'CANVAS' ? el.width > 0 && el.height > 0
              : el.readyState >= 2 || Boolean(el.poster);
            return loaded && rect.width > 20 && rect.height > 20
              && rect.right > 0 && rect.bottom > 0 && rect.left < innerWidth && rect.top < innerHeight
              && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > .05;
          }).length;
        }, scene.id));
      }
      const file = path.join(qaDir, probe.file);
      try {
        await page.screenshot({ path: file, type: 'jpeg', quality: 82 });
        captures.push(file);
      } catch (err) {
        errors.push(`capture: ${probe.file} ${String(err?.message ?? err).split('\n')[0]}`);
      }
    }
  }

  const result = { ranges, visible, contrast, mediaVisible, captures, errors, overflow, innerHeight, page, context };
  ctx.cache.mainDrive = result;
  ctx.cleanups.push(async () => { try { await context.close(); } catch { /* 무시 */ } });
  return result;
}
