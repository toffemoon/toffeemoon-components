// 程序化贴图:书脊 / 封面占位 / 背板网格 / 书口纸纹
// 全部用 canvas 现画,正式版封面换成真实图片(item.cover)即可,书脊仍然数据驱动。
import * as THREE from 'three';

const CJK = /[぀-ヿ㐀-䶿一-鿿豈-﫿]/;
const SANS = '"Arial Black", "Helvetica Neue", Arial, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
const MONO = '"JetBrains Mono", Consolas, "Courier New", monospace';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(c, { anisotropy = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  return t;
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(hex, k) {
  // k<0 压暗, k>0 提亮
  const [r, g, b] = hexToRgb(hex);
  const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
function inkFor(hex) {
  return luminance(hex) > 0.55 ? '#15120f' : '#f3efe6';
}

// 把字号收到既不超长也不超宽
function fitFont(ctx, text, maxLen, maxSize, minSize, family) {
  let size = maxSize;
  while (size > minSize) {
    ctx.font = `900 ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxLen) break;
    size -= 2;
  }
  return size;
}

// 竖排 / 横转书脊标题
function drawSpineTitle(ctx, title, W, H, top, bottom, ink) {
  const len = bottom - top;
  const isCJK = CJK.test(title);
  ctx.fillStyle = ink;
  ctx.textBaseline = 'middle';
  if (isCJK) {
    // 中文:单字堆叠,从上往下
    const chars = Array.from(title);
    let size = Math.min(W * 0.74, Math.floor(len / chars.length / 1.08));
    size = Math.max(size, 18);
    ctx.font = `900 ${size}px ${SANS}`;
    ctx.textAlign = 'center';
    const step = size * 1.08;
    const total = step * chars.length;
    let y = top + (len - total) / 2 + step / 2;
    for (const ch of chars) { ctx.fillText(ch, W / 2, y); y += step; }
  } else {
    // 西文:整行转 90°,从上往下读
    const size = fitFont(ctx, title.toUpperCase(), len * 0.94, Math.floor(W * 0.62), 16, SANS);
    ctx.font = `900 ${size}px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(W / 2, top + len / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(title.toUpperCase(), 0, 0);
    ctx.restore();
  }
}

/**
 * 书脊贴图。按实际厚高比出图,避免拉伸文字。
 * item: { title, code, color, locked, index }
 */
export function makeSpineTexture(item, thickness, height, H = 1024) {
  const W = Math.max(96, Math.round(H * thickness / height));
  const [c, ctx] = canvas(W, H);
  const locked = !!item.locked;
  const base = locked ? '#26262b' : item.color;
  const ink = locked ? 'rgba(200,200,210,0.38)' : inkFor(base);

  // 底色 + 轻微竖向明暗(模拟书脊弧面)
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, shade(base, -0.28));
  g.addColorStop(0.18, shade(base, 0.06));
  g.addColorStop(0.5, base);
  g.addColorStop(0.85, shade(base, -0.06));
  g.addColorStop(1, shade(base, -0.35));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // 顶部标签区:三角 + 编号
  const topH = Math.round(W * 1.6);
  ctx.fillStyle = locked ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.22)';
  ctx.fillRect(0, 0, W, topH);
  ctx.fillStyle = ink;
  if (!locked) {
    const tri = W * 0.22;
    ctx.beginPath();
    ctx.moveTo(W / 2, topH * 0.22);
    ctx.lineTo(W / 2 + tri, topH * 0.22 + tri * 1.6);
    ctx.lineTo(W / 2 - tri, topH * 0.22 + tri * 1.6);
    ctx.closePath();
    ctx.fill();
    ctx.font = `700 ${Math.round(W * 0.22)}px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.code || '', W / 2, topH * 0.78);
  }

  // 底部标记:序号
  const botH = Math.round(W * 0.9);
  ctx.fillStyle = locked ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, H - botH, W, botH);
  ctx.fillStyle = ink;
  ctx.font = `700 ${Math.round(W * 0.26)}px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(item.index + 1).padStart(2, '0'), W / 2, H - botH / 2);

  // 标题
  drawSpineTitle(ctx, locked ? (item.title || '未开放') : item.title, W, H, topH + W * 0.35, H - botH - W * 0.35, ink);

  // 磨损:少量浅划痕
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const y = Math.random() * H;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y + (Math.random() - 0.5) * 6); ctx.stroke();
  }
  return toTexture(c);
}

/**
 * 封面。item.cover 给了图片就贴图片,否则程序化占位。
 * 返回 texture;如果是图片,先给占位,加载完成后原地替换 image。
 */
