export type YTVideo = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration?: string;
  views?: string;
  published?: string;
  isShort?: boolean;
};

function durationToSeconds(d?: string): number | null {
  if (!d) return null;
  const parts = d.split(":").map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

export async function fetchYouTubeSearch(
  q: string,
): Promise<{ videos: YTVideo[]; error: string | null }> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=en&persist_hl=1`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) return { videos: [], error: `YouTube returned ${res.status}` };

  const html = await res.text();
  const marker = "var ytInitialData = ";
  const start = html.indexOf(marker);
  if (start === -1) return { videos: [], error: "Could not parse results" };
  const jsonStart = start + marker.length;
  const end = html.indexOf(";</script>", jsonStart);
  if (end === -1) return { videos: [], error: "Could not parse results" };

  let parsed: any;
  try {
    parsed = JSON.parse(html.slice(jsonStart, end));
  } catch {
    return { videos: [], error: "Could not parse results" };
  }

  const videos: YTVideo[] = [];
  const push = (v: any) => {
    if (!v?.videoId || videos.some((x) => x.id === v.videoId)) return;
    const id = v.videoId as string;
    const thumbs = v.thumbnail?.thumbnails ?? [];
    const duration =
      v.lengthText?.simpleText ?? v.lengthText?.accessibility?.accessibilityData?.label;
    const secs = durationToSeconds(duration);
    videos.push({
      id,
      title: v.title?.runs?.[0]?.text ?? v.title?.simpleText ?? "",
      channel: v.ownerText?.runs?.[0]?.text ?? v.longBylineText?.runs?.[0]?.text ?? "",
      thumbnail: thumbs[thumbs.length - 1]?.url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      duration,
      views: v.viewCountText?.simpleText ?? v.shortViewCountText?.simpleText,
      published: v.publishedTimeText?.simpleText,
      isShort: secs !== null && secs <= 60,
    });
  };

  const sections =
    parsed?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
      ?.contents ?? [];
  for (const section of sections) {
    const items = section?.itemSectionRenderer?.contents ?? [];
    for (const item of items) {
      if (item?.videoRenderer) push(item.videoRenderer);
      const shelfItems =
        item?.reelShelfRenderer?.items ?? item?.shelfRenderer?.content?.verticalListRenderer?.items ?? [];
      for (const s of shelfItems) {
        const reel = s?.reelItemRenderer;
        if (reel?.videoId) {
          const id = reel.videoId as string;
          if (videos.some((x) => x.id === id)) continue;
          videos.push({
            id,
            title: reel.headline?.simpleText ?? "",
            channel: "",
            thumbnail:
              reel.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ??
              `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            views: reel.viewCountText?.simpleText,
            isShort: true,
          });
        }
        if (s?.videoRenderer) push(s.videoRenderer);
      }
      if (videos.length >= 60) break;
    }
    if (videos.length >= 60) break;
  }

  return { videos, error: null };
}
