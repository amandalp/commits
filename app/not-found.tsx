import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="font-display text-6xl font-extrabold text-ink">404</div>
      <p className="mt-3 text-muted">
        This commitment doesn&apos;t exist, or it was never put on the record.
      </p>
      <Link href="/" className="mt-6">
        <Button>Back to feed</Button>
      </Link>
    </div>
  );
}
