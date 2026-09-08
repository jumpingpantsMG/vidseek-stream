import { createFileRoute } from "@tanstack/react-router";
import { fetchYouTubeSearch } from "@/lib/youtube.server";

export const Route = createFileRoute("/api/public/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") ?? "").trim().slice(0, 200);
        const type = url.searchParams.get("type");
        const limit = Math.min(Number(url.searchParams.get("limit") ?? 30) || 30, 60);

        if (!q) {
          return Response.json(
            { error: "Missing required query parameter: q" },
            { status: 400 },
          );
        }

        const { videos, error } = await fetchYouTubeSearch(q);
        if (error) return Response.json({ error }, { status: 502 });

        let results = videos;
        if (type === "shorts") results = results.filter((v) => v.isShort);
        if (type === "videos") results = results.filter((v) => !v.isShort);

        return Response.json(
          { query: q, count: Math.min(results.length, limit), results: results.slice(0, limit) },
          { headers: { "cache-control": "public, max-age=300" } },
        );
      },
    },
  },
});
