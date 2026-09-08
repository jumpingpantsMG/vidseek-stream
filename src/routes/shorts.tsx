import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { searchYouTube, type YTVideo } from "@/lib/youtube.functions";
import { AppShell } from "@/components/AppShell";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";

export const Route = createFileRoute("/shorts")({
  head: () => ({
    meta: [
      { title: "Shorts — TubeSearch" },
      {
        name: "description",
        content: "Browse short vertical YouTube videos and play them in a full-screen player.",
      },
      { property: "og:title", content: "Shorts — TubeSearch" },
      {
        property: "og:description",
        content: "Browse short vertical YouTube videos and play them instantly.",
      },
    ],
  }),
  component: ShortsPage,
});

function ShortsPage() {
  const [query, setQuery] = useState("");
  const [playing, setPlaying] = useState<YTVideo | null>(null);
  const searchFn = useServerFn(searchYouTube);

  const { mutate, data, isPending } = useMutation({
    mutationFn: (q: string) => searchFn({ data: { q: `${q} #shorts` } }),
  });

  const shorts = (data?.videos ?? []).filter((v) => v.isShort);

  return (
    <AppShell query={query} setQuery={setQuery} onSearch={(q) => q && mutate(q)}>
      <main className="px-6 py-6">
        <h1 className="text-2xl font-bold tracking-tight">Shorts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search above to find short vertical videos.
        </p>

        {isPending && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {!isPending && data && shorts.length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">No shorts found for that search.</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {shorts.map((v) => (
            <ShortCard key={v.id} video={v} onPlay={() => setPlaying(v)} />
          ))}
        </div>
      </main>
      {playing && <VideoPlayerModal video={playing} onClose={() => setPlaying(null)} />}
    </AppShell>
  );
}

export function ShortCard({ video, onPlay }: { video: YTVideo; onPlay: () => void }) {
  return (
    <button onClick={onPlay} className="group w-full text-left">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-muted">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
        />
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{video.title}</h3>
      {video.views && <p className="text-xs text-muted-foreground">{video.views}</p>}
    </button>
  );
}
