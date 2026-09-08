import { X } from "lucide-react";
import type { YTVideo } from "@/lib/youtube.functions";

export function VideoPlayerModal({
  video,
  onClose,
}: {
  video: YTVideo;
  onClose: () => void;
}) {
  const vertical = video.isShort;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div
        className={vertical ? "relative w-full max-w-sm" : "relative w-full max-w-4xl"}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-9 right-0 inline-flex items-center gap-1 text-sm text-white/80 hover:text-white"
        >
          <X className="h-4 w-4" /> Close
        </button>
        <div
          className={`w-full overflow-hidden rounded-xl bg-black ${vertical ? "aspect-[9/16]" : "aspect-video"}`}
        >
          <iframe
            key={video.id}
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&playsinline=1`}
            title={video.title}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-white">{video.title}</h2>
            <p className="text-sm text-white/70">{video.channel}</p>
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
          >
            Open on YouTube
          </a>
        </div>
      </div>
    </div>
  );
}
