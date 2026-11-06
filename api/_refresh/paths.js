// Targets are written like  L.tp.channel['Paid Search'].v  and point into the data objects (D, L, MAX, STD, R, ORD).
const TOKEN = /\[(?:'([^']*)'|"([^"]*)")\]|\.?([A-Za-z_][A-Za-z0-9_]*)/g;
export function tokens(path) {
  const out = []; let m, last = 0; TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(path))) { if (m.index !== last) throw new Error(`Bad path "${path}"`); out.push(m[1] ?? m[2] ?? m[3]); last = TOKEN.lastIndex; }
  if (last !== path.length) throw new Error(`Bad path "${path}"`);
  return out;
}
export const makePath = (parts) => parts.map((p, i) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(p) ? (i ? '.' + p : p) : `['${p}']`)).join('');
export const canon = (p) => makePath(tokens(p));
export const getAt = (roots, path) => { let c = roots; for (const t of tokens(path)) { if (c == null) return undefined; c = c[t]; } return c; };
export function setAt(roots, path, value) {
  const t = tokens(path); let c = roots;
  for (let i = 0; i < t.length - 1; i++) { if (c[t[i]] == null) throw new Error(`Cannot set ${path}`); c = c[t[i]]; }
  c[t[t.length - 1]] = value;
}
export function listArrays(obj, prefix = []) {
  if (Array.isArray(obj)) return obj.length && obj.every((x) => typeof x === 'number') ? [{ path: makePath(prefix), arr: obj }] : [];
  if (obj && typeof obj === 'object') return Object.entries(obj).flatMap(([k, v]) => listArrays(v, [...prefix, k]));
  return [];
}