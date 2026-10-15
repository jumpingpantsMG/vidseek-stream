import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getShorts, type YTVideo } from "@/lib/youtube.functions";
import { markWatched, mix, pickTopics } from "@/lib/interests";

export const Route = createFileRoute("/shorts")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Shorts — TubeSearch" },
      { name: "description", content: "Swipe through an endless feed of short videos picked for you." },
      { property: "og:title", content: "Shorts — TubeSearch" },
      { property: "og:description", content: "Swipe through an endless feed of short videos picked for you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Shorts,
});

function Shorts() {
  const fetchShorts = useServerFn(getShorts);
  const [items, setItems] = useState<YTVideo[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const ids = useRef(new Set<string>());
  const container = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { buckets } = await fetchShorts({ data: { topics: pickTopics(3) } });
      const next = mix(buckets).filter((v) => !ids.current.has(v.id));
      next.forEach((v) => ids.current.add(v.id));
      setItems((p) => [...p, ...next]);
    } finally {
      setLoading(false);
    }
  }, [fetchShorts, loading]);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.idx));
        }
      },
      { root: el, threshold: 0.6 },
    );
    el.querySelectorAll("[data-idx]").forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, [items.length]);

  useEffect(() => {
    const v = items[active];
    if (v) markWatched(v.id, v.title);
    if (items.length && active >= items.length - 3) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, items.length]);

  return (
    <div className="fixed inset-0 bg-background">
      <Link
        to="/"
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-card/80 px-3 py-1.5 text-sm text-foreground backdrop-blur"
      >
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>
      <div ref={container} className="h-full snap-y snap-mandatory overflow-y-scroll">
        {items.map((v, i) => (
          <section key={v.id} data-idx={i} className="flex h-full snap-start items-center justify-center p-2">
            <div className="relative aspect-[9/16] h-full max-h-[90vh] overflow-hidden rounded-xl bg-muted">
              {Math.abs(i - active) <= 0 ? (
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&loop=1&playlist=${v.id}&rel=0&playsinline=1&controls=1`}
                  title={v.title}
                  allow="autoplay; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover" loading="lazy" />
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-4 pb-16">
                <p className="line-clamp-2 text-sm font-medium">{v.title}</p>
                {v.views && <p className="text-xs text-muted-foreground">{v.views}</p>}
              </div>
            </div>
          </section>
        ))}
        {(loading || !items.length) && (
          <div className="flex h-full snap-start items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading shorts…
          </div>
        )}
      </div>
    </div>
  );
}
