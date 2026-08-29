"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui";
import { uploadMedia } from "@/lib/upload";
import { completeOnboarding, isUsernameAvailable } from "@/lib/actions/profile";
import { usernameOk } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [available, setAvailable] = useState<null | boolean>(null);
  const [checking, setChecking] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata ?? {};
      const guessName = meta.name || meta.full_name || "";
      if (guessName) setName(guessName);
      const emailLocal = data.user?.email?.split("@")[0] ?? "";
      setUsername(
        (guessName || emailLocal)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "")
          .slice(0, 20)
      );
      if (meta.avatar_url) setAvatar(meta.avatar_url);
    });
  }, [supabase]);

  // Debounced availability check. State updates happen inside the timer
  // (async) so the effect body stays free of synchronous setState.
  useEffect(() => {
    if (!usernameOk(username)) return;
    const t = setTimeout(async () => {
      setChecking(true);
      const { available } = await isUsernameAvailable(username);
      setAvailable(available);
      setChecking(false);
    }, 400);
    return () => clearTimeout(t);
  }, [username]);

  function onUsernameChange(value: string) {
    setUsername(value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20));
    setAvailable(null);
  }

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const res = await uploadMedia(file, "avatars");
    setAvatarUploading(false);
    if ("url" in res) setAvatar(res.url);
    else setError(res.error);
  }

  async function submit() {
    setPending(true);
    setError(null);
    const res = await completeOnboarding({ name, username, avatar_url: avatar });
    if (!res.ok) {
      setPending(false);
      setError(res.error);
      return;
    }
    router.refresh();
    router.push("/");
  }

  const canSubmit = name.trim() && usernameOk(username) && available !== false;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">
        Welcome to Commits
      </h1>
      <p className="mt-1.5 text-[15px] text-muted">Set up your profile. Takes 15 seconds.</p>

      <div className="mt-7 flex justify-center">
        <label className="relative cursor-pointer">
          <Avatar person={{ id: "me", name: name || "You", avatar_url: avatar }} size="xl" />
          <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white ring-2 ring-cream">
            {avatarUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
          </span>
          <input type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
        </label>
      </div>

      <div className="mt-7 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-muted">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Amanda Peterson"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-[15px] text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-muted">Username</span>
          <div className="flex items-center rounded-2xl border border-border bg-surface pl-4 focus-within:border-accent">
            <span className="text-[15px] text-muted">@</span>
            <input
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="amandap"
              className="flex-1 bg-transparent px-1 py-3.5 text-[15px] text-ink outline-none"
            />
            <span className="pr-4">
              {checking && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
              {!checking && available === true && (
                <Check className="h-4 w-4 text-success" strokeWidth={2.5} />
              )}
            </span>
          </div>
          {available === false && (
            <p className="mt-1.5 text-[13px] text-[#d1477a]">That username is taken.</p>
          )}
        </label>

        {error && <p className="text-sm text-[#d1477a]">{error}</p>}

        <Button full size="lg" onClick={submit} loading={pending} disabled={!canSubmit}>
          Start committing
        </Button>
      </div>
    </div>
  );
}
