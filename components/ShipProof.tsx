import { LinkIcon } from "lucide-react";

/** Renders a shipped/update's proof: an image and/or an outbound link. */
export function ShipProof({
  mediaUrl,
  linkUrl,
}: {
  mediaUrl?: string | null;
  linkUrl?: string | null;
}) {
  if (!mediaUrl && !linkUrl) return null;
  let host = "";
  try {
    if (linkUrl) host = new URL(linkUrl).hostname.replace(/^www\./, "");
  } catch {
    host = linkUrl ?? "";
  }

  return (
    <div className="mt-3 space-y-2.5">
      {mediaUrl && (
        <img
          src={mediaUrl}
          alt="Proof"
          className="w-full rounded-2xl border border-border object-cover"
        />
      )}
      {linkUrl && (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm hover:border-border-strong"
        >
          <LinkIcon className="h-4 w-4 shrink-0 text-accent" />
          <span className="truncate font-medium text-accent">{host}</span>
        </a>
      )}
    </div>
  );
}
