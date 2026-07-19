/**
 * Extract & evaluate exam-style arithmetic from OCR text.
 * Handles fractions, parentheses, ·/×/÷, stacked fraction via "/" lines.
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
  // simple fraction approx for halves/quarters
  for (const den of [2, 3, 4, 5, 8, 10, 16]) {
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

function extractCandidateExprs(ocrText) {
  const text = ocrText.replace(/\r/g, '\n');
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const joined = lines.join(' ');
  const candidates = new Set();

  // Full-line math-ish
  for (const line of lines) {
    if (/[0-9]/.test(line) && /[+\-−*/·×÷()/]/.test(line)) {
      candidates.add(line);
    }
  }

  // Capture patterns like 5(2-3/5) / 2(3-5/2)
  const stacked = joined.match(
    /([0-9().+\-−*/·×÷\s]{5,80})\s*(?:\/|:)\s*([0-9().+\-−*/·×÷\s]{5,80})/,
  );
  if (stacked) {
    candidates.add(`(${stacked[1]})/(${stacked[2]})`);
  }

  // Also try whole blob without Turkish words
  const stripped = joined
    .replace(/işleminin sonucu kaçtır\??/gi, '')
    .replace(/[A-Ea-e]\)\s*[0-9./]+/g, '')
    .replace(/[^0-9().+\-−*/·×÷\s]/g, ' ');
  if (/[0-9]/.test(stripped)) candidates.add(stripped);

  return [...candidates];
}

function normalizeExpr(raw) {
  let s = toAsciiMath(raw);
  // insert * between number/) and (
  s = s.replace(/(\d|\))\(/g, '$1*(');
  s = s.replace(/\)(\d)/g, ')*$1');
  // collapse
  s = s.replace(/[^0-9+\-*/().]/g, '');
  return s;
}

/**
 * @returns {{ expr: string, value: number, choice?: string, ocr: string } | null}
 */
export function evaluateExpression(ocrText) {
  const choices = parseChoices(ocrText);

  // Prefer stacked fraction (pay / payda on separate lines) — common in exam scans.
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
      const score = (choice ? 100 : 0) + (expr.includes('*') ? 2 : 0);
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
