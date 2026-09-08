import { createServerFn } from "@tanstack/react-start";

export type { YTVideo } from "./youtube.server";

export const searchYouTube = createServerFn({ method: "GET" })
  .inputValidator((data: { q: string }) => {
    if (!data || typeof data.q !== "string") throw new Error("Invalid query");
    const q = data.q.trim().slice(0, 200);
    if (!q) throw new Error("Empty query");
    return { q };
  })
  .handler(async ({ data }) => {
    const { fetchYouTubeSearch } = await import("./youtube.server");
    return fetchYouTubeSearch(data.q);
  });
