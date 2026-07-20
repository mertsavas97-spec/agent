/**
 * Extract & evaluate exam-style arithmetic from OCR text.
 * Handles fractions, parentheses, ·/×/÷, stacked / vertical exam layouts.
 */

function toAsciiMath(s) {
  return s
    .replace(/[·•∙]/g, '*')
    .replace(/[×xX]/g, '*')
    .replace(/[÷:]/g, '/')
    .replace(/−/g, '-')
    .replace(/,/g, '.')
    .replace(/\s+/g, '');
}

/** Safe arithmetic evaluator supporting + - * / and parentheses, left-assoc. */
export function evalArith(expr) {
  const tokens = tokenize(expr);
  let i = 0;

  function peek() {
    return tokens[i];
  }
  function consume(t) {
    if (tokens[i] === t) {
      i += 1;
      return true;
    }
    return false;
  }
  function parseExpr() {
    let v = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = tokens[i++];
      const r = parseTerm();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  function parseTerm() {
    let v = parseFactor();
    while (peek() === '*' || peek() === '/') {
      const op = tokens[i++];
      const r = parseFactor();
      if (op === '*') v *= r;
      else {
        if (r === 0) throw new Error('div0');
        v /= r;
      }
    }
    return v;
  }
  function parseFactor() {
    if (consume('+')) return parseFactor();
    if (consume('-')) return -parseFactor();
    if (consume('(')) {
      const v = parseExpr();
      if (!consume(')')) throw new Error('paren');
      return v;
    }
    const t = peek();
    if (t == null || Number.isNaN(Number(t))) throw new Error('num');
    i += 1;
    return Number(t);
  }

  const value = parseExpr();
  if (i !== tokens.length) throw new Error('trail');
  return value;
}

function tokenize(expr) {
  const out = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if ('+-*/()'.includes(c)) {
      out.push(c);
      i += 1;
      continue;
    }
    if (/\d/.test(c) || c === '.') {
      let j = i + 1;
      while (j < expr.length && /[\d.]/.test(expr[j])) j += 1;
      out.push(expr.slice(i, j));
      i = j;
      continue;
    }
    throw new Error(`bad:${c}`);
  }
  return out;
}

function nearlyInt(n) {
  return Math.abs(n - Math.round(n)) < 1e-9;
}

function formatNum(n) {
  if (!Number.isFinite(n)) return String(n);
  if (nearlyInt(n)) return String(Math.round(n));
  for (const den of [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 21, 24, 28]) {
    const num = Math.round(n * den);
    if (Math.abs(n - num / den) < 1e-9) {
      const g = gcd(Math.abs(num), den);
      return `${num / g}/${den / g}`;
    }
  }
  return (Math.round(n * 1000) / 1000).toString();
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function isFluffLine(l) {
  return (
    /^[A-E]\)/i.test(l) ||
    /sonucu|kaçtır|hangisidir|aşağıda|soru|cevap|\?/.test(l.toLowerCase()) ||
    /^=+$/.test(l)
  );
}

function isBarLine(l) {
  return /^[─—–\-_/=\s]{1,12}$/.test(l) && /[─—–\-_/=]/.test(l);
}

function isOpLine(l) {
  return /^[÷·×*+\-:]$/.test(l) || /^(÷|x|×|:)$/i.test(l);
}

/**
 * Rebuild vertical exam layouts:
 *   1        1/3
 *   —   or    ÷
 *   3        1/7
 *   ÷
 *   1
 *   —
 *   7
 * → (1/3)/(1/7)
 */
