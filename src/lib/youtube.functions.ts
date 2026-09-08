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

export const searchYouTube = createServerFn({ method: "GET" })
  .inputValidator((data: { q: string }) => {
    if (!data || typeof data.q !== "string") throw new Error("Invalid query");
    const q = data.q.trim().slice(0, 200);
    if (!q) throw new Error("Empty query");
    return { q };
  })
  .handler(async ({ data }) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(data.q)}&hl=en&persist_hl=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) {
      return { videos: [] as YTVideo[], error: `YouTube returned ${res.status}` };
    }
    const html = await res.text();
    const marker = "var ytInitialData = ";
    const start = html.indexOf(marker);
    if (start === -1) return { videos: [] as YTVideo[], error: "Could not parse results" };
    const jsonStart = start + marker.length;
    // find the matching ;</script>
    const end = html.indexOf(";</script>", jsonStart);
    if (end === -1) return { videos: [] as YTVideo[], error: "Could not parse results" };
    let parsed: any;
    try {
      parsed = JSON.parse(html.slice(jsonStart, end));
    } catch {
      return { videos: [] as YTVideo[], error: "Could not parse results" };
    }

    const videos: YTVideo[] = [];
    const sections =
      parsed?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents ?? [];
    for (const section of sections) {
      const items = section?.itemSectionRenderer?.contents ?? [];
      for (const item of items) {
        const v = item?.videoRenderer;
        if (!v?.videoId) continue;
        const id = v.videoId as string;
        const title = v.title?.runs?.[0]?.text ?? "";
        const channel =
          v.ownerText?.runs?.[0]?.text ??
          v.longBylineText?.runs?.[0]?.text ??
          "";
        const thumbs = v.thumbnail?.thumbnails ?? [];
        const thumbnail =
          thumbs[thumbs.length - 1]?.url ??
          `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        const duration =
          v.lengthText?.simpleText ?? v.lengthText?.accessibility?.accessibilityData?.label;
        const views = v.viewCountText?.simpleText ?? v.shortViewCountText?.simpleText;
        const published = v.publishedTimeText?.simpleText;
        videos.push({ id, title, channel, thumbnail, duration, views, published });
        if (videos.length >= 30) break;
      }
      if (videos.length >= 30) break;
    }

    return { videos, error: null as string | null };
  });
