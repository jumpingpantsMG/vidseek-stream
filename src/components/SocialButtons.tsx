import { useEffect, useState } from "react";
import { ThumbsUp, Bell } from "lucide-react";
import { likedIds, onSocialChange, subscriptions, toggleLike, toggleSub } from "@/lib/interests";
import { cn } from "@/lib/utils";

function useSocial() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const off = onSocialChange(() => setTick((t) => t + 1));
    setTick((t) => t + 1);
    return () => {
      off();
    };
  }, []);
}

export function LikeButton({ id, title, vertical }: { id: string; title: string; vertical?: boolean }) {
  useSocial();
  const liked = typeof window !== "undefined" && likedIds().includes(id);
  return (
    <button
      onClick={() => toggleLike(id, title)}
      aria-label={liked ? "Unlike" : "Like"}
      aria-pressed={liked}
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium transition-colors",
        vertical
          ? "flex-col gap-1 text-xs"
          : "rounded-full bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/80",
      )}
    >
      <span className={cn(vertical && "grid h-12 w-12 place-items-center rounded-full bg-secondary")}>
        <ThumbsUp className={cn("h-5 w-5", liked && "fill-primary text-primary")} />
      </span>
      {liked ? "Liked" : "Like"}
    </button>
  );
}

export function SubscribeButton({ channel }: { channel: string }) {
  useSocial();
  if (!channel) return null;
  const subbed = typeof window !== "undefined" && subscriptions().includes(channel);
  return (
    <button
      onClick={() => toggleSub(channel)}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
        subbed
          ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          : "bg-foreground text-background hover:opacity-90",
      )}
    >
      {subbed && <Bell className="h-4 w-4" />}
      {subbed ? "Subscribed" : "Subscribe"}
    </button>
  );
}

export function ChannelAvatar({ channel }: { channel: string }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
      {(channel || "?").charAt(0).toUpperCase()}
    </span>
  );
}