export function reconstructVerticalMath(ocrText) {
  const lines = ocrText
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !isFluffLine(l));

  /** @type {{ kind: string, v?: string }[]} */
  const tokens = [];
  for (const l of lines) {
    if (isBarLine(l)) {
      tokens.push({ kind: 'bar' });
      continue;
    }
    if (isOpLine(l)) {
      tokens.push({ kind: 'op', v: toAsciiMath(l) || '/' });
      continue;
    }
    if (/^\d+(?:[.,]\d+)?$/.test(l)) {
      tokens.push({ kind: 'num', v: l.replace(',', '.') });
      continue;
    }
    if (/^\d+\s*\/\s*\d+$/.test(l)) {
      tokens.push({ kind: 'frac', v: l.replace(/\s+/g, '') });
      continue;
    }
    // Inline math line — keep as expression atom
    if (/[0-9]/.test(l) && /[+\-−*/·×÷()/]/.test(l)) {
      tokens.push({ kind: 'expr', v: normalizeExpr(l) });
    }
  }

  // Collapse num (+ optional bar) + num → fraction
  /** @type {{ kind: string, v?: string }[]} */
  const collapsed = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (t.kind === 'num') {
      const next = tokens[i + 1];
      const next2 = tokens[i + 2];
      if (next?.kind === 'bar' && next2?.kind === 'num') {
        collapsed.push({ kind: 'frac', v: `${t.v}/${next2.v}` });
        i += 2;
        continue;
      }
      if (next?.kind === 'num' && (next2?.kind === 'op' || next2 == null || tokens[i + 1 + 1]?.kind === 'op')) {
        // Two stacked numbers without a drawn bar (common OCR miss)
        // Only pair when followed by op or end-of-left-side before op
        const afterPair = tokens[i + 2];
        if (!afterPair || afterPair.kind === 'op' || afterPair.kind === 'bar') {
          collapsed.push({ kind: 'frac', v: `${t.v}/${next.v}` });
          i += 1;
          continue;
        }
      }
      // Lone number between ops may still be a whole number operand
      collapsed.push(t);
      continue;
    }
    if (t.kind === 'bar') continue;
    collapsed.push(t);
  }

  // Second pass: num num with op between groups already handled; merge adjacent nums before/after op
  /** @type {{ kind: string, v?: string }[]} */
  const merged = [];
  for (let i = 0; i < collapsed.length; i += 1) {
    const t = collapsed[i];
    if (
      t.kind === 'num' &&
      collapsed[i + 1]?.kind === 'num' &&
      (collapsed[i + 2]?.kind === 'op' || i === 0)
    ) {
      merged.push({ kind: 'frac', v: `${t.v}/${collapsed[i + 1].v}` });
      i += 1;
      continue;
    }
    merged.push(t);
  }

  const atoms = merged.filter((t) => t.kind !== 'bar');
  if (atoms.length < 3) return null;

  // Pattern: atom op atom (op atom)*
  let expr = atomToExpr(atoms[0]);
  if (!expr) return null;
  for (let i = 1; i + 1 < atoms.length; i += 2) {
    const op = atoms[i];
    const right = atoms[i + 1];
    if (op.kind !== 'op' || !right) return null;
    const r = atomToExpr(right);
    if (!r) return null;
    const o = op.v === '*' ? '*' : op.v === '+' ? '+' : op.v === '-' ? '-' : '/';
    expr = `(${expr})${o}(${r})`;
  }
  // Must have consumed all atoms as atom (op atom)+
  if (atoms.length % 2 === 0) return null;
  if (!/[*/+-]/.test(expr)) return null;
  return expr;
}

function atomToExpr(atom) {
  if (!atom) return null;
  if (atom.kind === 'frac' || atom.kind === 'expr') return atom.v;
  if (atom.kind === 'num') return atom.v;
  return null;
}

