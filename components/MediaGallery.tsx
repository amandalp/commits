import { MediaPreview } from "./MediaPreview";

/**
 * Renders a commit's attached media. A single item shows full-width; several
 * lay out in a tidy square grid.
 */
export function MediaGallery({
  urls,
  className = "",
}: {
  urls: string[];
  className?: string;
}) {
  if (!urls.length) return null;

  if (urls.length === 1) {
    return (
      <div className={className}>
        <MediaPreview url={urls[0]} />
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {urls.map((url) => (
        <MediaPreview
          key={url}
          url={url}
          className="aspect-square h-full"
        />
      ))}
    </div>
  );
}