export function makeCoverTexture(item, depth, height, onLoaded) {
  const H = 1024;
  const W = Math.round(H * depth / height);
  const [c, ctx] = canvas(W, H);
  const locked = !!item.locked;
  const base = locked ? '#26262b' : item.color;
  const ink = locked ? 'rgba(200,200,210,0.4)' : inkFor(base);

  // 底色
  ctx.fillStyle = shade(base, -0.45);
  ctx.fillRect(0, 0, W, H);
  // 斜向亮带
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-0.35);
  const band = ctx.createLinearGradient(0, -H, 0, H);
  band.addColorStop(0, 'rgba(0,0,0,0)');
  band.addColorStop(0.45, shade(base, 0.05));
  band.addColorStop(0.55, base);
  band.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = band;
  ctx.fillRect(-W * 1.5, -H * 0.55, W * 3, H * 0.9);
  ctx.restore();
  // 网点
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 0; y < H; y += 14) for (let x = (y / 14) % 2 ? 7 : 0; x < W; x += 14) {
    ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
  }

  // 角标:编号
  if (!locked) {
    ctx.fillStyle = ink;
    ctx.font = `700 ${Math.round(W * 0.05)}px ${MONO}`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(item.code || '', W * 0.07, H * 0.05);
    ctx.textAlign = 'right';
    ctx.fillText(String(item.index + 1).padStart(2, '0'), W * 0.93, H * 0.05);
  }

  // 标题:底部大字,自动换行
  const title = locked ? '未开放' : item.title;
  const maxW = W * 0.84;
  let size = Math.round(W * 0.15);
  ctx.font = `900 ${size}px ${SANS}`;
  const words = CJK.test(title) ? Array.from(title) : title.split(' ');
  const joiner = CJK.test(title) ? '' : ' ';
  let lines = [];
  for (;;) {
    ctx.font = `900 ${size}px ${SANS}`;
    lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + joiner + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    }
    if (cur) lines.push(cur);
    // 行数超 3 或任一行(比如单个长单词)超宽就缩字号
    const tooWide = lines.some((ln) => ctx.measureText(ln).width > maxW);
    if ((lines.length <= 3 && !tooWide) || size <= 28) break;
    size -= 4;
  }
  const lh = size * 1.05;
  let y = H * 0.82 - lh * (lines.length - 1);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  for (const ln of lines) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillText(ln, W * 0.08 + 4, y + 4);
    ctx.fillStyle = ink; ctx.fillText(ln, W * 0.08, y);
    y += lh;
  }
  // 副标题
  if (item.subtitle && !locked) {
    ctx.fillStyle = ink;
    const subSize = fitFont(ctx, item.subtitle, maxW, Math.round(W * 0.04), 14, MONO);
    ctx.font = `500 ${subSize}px ${MONO}`;
    ctx.fillText(item.subtitle, W * 0.08, H * 0.88);
  }
  // 底部条码
  ctx.fillStyle = ink;
  let x = W * 0.08;
  while (x < W * 0.45) { const w = 2 + Math.random() * 6; ctx.fillRect(x, H * 0.92, w, H * 0.04); x += w + 2 + Math.random() * 5; }

  const tex = toTexture(c);

  if (item.cover && !locked) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 按封面比例 cover 铺满
      const s = Math.max(W / img.width, H / img.height);
      const dw = img.width * s, dh = img.height * s;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      tex.needsUpdate = true;
      onLoaded && onLoaded();
    };
    img.src = item.cover;
  }
  return tex;
}

/** 封底:纯色 + 一小块说明文字 */
export function makeBackTexture(item, depth, height) {
  const H = 512;
  const W = Math.round(H * depth / height);
  const [c, ctx] = canvas(W, H);
  const base = item.locked ? '#26262b' : item.color;
  ctx.fillStyle = shade(base, -0.5);
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < 7; i++) ctx.fillRect(W * 0.12, H * 0.78 + i * 7, W * (0.3 + Math.random() * 0.45), 2);
  return toTexture(c, { anisotropy: 2 });
}

/** 书口(纸页侧):浅色 + 细线 */
export function makePaperTexture() {
  const [c, ctx] = canvas(64, 512);
  ctx.fillStyle = '#d9d2c3';
  ctx.fillRect(0, 0, 64, 512);
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  for (let x = 0; x < 64; x += 3) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke(); }
  const t = toTexture(c, { anisotropy: 2 });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** 背板:暗色金属网格 */
export function makeGridTexture() {
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = '#111318';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = 'rgba(120,130,150,0.35)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 512; i += 64) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(120,130,150,0.12)';
  ctx.lineWidth = 1;
  for (let i = 32; i <= 512; i += 64) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
  }
  const t = toTexture(c, { anisotropy: 4 });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
