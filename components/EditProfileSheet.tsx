"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Sheet } from "./Sheet";
import { Avatar } from "./Avatar";
import { InstagramIcon, TikTokIcon, XIcon } from "./SocialIcons";
import { Button } from "./ui";
import { uploadMedia } from "@/lib/upload";
import { updateProfile } from "@/lib/actions/profile";
import type { ProfileFull } from "@/lib/types";

export function EditProfileSheet({ profile }: { profile: ProfileFull }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [website, setWebsite] = useState(profile.website ?? "");
  const [instagram, setInstagram] = useState(profile.instagram ?? "");
  const [tiktok, setTiktok] = useState(profile.tiktok ?? "");
  const [x, setX] = useState(profile.x ?? "");
  const [avatar, setAvatar] = useState(profile.avatar_url);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadMedia(file, "avatars");
    if ("url" in res) setAvatar(res.url);
    else setError(res.error);
  }

  async function save() {
    setPending(true);
    setError(null);
    const res = await updateProfile({
      name,
      bio,
      location,
      website,
      instagram,
      tiktok,
      x,
      avatar_url: avatar,
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 rounded-full border border-border bg-surface px-5 text-sm font-semibold text-ink hover:border-border-strong"
      >
        Edit profile
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Edit profile">
        <div className="space-y-4">
          <div className="flex justify-center">
            <label className="relative cursor-pointer">
              <Avatar person={{ ...profile, avatar_url: avatar }} size="xl" />
              <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white ring-2 ring-surface">
                <Pencil className="h-3.5 w-3.5" />
              </span>
              <input type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
            </label>
          </div>

          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              rows={2}
              className="input resize-none"
              placeholder="Building things."
            />
          </Field>
          <div className="flex gap-3">
            <Field label="Location">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input"
                placeholder="NYC"
              />
            </Field>
            <Field label="Website">
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="input"
                placeholder="linktr.ee/you"
              />
            </Field>
          </div>

          <div className="space-y-2.5">
            <span className="block text-[13px] font-medium text-muted">Socials</span>
            <HandleField
              icon={<InstagramIcon className="h-[18px] w-[18px]" />}
              value={instagram}
              onChange={setInstagram}
              placeholder="instagram"
            />
            <HandleField
              icon={<TikTokIcon className="h-[18px] w-[18px]" />}
              value={tiktok}
              onChange={setTiktok}
              placeholder="tiktok"
            />
            <HandleField
              icon={<XIcon className="h-4 w-4" />}
              value={x}
              onChange={setX}
              placeholder="x"
            />
          </div>

          {error && <p className="text-sm text-[#d1477a]">{error}</p>}
          <Button full size="lg" onClick={save} loading={pending}>
            Save
          </Button>
        </div>

        <style>{`.input{width:100%;border-radius:16px;border:1px solid var(--border);background:var(--surface);padding:12px 14px;font-size:15px;color:var(--ink);outline:none}.input:focus{border-color:var(--accent)}`}</style>
      </Sheet>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block flex-1">
      <span className="mb-1.5 block text-[13px] font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function HandleField({
  icon,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-3.5 focus-within:border-accent">
      <span className="shrink-0 text-muted">{icon}</span>
      <span className="text-[15px] text-muted">@</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent py-3 text-[15px] text-ink outline-none placeholder:text-muted/60"
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
    </label>
  );
}
