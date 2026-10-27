import { cn, mediaUrl } from "@/lib/utils";

/** User avatar: the uploaded photo when present, otherwise the name's initial. */
export function Avatar({ name, src, className }: { name?: string | null; src?: string | null; className?: string }) {
  const url = mediaUrl(src);
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand/10 font-bold text-brand", className)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        (name?.charAt(0).toUpperCase() ?? "U")
      )}
    </span>
  );
}
