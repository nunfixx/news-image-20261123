// THE WORLD IN ONE DAY — Monday, 23 November 2026
// A newspaper front page drawn from scratch: own PNG encoder, own 5x7 bitmap font.
// Node 22+ stdlib only, no network, deterministic output.
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

// ---- palette ----
const PAPER: [number, number, number] = [245, 238, 220];
const INK: [number, number, number] = [17, 17, 17];
const RED: [number, number, number] = [193, 39, 45];
const BLUE: [number, number, number] = [31, 78, 121];
const GREY: [number, number, number] = [107, 98, 87];
const LIGHT: [number, number, number] = [232, 222, 200];
const ORANGE: [number, number, number] = [214, 106, 24];
const GREEN: [number, number, number] = [34, 120, 64];
const SEA: [number, number, number] = [126, 180, 205];

type RGB = [number, number, number];
const buf = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) {
  buf[i * 3] = PAPER[0];
  buf[i * 3 + 1] = PAPER[1];
  buf[i * 3 + 2] = PAPER[2];
}

function px(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const o = (y * W + x) * 3;
  buf[o] = c[0];
  buf[o + 1] = c[1];
  buf[o + 2] = c[2];
}
function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) px(i, j, c);
}
function hline(x: number, y: number, w: number, c: RGB, t = 1): void {
  rect(x, y, w, t, c);
}
function vline(x: number, y: number, h: number, c: RGB, t = 1): void {
  rect(x, y, t, h, c);
}
function box(x: number, y: number, w: number, h: number, c: RGB, t = 2): void {
  hline(x, y, w, c, t);
  hline(x, y + h - t, w, c, t);
  vline(x, y, h, c, t);
  vline(x + w - t, y, h, c, t);
}
function circle(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++)
      if (x * x + y * y <= r * r) px(cx + x, cy + y, c);
}
function ring(cx: number, cy: number, r: number, c: RGB, t = 2): void {
  for (let a = 0; a < 360; a += 1) {
    const rad = (a * Math.PI) / 180;
    for (let d = 0; d < t; d++)
      px(Math.round(cx + (r - d) * Math.cos(rad)), Math.round(cy + (r - d) * Math.sin(rad)), c);
  }
}

// ---- 5x7 bitmap font (own glyphs, 7 rows of 5 bits) ----
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "+": ["00000", "00100", "00100", "01110", "00100", "00100", "00000"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "#": ["01010", "01010", "11111", "01010", "11111", "01010", "01010"],
  "@": ["01110", "10001", "10111", "10101", "10110", "10000", "01110"],
  "*": ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
  _: ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
};

