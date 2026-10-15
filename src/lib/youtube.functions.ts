import { createServerFn } from "@tanstack/react-start";

export type YTVideo = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration?: string;
  views?: string;
  published?: string;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

async function fetchInitialData(q: string, shorts = false): Promise<any | null> {
  // sp=EgIYAQ%3D%3D = "under 4 minutes" filter, good for shorts
  const sp = shorts ? "&sp=EgIYAQ%253D%253D" : "";
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}${sp}&hl=en&persist_hl=1`;
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" } });
  if (!res.ok) return null;
  const html = await res.text();
  const marker = "var ytInitialData = ";
  const start = html.indexOf(marker);
  if (start === -1) return null;
  const jsonStart = start + marker.length;
  const end = html.indexOf(";</script>", jsonStart);
  if (end === -1) return null;
  try {
    return JSON.parse(html.slice(jsonStart, end));
  } catch {
    return null;
  }
}

function parseVideos(parsed: any, limit: number): YTVideo[] {
  const videos: YTVideo[] = [];
  const sections =
    parsed?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents ?? [];
  for (const section of sections) {
    for (const item of section?.itemSectionRenderer?.contents ?? []) {
      const v = item?.videoRenderer;
      if (!v?.videoId) continue;
      const id = v.videoId as string;
      const thumbs = v.thumbnail?.thumbnails ?? [];
      videos.push({
        id,
        title: v.title?.runs?.[0]?.text ?? "",
        channel: v.ownerText?.runs?.[0]?.text ?? v.longBylineText?.runs?.[0]?.text ?? "",
        thumbnail: thumbs[thumbs.length - 1]?.url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        duration: v.lengthText?.simpleText,
        views: v.viewCountText?.simpleText ?? v.shortViewCountText?.simpleText,
        published: v.publishedTimeText?.simpleText,
      });
      if (videos.length >= limit) return videos;
    }
  }
  return videos;
}

function durationSeconds(d?: string) {
  if (!d) return Infinity;
  return d.split(":").reduce((a, p) => a * 60 + Number(p), 0);
}

function collectShorts(node: any, out: Map<string, YTVideo>) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const n of node) collectShorts(n, out);
    return;
  }
  const lock = node.shortsLockupViewModel;
  if (lock) {
    const id = lock.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId ?? lock.entityId?.replace(/^shorts-shelf-item-/, "");
    if (id && !out.has(id)) {
      out.set(id, {
        id,
        title: lock.overlayMetadata?.primaryText?.content ?? lock.accessibilityText ?? "",
        channel: "",
        thumbnail: `https://i.ytimg.com/vi/${id}/oar2.jpg`,
        views: lock.overlayMetadata?.secondaryText?.content,
      });
    }
  }
  const reel = node.reelItemRenderer;
  if (reel?.videoId && !out.has(reel.videoId)) {
    out.set(reel.videoId, {
      id: reel.videoId,
      title: reel.headline?.simpleText ?? "",
      channel: "",
      thumbnail: `https://i.ytimg.com/vi/${reel.videoId}/oar2.jpg`,
      views: reel.viewCountText?.simpleText,
    });
  }
  for (const k in node) collectShorts(node[k], out);
}

const validateQ = (data: { q: string }) => {
  if (!data || typeof data.q !== "string") throw new Error("Invalid query");
  const q = data.q.trim().slice(0, 200);
  if (!q) throw new Error("Empty query");
  return { q };
};

const validateTopics = (data: { topics: string[] }) => {
  const topics = Array.isArray(data?.topics)
    ? data.topics.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim().slice(0, 100)).slice(0, 5)
    : [];
  return { topics: topics.length ? topics : ["trending"] };
};

export const searchYouTube = createServerFn({ method: "GET" })
  .inputValidator(validateQ)
  .handler(async ({ data }) => {
    const parsed = await fetchInitialData(data.q);
    if (!parsed) return { videos: [] as YTVideo[], error: "Could not load results" as string | null };
    return { videos: parseVideos(parsed, 30), error: null as string | null };
  });

/** Home feed: mixes results from several interest topics. */
export const getFeed = createServerFn({ method: "POST" })
  .inputValidator(validateTopics)
  .handler(async ({ data }) => {
    const results = await Promise.all(
      data.topics.map(async (t) => {
        const p = await fetchInitialData(t);
        return p ? parseVideos(p, 12).map((v) => ({ ...v, topic: t })) : [];
      }),
    );
    return { buckets: results };
  });

/** Shorts feed: vertical short videos for the given topics. */
export const getShorts = createServerFn({ method: "POST" })
  .inputValidator(validateTopics)
  .handler(async ({ data }) => {
    const results = await Promise.all(
      data.topics.map(async (t) => {
        const p = await fetchInitialData(`${t} #shorts`, true);
        if (!p) return [];
        const map = new Map<string, YTVideo>();
        collectShorts(p, map);
        for (const v of parseVideos(p, 30)) {
          if (!map.has(v.id) && durationSeconds(v.duration) <= 180) map.set(v.id, v);
        }
        return [...map.values()].map((v) => ({ ...v, topic: t }));
      }),
    );
    return { buckets: results };
  });