function extractCandidateExprs(ocrText) {
  const text = ocrText.replace(/\r/g, '\n');
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const joined = lines.join(' ');
  const candidates = new Set();

  const vertical = reconstructVerticalMath(ocrText);
  if (vertical) candidates.add(vertical);

  for (const line of lines) {
    if (/[0-9]/.test(line) && /[+\-−*/·×÷()/]/.test(line) && !/^[A-E]\)/i.test(line)) {
      candidates.add(line);
    }
  }

  const stacked = joined.match(
    /([0-9().+\-−*/·×÷\s]{3,80})\s*(?:\/|:|÷)\s*([0-9().+\-−*/·×÷\s]{3,80})/,
  );
  if (stacked) {
    candidates.add(`(${stacked[1]})/(${stacked[2]})`);
  }

  // Spaced fractions: "1 / 3 ÷ 1 / 7"
  const spaced = joined
    .replace(/işleminin sonucu kaçtır\??/gi, '')
    .replace(/[A-Ea-e]\)\s*[0-9./]+/g, '');
  const spacedFrac = spaced.match(
    /(\d+)\s*\/\s*(\d+)\s*([÷:\/·×*+\-])\s*(\d+)\s*\/\s*(\d+)/,
  );
  if (spacedFrac) {
    const op = toAsciiMath(spacedFrac[3]) || '/';
    candidates.add(`(${spacedFrac[1]}/${spacedFrac[2]})${op}(${spacedFrac[4]}/${spacedFrac[5]})`);
  }

  const stripped = spaced.replace(/[^0-9().+\-−*/·×÷\s]/g, ' ');
  if (/[0-9]/.test(stripped) && /[+\-−*/·×÷/]/.test(stripped)) {
    // Preserve fraction slashes: turn "1 3 ÷ 1 7" via vertical already;
    // for "1 / 3 ÷ 1 / 7" keep slashes when normalizing later
    candidates.add(stripped);
  }

  return [...candidates];
}

function normalizeExpr(raw) {
  let s = String(raw)
    .replace(/[·•∙]/g, '*')
    .replace(/[×xX]/g, '*')
    .replace(/[÷:]/g, '/')
    .replace(/−/g, '-');
  // Keep intentional spaces around / only long enough to detect a/b — then strip
  s = s.replace(/(\d)\s*\/\s*(\d)/g, '$1/$2');
  s = s.replace(/\s+/g, '');
  s = s.replace(/(\d|\))\(/g, '$1*(');
  s = s.replace(/\)(\d)/g, ')*$1');
  s = s.replace(/[^0-9+\-*/().]/g, '');
  return s;
}

/**
 * Recover a(b-c/d) / e(f-g/h) from clean or heavily mangled OCR.
 * Live phone OCR example:
 *   2.\n52-\n35\n5\n23.\n2  →  5(2-3/5) / 2(3-5/2)
 */
export function recoverParenDiffStack(ocrText) {
  const head = ocrText.split(/\n\s*[A-Ea-e]\)/)[0];
  const mathPart = head
    .replace(/işleminin sonucu kaçtır\??/gi, '')
    .replace(/\bLO\b/gi, '')
    .trim();

  const exprs = new Set();

  const cleanRe =
    /(\d+)\s*[·•.]?\s*\(\s*(\d+)\s*[-−]\s*(\d+)\s*\/\s*(\d+)\s*\)\s*[\/÷:\n]+\s*(\d+)\s*[·•.]?\s*\(\s*(\d+)\s*[-−]\s*(\d+)\s*\/\s*(\d+)\s*\)/;
  const clean = mathPart.match(cleanRe);
  if (clean) {
    exprs.add(
      `(${clean[1]}*(${clean[2]}-${clean[3]}/${clean[4]}))/(${clean[5]}*(${clean[6]}-${clean[7]}/${clean[8]}))`,
    );
  }

  // Line form: 52- / 35 / 5 / 23. / 2  (g before e — common Vision layout)
  const lineForm = mathPart.match(
    /(\d)(\d)\s*[-−]\s*\n+\s*(\d)(\d)\s*\n+\s*(\d)\s*\n+\s*(\d)(\d)\s*[.\-−]?\s*\n+\s*(\d)\b/,
  );
  if (lineForm) {
    const [, a, b, c, d, g, e, f, h] = lineForm;
    exprs.add(`(${a}*(${b}-${c}/${d}))/(${e}*(${f}-${g}/${h}))`);
  }

  // Compact: optional leading "2." then 52-35523.2
  const compact = mathPart.replace(/\s+/g, '').replace(/^\d+\./, '');
  const mangledGFirst = compact.match(/^(\d)(\d)[-−](\d)(\d)(\d)(\d)(\d)[.\-−]?(\d)/);
  if (mangledGFirst) {
    const [, a, b, c, d, g, e, f, h] = mangledGFirst;
    exprs.add(`(${a}*(${b}-${c}/${d}))/(${e}*(${f}-${g}/${h}))`);
  }
  const mangledNormal = compact.match(
    /^(\d)(\d)[-−](\d)(\d)(\d)(\d)[-−](\d)(\d)/,
  );
  if (mangledNormal) {
    const [, a, b, c, d, e, f, g, h] = mangledNormal;
    exprs.add(`(${a}*(${b}-${c}/${d}))/(${e}*(${f}-${g}/${h}))`);
  }

  // Also: 5(2-3/5) on one blob without slash between stacks
  const semi = mathPart.replace(/\s+/g, '').match(
    /(\d+)\((\d+)[-−](\d+)\/(\d+)\)[\/÷]?(\d+)\((\d+)[-−](\d+)\/(\d+)\)/,
  );
  if (semi) {
    exprs.add(
      `(${semi[1]}*(${semi[2]}-${semi[3]}/${semi[4]}))/(${semi[5]}*(${semi[6]}-${semi[7]}/${semi[8]}))`,
    );
  }

  return [...exprs];
}

