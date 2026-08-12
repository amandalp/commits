import { TopBar } from "@/components/TopBar";
import { AppearanceToggle } from "@/components/AppearanceToggle";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div>
      <TopBar title="Settings" fallbackHref="/profile" />
      <div className="px-4 py-5 sm:px-5">
        <section>
          <h2 className="mb-1 text-[15px] font-bold text-ink">Appearance</h2>
          <p className="mb-3 text-[13.5px] text-muted">
            Choose how Commits looks. Handwritten is on by default.
          </p>
          <AppearanceToggle />
        </section>

        <div className="mt-8 flex items-center justify-between border-t border-border-soft pt-5">
          <div>
            <div className="text-[15px] font-semibold text-ink">Sign out</div>
            <div className="text-[13px] text-muted">End your session on this device.</div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