function drawChar(x: number, y: number, ch: string, s: number, c: RGB): void {
  const g = FONT[ch] || FONT["?"];
  for (let r = 0; r < 7; r++)
    for (let col = 0; col < 5; col++)
      if (g[r][col] === "1") rect(x + col * s, y + r * s, s, s, c);
}
function textWidth(str: string, s: number): number {
  return str.length * 6 * s - s;
}
function drawText(x: number, y: number, str: string, s: number, c: RGB): void {
  for (let i = 0; i < str.length; i++) drawChar(x + i * 6 * s, y, str[i], s, c);
}
function drawTextCentered(cx: number, y: number, str: string, s: number, c: RGB): void {
  drawText(cx - Math.floor(textWidth(str, s) / 2), y, str, s, c);
}
function wrapText(str: string, maxW: number, s: number): string[] {
  const words = str.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (textWidth(t, s) <= maxW) {
      cur = t;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---- panel helper: kicker, headline, body, art strip at bottom ----
function panel(
  x: number, y: number, w: number, h: number,
  kicker: string, headline: string, body: string,
  art: (ax: number, ay: number, aw: number, ah: number) => void,
): void {
  box(x, y, w, h, INK, 2);
  drawText(x + 10, y + 8, kicker, 1, RED);
  const hl = wrapText(headline, w - 20, 2);
  let cy = y + 22;
  for (const line of hl) {
    drawText(x + 10, cy, line, 2, INK);
    cy += 17;
  }
  const artH = 52;
  const bl = wrapText(body, w - 20, 1);
  let by = cy + 4;
  const maxBody = h - (cy - y) - artH - 12;
  let shown = 0;
  for (const line of bl) {
    if (by + 9 > y + h - artH - 6) break;
    if (shown * 10 > maxBody) break;
    drawText(x + 10, by, line, 1, INK);
    by += 10;
    shown++;
  }
  art(x + 10, y + h - artH - 4, w - 20, artH);
}

// ---- small art pieces (all drawn with rects/circles) ----
function artShip(ax: number, ay: number, aw: number, ah: number): void {
  // sinking corvette: bow above water, stern going down
  rect(ax, ay + 26, aw, 16, SEA);
  // hull, tilted: bow up right
  for (let i = 0; i < 90; i++) {
    const t = i / 90;
    const top = ay + 26 - Math.round(t * 14);
    rect(ax + 8 + i, top, 1, 26 - Math.round(t * 14), INK);
  }
  rect(ax + 70, ay + 4, 10, 10, INK); // bridge
  rect(ax + 20, ay + 18, 4, 6, RED); // flag
  drawText(ax + aw - 88, ay + 2, "BENGHAZI", 1, RED);
  // waves
  for (let i = 0; i < aw; i += 14) rect(ax + i, ay + 40, 8, 2, BLUE);
}
function artBuilding(ax: number, ay: number, aw: number, ah: number): void {
  // damaged apartment block with rescue ladder
  rect(ax, ay + 4, 46, 44, INK);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      rect(ax + 6 + c * 14, ay + 10 + r * 13, 8, 8, PAPER);
  rect(ax + 20, ay + 16, 12, 12, RED); // hole
  rect(ax + 56, ay + 10, 4, 38, GREY); // ladder rails
  rect(ax + 62, ay + 10, 4, 38, GREY);
  for (let r = 0; r < 6; r++) rect(ax + 56, ay + 12 + r * 6, 10, 2, GREY);
  drawText(ax + 76, ay + 34, "11 DEAD", 1, RED);
}
function artRadar(ax: number, ay: number, aw: number, ah: number): void {
  // AWACS plane silhouette + radar dish
  rect(ax + 6, ay + 22, 60, 8, INK);
  rect(ax + 58, ay + 24, 22, 5, INK); // nose
  rect(ax + 30, ay + 12, 26, 4, INK); // dish
  rect(ax + 40, ay + 16, 4, 8, INK);
  rect(ax + 14, ay + 30, 8, 10, INK); // tail
  ring(ax + 100, ay + 24, 14, BLUE, 2);
  hline(ax + 100, ay + 24, 14, BLUE, 2);
  drawText(ax + 122, ay + 30, "AWACS", 1, BLUE);
}
function artChart(ax: number, ay: number, aw: number, ah: number): void {
  // rising market line over bars
  const pts: [number, number][] = [
    [0, 40], [20, 38], [40, 42], [60, 30], [80, 34], [100, 22], [120, 24], [140, 10],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / steps);
      const yy = Math.round(y0 + ((y1 - y0) * s) / steps);
      rect(ax + x, ay + yy, 3, 3, GREEN);
    }
  }
  for (let i = 0; i < 8; i++) rect(ax + i * 18, ay + 44 - i * 3, 10, 3 + i * 3, LIGHT);
  drawText(ax + 160, ay + 4, "+6.5%", 2, GREEN);
}
function artFactory(ax: number, ay: number, aw: number, ah: number): void {
  // factory with flames and smoke
  rect(ax, ay + 22, 70, 26, INK);
  rect(ax + 8, ay + 10, 10, 14, INK); // chimney
  // flames
  rect(ax + 14, ay + 14, 8, 8, ORANGE);
  rect(ax + 30, ay + 10, 10, 12, RED);
  rect(ax + 48, ay + 16, 8, 6, ORANGE);
  circle(ax + 92, ay + 8, 4, GREY);
  circle(ax + 100, ay + 14, 3, GREY);
  drawText(ax + 112, ay + 30, "24 DEAD", 1, RED);
}
function artTanker(ax: number, ay: number, aw: number, ah: number): void {
  // tanker on a dashed blockade line
  rect(ax, ay + 24, aw, 14, SEA);
  rect(ax + 8, ay + 12, 90, 12, INK);
  rect(ax + 70, ay + 4, 8, 8, INK);
  for (let i = 0; i < aw; i += 12) rect(ax + i, ay + 8, 6, 2, RED);
  drawText(ax + 110, ay + 28, "31 TANKERS", 1, RED);
}
function artCapitol(ax: number, ay: number, aw: number, ah: number): void {
  // capitol dome + ballot box
  rect(ax + 10, ay + 30, 60, 18, INK);
  circle(ax + 40, ay + 26, 14, INK);
  rect(ax + 38, ay + 6, 4, 8, INK);
  rect(ax + 84, ay + 28, 26, 20, BLUE);
  rect(ax + 90, ay + 20, 14, 8, BLUE);
  drawText(ax + 118, ay + 30, "258", 2, RED);
}

// ---- page layout ----
const M = 16; // margin
box(M, M, W - 2 * M, H - 2 * M, INK, 3);

// masthead
drawTextCentered(W / 2, M + 14, "THE WORLD IN ONE DAY", 6, INK);
drawTextCentered(W / 2, M + 62, "MONDAY, 23 NOVEMBER 2026", 2, RED);
drawTextCentered(W / 2, M + 84, "SEVEN STORIES FROM AROUND THE WORLD", 1, GREY);
hline(M + 8, M + 104, W - 2 * M - 16, INK, 2);
hline(M + 8, M + 108, W - 2 * M - 16, INK, 1);

