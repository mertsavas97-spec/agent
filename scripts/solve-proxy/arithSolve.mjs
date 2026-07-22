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

function stripQuestionNumbers(text) {
  return String(text || '')
    .replace(/(?:^|\n)\s*\d{1,3}[.)]\s+/g, '\n')
    .replace(/^\s*\d{1,3}[.)]\s+/, '');
}

function extractCandidateExprs(ocrText) {
  const text = stripQuestionNumbers(ocrText).replace(/\r/g, '\n');
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const joined = lines.join(' ');
  const candidates = new Set();

  const vertical = reconstructVerticalMath(ocrText);
  if (vertical) candidates.add(vertical);

  for (const line of lines) {
    const clean = stripQuestionNumbers(line).trim();
    if (/[0-9]/.test(clean) && /[+\-−*/·×÷()/]/.test(clean) && !/^[A-E]\)/i.test(clean)) {
      candidates.add(clean);
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
    candidates.add(stripped);
  }

  return [...candidates];
}

function normalizeExpr(raw) {
  let s = stripQuestionNumbers(String(raw))
    .replace(/[·•∙]/g, '*')
    .replace(/[×xX]/g, '*')
    .replace(/[÷:]/g, '/')
    .replace(/−/g, '-');
  // Keep intentional spaces around / only long enough to detect a/b — then strip
  s = s.replace(/(\d)\s*\/\s*(\d)/g, '$1/$2');
  // Kill glued "3.2+2*3" from "3. 2 + 2 × 3" if strip missed: leading N.digit → digit when N is small Q#
  s = s.replace(/^([1-9]\d?)\.([1-9]\d?[+\-*/(])/g, '$2');
  s = s.replace(/^([1-9]\d?)\.(\d[+\-*/])/g, '$2');
  s = s.replace(/\s+/g, '');
  // KPSS textbooks often nest [outer] around (inner) — treat [] as ()
  s = s.replace(/\[/g, '(').replace(/\]/g, ')');
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
 * LGS-style fraction-of chain: whole × a/b × c/d (e.g. 24 × 3/8 × 1/3 = 3).
 * Requires narrative cues so pure arithmetic lines are not stolen.
 */
export function tryFractionOfChain(ocrText, choices = parseChoices(ocrText)) {
  const head = stripQuestionNumbers(ocrText.split(/\n\s*[A-Ea-e]\)/)[0] || '');
  // Require Turkish "…'si / …'i" possessive after the fraction (word problem cue).
  const ofFracMarks = (
    head.match(/\d+\s*\/\s*\d+\s*['''´`][iıüeüa]/gi) || []
  ).length;
  const narrative =
    /(öğrenci|kız|erkek|kulüp|spor)/i.test(head) || ofFracMarks >= 1;
  // Pure "işleminin sonucu" stacks must not be treated as word problems.
  if (!narrative || /işleminin sonucu/i.test(head)) return null;

  const fracMatches = [...head.matchAll(/(\d+)\s*\/\s*(\d+)/g)];
  if (fracMatches.length < 1) return null;

  const firstFracAt = head.search(/\d+\s*\/\s*\d+/);
  const before = firstFracAt >= 0 ? head.slice(0, firstFracAt) : head;
  const wholes = [...before.matchAll(/\b(\d{1,4})\b/g)].map((m) => Number(m[1]));
  // OCR may leave a detached numerator immediately before injected fraction
  // tokens. The meaningful class/product total is normally the largest whole
  // in the stem (e.g. 24), not that detached "3".
  const whole = wholes.filter((n) => n >= 2).sort((a, b) => b - a)[0];
  if (whole == null) return null;

  let value = whole;
  let expr = String(whole);
  for (const m of fracMatches) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (!b) return null;
    value = (value * a) / b;
    expr += `*(${a}/${b})`;
  }
  if (!Number.isFinite(value)) return null;
  const choice = matchChoice(value, choices);
  if (Object.keys(choices).length > 0 && !choice) return null;
  return { expr, value, choice, kind: 'fraction_of' };
}

/**
 * Plug MCQ choices into a linear equation (ax+b = cx+d). Handles 3(x-2)+4 = 2x+7.
 */
export function tryLinearEquation(ocrText, choices = parseChoices(ocrText)) {
  let headRaw = stripQuestionNumbers(ocrText.split(/\n\s*[A-Ea-e]\)/)[0] || '')
    .replace(/denklemini sağlayan.*$/i, '')
    .replace(/aşağıdakilerden.*$/i, '')
    .replace(/[−–—~∼]/g, '-');
  // Camera/screen often loses "=" → recover ")+4 2x" / ")44 - 2x"
  if (!/=/.test(headRaw) && /[xX]/.test(headRaw)) {
    headRaw = headRaw
      .replace(/\)(\d)\1\s*[-–—]\s*([0-9xX])/g, ')+$1=$2')
      .replace(/\)(\d)(\d)\s*[-–—]\s*([0-9xX])/g, ')+$2=$3')
      .replace(/(\)[+*]?\d+)\s+([0-9]*[xX])/i, '$1=$2');
  }
  if (!/[xX]/.test(headRaw) || !/=/.test(headRaw)) return null;

  const eqIdx = headRaw.search(/=/);
  if (eqIdx < 0) return null;
  let L = eqIdx - 1;
  while (L >= 0 && /[0-9xX()+\-*/.\s]/.test(headRaw[L])) L -= 1;
  let R = eqIdx + 1;
  while (R < headRaw.length && /[0-9xX()+\-*/.\s]/.test(headRaw[R])) R += 1;
  // Drop leading "1." question labels / OCR junk glued into the math span
  let left = headRaw
    .slice(L + 1, eqIdx)
    .replace(/^[^0-9(xX]+/, '')
    .replace(/^\d{1,3}\.\s+/, '')
    // Tesseract frequently reads "+ 4" as "4 4" after a closing parenthesis.
    .replace(/\)\s*4\s+(\d)/g, ')+$1')
    .replace(/\)44(?=\s*$)/g, ')+4')
    .trim();
  let right = headRaw.slice(eqIdx + 1, R).trim();
  if (!left || !right) return null;

  const leftN = normalizeEqSide(left);
  const rightN = normalizeEqSide(right);
  if (!leftN || !rightN) return null;

  const entries = Object.entries(choices);
  if (entries.length === 0) return null;

  for (const [label, raw] of entries) {
    const x = choiceValue(raw);
    if (!Number.isFinite(x)) continue;
    try {
      const lv = evalArith(leftN.replace(/x/gi, `(${x})`));
      const rv = evalArith(rightN.replace(/x/gi, `(${x})`));
      if (Math.abs(lv - rv) < 1e-6) {
        return {
          expr: `${leftN}=${rightN}`,
          value: x,
          choice: label,
          kind: 'linear_eq',
        };
      }
    } catch {
      /* try next choice */
    }
  }
  return null;
}

/** Normalize one side of an equation for evalArith (keep x, expand n(…). */
function normalizeEqSide(raw) {
  let s = String(raw)
    .replace(/[·•∙]/g, '*')
    .replace(/[×]/g, '*')
    .replace(/[÷:]/g, '/')
    .replace(/−|–/g, '-')
    .replace(/\s+/g, '');
  // 3(x-2) → 3*(x-2); )( → )*(
  s = s.replace(/(\d)\(/g, '$1*(');
  s = s.replace(/\)(\d)/g, ')*$1');
  s = s.replace(/\)\(/g, ')*(');
  s = s.replace(/(\d)x/gi, '$1*x');
  s = s.replace(/[^0-9xX+\-*/().]/g, '');
  if (!s || !/[xX]/.test(s)) return null;
  return s.replace(/X/g, 'x');
}

/**
 * Sequential percent up/down: 100 × (1±p/100) × … → final index (e.g. 90).
 */
export function tryPercentChain(ocrText, choices = parseChoices(ocrText)) {
  const head = stripQuestionNumbers(ocrText.split(/\n\s*[A-Ea-e]\)/)[0] || '')
    // Tesseract commonly reads the percent sign as 9 / 94: "%25" → "925"/"9425".
    // Only recover this shape directly before increase/decrease verbs.
    .replace(/\b9\d?(\d{2})\s+(?=(?:azalt|artır|arttir|indir))/gi, '%$1 ');
  if (!/%\s*\d+/.test(head)) return null;
  if (!/(artır|arttir|azalt|indir|yüzde\s*kaç)/i.test(head)) return null;

  const events = [];
  const re = /%\s*(\d+)/g;
  let m;
  while ((m = re.exec(head))) {
    const pct = Number(m[1]);
    const window = head.slice(m.index, m.index + 48).toLocaleLowerCase('tr-TR');
    let sign = 0;
    if (/artır|arttir|yükselt/.test(window)) sign = 1;
    else if (/azalt|indir|düşür|eksilt/.test(window)) sign = -1;
    if (sign !== 0) events.push({ pct, sign });
  }
  if (events.length < 1) return null;

  let value = 100;
  let expr = '100';
  for (const e of events) {
    const factor = 1 + (e.sign * e.pct) / 100;
    value *= factor;
    expr += `*${factor}`;
  }
  if (!Number.isFinite(value)) return null;
  const choice = matchChoice(value, choices);
  if (Object.keys(choices).length > 0 && !choice) return null;
  return { expr, value, choice, kind: 'percent_chain', events };
}

/**
 * @returns {{ expr: string, value: number, choice?: string, ocr: string, num?: number, den?: number, kind?: string } | null}
 */
export function evaluateExpression(ocrText) {
  const choices = parseChoices(ocrText);

  // Exam-style structured solvers first (before brittle digit-gluing extractors).
  const fractionOf = tryFractionOfChain(ocrText, choices);
  if (fractionOf) return { ...fractionOf, ocr: ocrText };

  const linearEq = tryLinearEquation(ocrText, choices);
  if (linearEq) return { ...linearEq, ocr: ocrText };

  const percentChain = tryPercentChain(ocrText, choices);
  if (percentChain) return { ...percentChain, ocr: ocrText };

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
  // When şıklar exist, never ship a glued false positive (e.g. 24.3/8.1/3 → 1).
  if (scored && (!Object.keys(choices).length || scored.choice)) {
    return { ...scored, ocr: ocrText };
  }

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
  const { expr, value, choice, num, den, kind, events } = evaluated;
  const steps = [];

  if (kind === 'fraction_of') {
    steps.push({
      title: '1. Kesirleri sırayla uygula',
      body: `Başlangıç ve paylar: ${prettyExpr(expr)}.`,
    });
    steps.push({
      title: '2. Çarp',
      body: `Her kesiri bir öncekinin üzerine uygula → ${formatNum(value)}.`,
    });
  } else if (kind === 'linear_eq') {
    steps.push({
      title: '1. Denklemi yaz',
      body: `Denklem: ${prettyExpr(expr)}.`,
    });
    steps.push({
      title: '2. Şıkları dene',
      body: `x = ${formatNum(value)} her iki tarafı eşitliyor.`,
    });
  } else if (kind === 'percent_chain') {
    const detail = Array.isArray(events)
      ? events
          .map((e) => `%${e.pct} ${e.sign > 0 ? 'artış' : 'azalış'}`)
          .join(', sonra ')
      : prettyExpr(expr);
    steps.push({
      title: '1. 100 birim varsay',
      body: `Başlangıç = 100. Zincir: ${detail}.`,
    });
    steps.push({
      title: '2. Çarpanları uygula',
      body: `${prettyExpr(expr)} = ${formatNum(value)}.`,
    });
  } else if (typeof num === 'number' && typeof den === 'number') {
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
