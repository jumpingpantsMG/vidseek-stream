import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Clapperboard } from "lucide-react";
import { searchYouTube, type YTVideo } from "@/lib/youtube.functions";
import { AppShell } from "@/components/AppShell";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { ShortCard } from "./shorts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TubeSearch — Search and watch YouTube videos & shorts" },
      {
        name: "description",
        content:
          "Search YouTube, browse shorts and watch videos in a clean, fast, distraction-free player.",
      },
      { property: "og:title", content: "TubeSearch — Search and watch YouTube" },
      {
        property: "og:description",
        content: "Search YouTube, browse shorts and watch videos in a clean, fast player.",
      },
    ],
  }),
  component: Index,
});

const CHIPS = ["Music", "Gaming", "Live", "Podcasts", "News", "Coding", "Comedy", "Sports"];

function Index() {
  const [query, setQuery] = useState("");
  const [playing, setPlaying] = useState<YTVideo | null>(null);
  const searchFn = useServerFn(searchYouTube);

  const { mutate, data, isPending, error } = useMutation({
    mutationFn: (q: string) => searchFn({ data: { q } }),
  });

  const run = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    mutate(q.trim());
  };

  const all = data?.videos ?? [];
  const shorts = all.filter((v) => v.isShort);
  const videos = all.filter((v) => !v.isShort);

  return (
    <AppShell query={query} setQuery={setQuery} onSearch={run}>
      <div className="sticky top-14 z-20 flex gap-2 overflow-x-auto border-b border-border bg-background px-6 py-3">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => run(c)}
            className="shrink-0 rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            {c}
          </button>
        ))}
      </div>

      <main className="px-6 py-6">
        {!data && !isPending && (
          <div className="py-24 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Search and watch videos</h1>
            <p className="mt-2 text-muted-foreground">
              Type in the search bar or pick a topic above.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        {data?.error && <p className="text-sm text-destructive">{data.error}</p>}

        {isPending && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video w-full rounded-xl bg-muted" />
                <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        )}

        {!isPending && shorts.length > 0 && (
          <section className="mb-10">
            <div className="mb-3 flex items-center gap-2">
              <Clapperboard className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-bold tracking-tight">Shorts</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {shorts.map((v) => (
                <div key={v.id} className="w-36 shrink-0 sm:w-44">
                  <ShortCard video={v} onPlay={() => setPlaying(v)} />
                </div>
              ))}
            </div>
          </section>
        )}

        {!isPending && videos.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((v) => (
              <button key={v.id} onClick={() => setPlaying(v)} className="group text-left">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                  {v.duration && (
                    <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                      {v.duration}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 line-clamp-2 text-sm font-medium leading-snug">{v.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {v.channel}
                  {v.views ? ` • ${v.views}` : ""}
                  {v.published ? ` • ${v.published}` : ""}
                </p>
              </button>
            ))}
          </div>
        )}
      </main>

      {playing && <VideoPlayerModal video={playing} onClose={() => setPlaying(null)} />}
    </AppShell>
  );
}