// ---- lead story: Merkury ----
const LX = M + 8;
const LY = M + 118;
const LW = W - 2 * M - 16;
const LH = 218;
box(LX, LY, LW, LH, INK, 2);
drawText(LX + 12, LY + 10, "UKRAINE - LEAD STORY", 1, RED);
const leadHead = wrapText("UKRAINE SINKS RUSSIAN WARSHIP IN LIBYA", LW - 24, 3);
let ly = LY + 28;
for (const line of leadHead) {
  drawText(LX + 12, ly, line, 3, INK);
  ly += 26;
}
const leadBody = wrapText(
  "7 SEA DRONES SANK THE CORVETTE MERKURY AT BENGHAZI, 2,400 KM FROM THE FRONT. ZELENSKYY CONFIRMS; A KA-27 HELICOPTER WAS DESTROYED AND CARGO SHIP ANGARA HIT. 10 LIGHTLY HURT. RUSSIA HAS NOT CONFIRMED THE LOSS.",
  LW - 24, 2,
);
let by = ly + 6;
for (const line of leadBody) {
  drawText(LX + 12, by, line, 2, INK);
  by += 20;
}
artShip(LX + 12, LY + LH - 58, LW - 24, 52);

// ---- 6 panels: 2 columns x 3 rows ----
const GX = M + 8;
const GY = LY + LH + 10;
const GW = W - 2 * M - 16;
const CW = Math.floor((GW - 10) / 2);
const RH = 186;
const RGAP = 10;

panel(GX, GY, CW, RH, "UKRAINE", "DYMER TOLL RISES TO 11",
  "BOY, 7, AND WOMAN, 79, PULLED ALIVE FROM THE RUBBLE. 7 HURT. KYIV REGION MOURNS AFTER A WEEKEND THAT KILLED 15.",
  artBuilding);
panel(GX + CW + 10, GY, CW, RH, "EUROPE", "NATO SENDS AWACS TO POLAND",
  "NORTH ATLANTIC COUNCIL MET IN BRUSSELS AFTER 3 KH-101 MISSILES LANDED IN POLAND ON 20 NOV. POLAND DID NOT INVOKE ARTICLE 4.",
  artRadar);
panel(GX, GY + RH + RGAP, CW, RH, "MARKETS", "WALL ST ROARS BACK",
  "NASDAQ +6.5%, S&P +4.7%, DOW +3.0% - BEST DAY SINCE APRIL 2025. NVIDIA +31% AS JENSEN HUANG RETURNS AS CEO. KOSPI -3.3% TO A 10-MONTH LOW.",
  artChart);
panel(GX + CW + 10, GY + RH + RGAP, CW, RH, "INDONESIA", "CIKANDE FIRE: 24 DEAD",
  "~30 STILL MISSING, 29 SURVIVED. DNA IDS TAKE 2-3 WEEKS. EARLY SUSPICION: AN AC SHORT-CIRCUIT, UNCONFIRMED.",
  artFactory);
panel(GX, GY + 2 * (RH + RGAP), CW, RH, "IRAN / STRAIT OF HORMUZ", "31 TANKERS MASS EAST OF HORMUZ",
  "4 CRUDE TANKERS HOLD ~4.9M BARRELS. TRUMP: TANKERS TESTING THE BLOCKADE 'WILL ALL BE AT THE BOTTOM OF THE SEA'. KHARG CONVOY STILL HAS NOT SAILED.",
  artTanker);
panel(GX + CW + 10, GY + 2 * (RH + RGAP), CW, RH, "UNITED STATES", "DEMOCRATS WIN BIGGEST HOUSE MAJORITY SINCE 1992",
  "AT LEAST 258 SEATS. HUBBARD BEAT FOXX IN NC-5 BY 330 VOTES; FOXX SEEKS A RECOUNT.",
  artCapitol);

// footer
drawTextCentered(W / 2, H - M - 12, "ALL STORIES AS REPORTED ON MONDAY, 23 NOVEMBER 2026", 1, GREY);

// ---- PNG encoder (own CRC32 + zlib deflate) ----
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  const crcData = new Uint8Array(4 + data.length);
  crcData.set(out.subarray(4, 8 + data.length));
  dv.setUint32(8 + data.length, crc32(crcData));
  return out;
}
function encodePNG(): Uint8Array {
  const raw = new Uint8Array(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(buf.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, W);
  dv.setUint32(4, H);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [sig, chunk("IHDR", ihdr), chunk("IDAT", new Uint8Array(idat)), chunk("IEND", new Uint8Array(0))];
  const total = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "out";
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/entry.png`, encodePNG());