/**
 * @returns {{ expr: string, value: number, choice?: string, ocr: string, num?: number, den?: number } | null}
 */
export function evaluateExpression(ocrText) {
  const choices = parseChoices(ocrText);

  const parenStack = pickBestVariant(
    recoverParenDiffStack(ocrText).flatMap((e) => exprVariants(e)),
    choices,
    (expr) => {
      const value = evalArith(expr);
      const m = expr.match(/^\((.+)\)\/\((.+)\)$/);
      if (m) {
        try {
          return { value, num: evalArith(m[1]), den: evalArith(m[2]) };
        } catch {
          return { value };
        }
      }
      return { value };
    },
  );
  if (parenStack) return { ...parenStack, ocr: ocrText };

  // Prefer explicit vertical reconstruction (avoids "1\\n3÷1\\n7" → 13/17)
  const verticalExpr = reconstructVerticalMath(ocrText);
  if (verticalExpr) {
    const fromVertical = pickBestVariant(exprVariants(verticalExpr), choices, (expr) => {
      const value = evalArith(expr);
      // Expose num/den for stacked division of two groups
      const m = expr.match(/^\((.+)\)\/\((.+)\)$/);
      if (m) {
        try {
          return { value, num: evalArith(m[1]), den: evalArith(m[2]) };
        } catch {
          return { value };
        }
      }
      return { value };
    });
    if (fromVertical) return { ...fromVertical, ocr: ocrText };
  }

  const lines = ocrText.split('\n').map((l) => l.trim()).filter(Boolean);
  const mathLines = lines.filter(
    (l) => /[0-9]/.test(l) && /[()+\-−*/·×÷/]/.test(l) && !/^[A-E]\)/i.test(l),
  );
  if (mathLines.length >= 2) {
    const stacked = pickBestVariant(
      exprVariants(normalizeExpr(mathLines[0])).flatMap((numExpr) =>
        exprVariants(normalizeExpr(mathLines[1])).map((denExpr) => ({
          expr: `(${numExpr})/(${denExpr})`,
          numExpr,
          denExpr,
        })),
      ),
      choices,
      (item) => {
        const num = evalArith(item.numExpr);
        const den = evalArith(item.denExpr);
        if (den === 0) throw new Error('div0');
        return { value: num / den, num, den };
      },
    );
    if (stacked) {
      return { ...stacked, ocr: ocrText };
    }
  }

  const candidates = extractCandidateExprs(ocrText);
  const scored = pickBestVariant(
    candidates.flatMap((cand) => exprVariants(normalizeExpr(cand))),
    choices,
    (expr) => ({ value: evalArith(expr) }),
  );
  if (scored) return { ...scored, ocr: ocrText };

  return null;
}

