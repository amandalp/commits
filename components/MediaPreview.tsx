import { isVideoUrl } from "@/lib/utils";

/** Renders an attached photo or video from the public `media` bucket. */
export function MediaPreview({
  url,
  className = "",
}: {
  url: string;
  className?: string;
}) {
  if (isVideoUrl(url)) {
    return (
      <video
        src={url}
        controls
        playsInline
        className={`w-full rounded-2xl border border-border bg-black object-cover ${className}`}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="Attachment"
      className={`w-full rounded-2xl border border-border object-cover ${className}`}
    />
  );
}
