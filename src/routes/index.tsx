import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Search, Play, X } from "lucide-react";
import { searchYouTube, type YTVideo } from "@/lib/youtube.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Tube Search — Find & watch YouTube videos" },
      {
        name: "description",
        content: "Search YouTube and watch videos in a clean, fast player.",
      },
      { property: "og:title", content: "TubeSearch — Search and Watch YouTube Videos" },
      {
        property: "og:description",
        content: "Search for YouTube videos and watch them in a clean, distraction-free player.",
      },
      { property: "og:url", content: "https://tube-search.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://tube-search.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  const [query, setQuery] = useState("");
  const [playing, setPlaying] = useState<YTVideo | null>(null);
  const searchFn = useServerFn(searchYouTube);

  const { mutate, data, isPending, error } = useMutation({
    mutationFn: (q: string) => searchFn({ data: { q } }),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) mutate(q);
  };

  const videos = data?.videos ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Play className="h-4 w-4 fill-current" />
            </span>
            <span>TubeSearch</span>
          </div>
          <form onSubmit={onSubmit} className="ml-auto flex w-full max-w-xl gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search YouTube…"
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Searching…" : "Search"}
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {!data && !isPending && (
          <div className="py-20 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              Search and watch videos
            </h1>
            <p className="mt-2 text-muted-foreground">
              Type anything above to find YouTube videos.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">
            {(error as Error).message}
          </p>
        )}
        {data?.error && (
          <p className="text-sm text-destructive">{data.error}</p>
        )}

        {isPending && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video w-full rounded-lg bg-muted" />
                <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        )}

        {!isPending && videos.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <button
                key={v.id}
                onClick={() => setPlaying(v)}
                className="group text-left"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
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
                <h3 className="mt-3 line-clamp-2 text-sm font-medium leading-snug">
                  {v.title}
                </h3>
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

      {playing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPlaying(null)}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPlaying(null)}
              aria-label="Close"
              className="absolute -top-10 right-0 inline-flex items-center gap-1 text-sm text-white/80 hover:text-white"
            >
              <X className="h-4 w-4" /> Close
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              <iframe
                key={playing.id}
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1&rel=0&playsinline=1`}
                title={playing.title}
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-white">{playing.title}</h2>
                <p className="text-sm text-white/70">{playing.channel}</p>
              </div>
              <a
                href={`https://www.youtube.com/watch?v=${playing.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
              >
                Open on YouTube
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