/** OCR often turns ·/× into '-' or '.' before '('. Prefer variants that match a choice. */
function exprVariants(expr) {
  if (!expr) return [];
  const set = new Set([expr]);
  set.add(expr.replace(/(\d)-\(/g, '$1*('));
  set.add(expr.replace(/(\d)\.\(/g, '$1*('));
  set.add(expr.replace(/(\d)\(/g, '$1*('));
  return [...set];
}

function pickBestVariant(items, choices, evalItem) {
  let best = null;
  for (const item of items) {
    const expr = typeof item === 'string' ? item : item.expr;
    if (!expr || expr.length < 3 || !/[*/+-]/.test(expr)) continue;
    try {
      const { value, num, den } = evalItem(typeof item === 'string' ? item : item);
      if (!Number.isFinite(value)) continue;
      const choice = matchChoice(value, choices);
      const score =
        (choice ? 100 : 0) +
        (expr.includes('(') ? 3 : 0) +
        (expr.includes('/') ? 1 : 0) +
        (expr.includes('*') ? 1 : 0) -
        // Penalize glued multi-digit mistakes like 13/17 from vertical 1,3,1,7
        (/\d{2,}/.test(expr) && Object.keys(choices).length ? 5 : 0);
      const row = { expr, value, choice, num, den, score };
      if (!best || row.score > best.score) best = row;
    } catch {
      /* try next */
    }
  }
  if (!best) return null;
  const { score: _s, ...rest } = best;
  return rest;
}

function parseChoices(ocrText) {
  const map = {};
  const re = /([A-E])\)\s*([0-9]+(?:\/[0-9]+)?|[0-9]+(?:[.,][0-9]+)?)/gi;
  let m;
  while ((m = re.exec(ocrText))) {
    map[m[1].toUpperCase()] = m[2].replace(',', '.');
  }
  return map;
}

function choiceValue(s) {
  if (s.includes('/')) {
    const [a, b] = s.split('/').map(Number);
    return a / b;
  }
  return Number(s);
}

function matchChoice(value, choices) {
  for (const [k, v] of Object.entries(choices)) {
    try {
      if (Math.abs(choiceValue(v) - value) < 1e-6) return k;
    } catch {
      /* */
    }
  }
  // Also match formatted fraction string equality loosely
  const formatted = formatNum(value);
  for (const [k, v] of Object.entries(choices)) {
    if (v === formatted) return k;
  }
  return undefined;
}

export function buildStepsFromEval(evaluated) {
  const { expr, value, choice, num, den } = evaluated;
  const steps = [];

  if (typeof num === 'number' && typeof den === 'number') {
    steps.push({
      title: '1. Paydaki işlem',
      body: `Üstteki ifadeyi hesapla → ${formatNum(num)}.`,
    });
    steps.push({
      title: '2. Paydadaki işlem',
      body: `Alttaki ifadeyi hesapla → ${formatNum(den)}.`,
    });
    steps.push({
      title: '3. Bölme',
      body: `${formatNum(num)} ÷ ${formatNum(den)} = ${formatNum(value)}.`,
    });
  } else {
    steps.push({
      title: '1. İfadeyi yaz',
      body: `İşlem: ${prettyExpr(expr)}`,
    });
    steps.push({
      title: '2. Parantezleri hesapla',
      body: 'Önce parantez içlerini, sonra çarpma/bölmeyi uygula (işlem önceliği).',
    });
    steps.push({
      title: '3. Sonuç',
      body: `Sonuç: ${formatNum(value)}.`,
    });
  }

  if (choice) {
    steps.push({
      title: 'Cevap',
      body: `Doğru şık: ${choice}) ${formatNum(value)}.`,
    });
  } else {
    steps.push({
      title: 'Cevap',
      body: `Sonuç ${formatNum(value)}. Şıklarla eşleştirerek kontrol et.`,
    });
  }

  return steps;
}

function prettyExpr(expr) {
  return expr.replace(/\*/g, '·');
}
