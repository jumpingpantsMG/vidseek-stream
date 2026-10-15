// Client-side recommendation "algorithm": learns interests from searches & watches.
const KEY = "tubesearch:interests:v1";
const WATCHED = "tubesearch:watched:v1";
const SEEDS = ["music", "gaming", "funny", "science", "sports", "cooking", "tech"];

type Store = Record<string, number>;

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(localStorage.getItem(k) ?? "") as T;
  } catch {
    return fallback;
  }
}

const STOP = new Set("the a an and or of to in on for with is it this that my your how what why i you we".split(" "));

export function learn(text: string, weight = 1) {
  const s = read<Store>(KEY, {});
  // decay everything slightly so tastes drift over time
  for (const k in s) s[k] *= 0.97;
  const phrase = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
  if (!phrase) return;
  const words = phrase.split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
  if (phrase.split(/\s+/).length <= 4) s[phrase] = (s[phrase] ?? 0) + weight * 2;
  for (const w of words.slice(0, 6)) s[w] = (s[w] ?? 0) + weight * 0.5;
  const top = Object.entries(s).sort((a, b) => b[1] - a[1]).slice(0, 60);
  localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(top)));
}

export function markWatched(id: string, title: string) {
  const w = read<string[]>(WATCHED, []);
  localStorage.setItem(WATCHED, JSON.stringify([id, ...w.filter((x) => x !== id)].slice(0, 300)));
  learn(title, 1);
}

export function watchedSet() {
  return new Set(read<string[]>(WATCHED, []));
}

/** Weighted random pick of topics; always includes one exploration seed. */
export function pickTopics(n = 4): string[] {
  const entries = Object.entries(read<Store>(KEY, {})).filter(([, v]) => v > 0.3);
  const picks: string[] = [];
  const pool = [...entries];
  while (picks.length < n - 1 && pool.length) {
    const total = pool.reduce((a, [, v]) => a + v, 0);
    let r = Math.random() * total;
    const idx = pool.findIndex(([, v]) => (r -= v) <= 0);
    picks.push(pool.splice(Math.max(idx, 0), 1)[0][0]);
  }
  const seeds = SEEDS.filter((s) => !picks.includes(s)).sort(() => Math.random() - 0.5);
  while (picks.length < n) picks.push(seeds.pop()!);
  return picks;
}

/** Interleave buckets round-robin, dedupe, push watched videos to the back. */
export function mix<T extends { id: string }>(buckets: T[][]): T[] {
  const seen = new Set<string>();
  const watched = watchedSet();
  const fresh: T[] = [];
  const old: T[] = [];
  const bs = buckets.map((b) => [...b]);
  while (bs.some((b) => b.length)) {
    for (const b of bs) {
      const v = b.shift();
      if (!v || seen.has(v.id)) continue;
      seen.add(v.id);
      (watched.has(v.id) ? old : fresh).push(v);
    }
  }
  return [...fresh, ...old];
}

// ---- Likes & subscriptions (also feed the algorithm) ----
const LIKES = "tubesearch:likes:v1";
const SUBS = "tubesearch:subs:v1";
const listeners = new Set<() => void>();
export function onSocialChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const emit = () => listeners.forEach((f) => f());

export function likedIds(): string[] {
  return read<string[]>(LIKES, []);
}
export function toggleLike(id: string, title: string): boolean {
  const l = likedIds();
  const on = !l.includes(id);
  localStorage.setItem(LIKES, JSON.stringify(on ? [id, ...l] : l.filter((x) => x !== id)));
  if (on) learn(title, 3);
  emit();
  return on;
}
export function subscriptions(): string[] {
  return read<string[]>(SUBS, []);
}
export function toggleSub(channel: string): boolean {
  const s = subscriptions();
  const on = !s.includes(channel);
  localStorage.setItem(SUBS, JSON.stringify(on ? [channel, ...s] : s.filter((x) => x !== channel)));
  emit();
  return on;
}
/** Topics plus one subscribed channel so subscriptions show up in the feed. */
export function pickFeedTopics(n = 4): string[] {
  const subs = subscriptions();
  const t = pickTopics(subs.length ? n - 1 : n);
  if (subs.length) t.unshift(subs[Math.floor(Math.random() * subs.length)]);
  return t;
}
