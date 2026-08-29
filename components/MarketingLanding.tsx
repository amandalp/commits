import Link from "next/link";
import { ArrowRight, Heart, MessageCircle, Send } from "lucide-react";

const HAND = "var(--font-hand), cursive";
const ACCENT = "#6d5ae6";
const LIKE = "#e0245e";

/** A hand-drawn purple accent underline; width via className (e.g. w-40). */
function Underline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 26" preserveAspectRatio="none" aria-hidden className={className}>
      <path d="M4 17 C 80 9 150 23 296 13" fill="none" stroke={ACCENT} strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
}

type DemoCard = {
  name: string;
  handle: string;
  avatar: string;
  ago: string;
  text: string;
  by: string;
  tilt: string;
  z: string;
  cheers: number;
  comments: number;
  watching: number;
  watchers?: string[];
  shipped?: boolean;
};

const CARDS: DemoCard[] = [
  {
    name: "Maya Chen",
    handle: "mayachen",
    avatar: "/demo/maya.jpg",
    ago: "5h",
    text: "run my first 10K",
    by: "October 4",
    tilt: "-rotate-[4deg]",
    z: "z-10",
    cheers: 12,
    comments: 0,
    watching: 0,
  },
  {
    name: "Priya Nair",
    handle: "priyanair",
    avatar: "/demo/p1.jpg",
    ago: "2m",
    text: "launch my side project",
    by: "August 28",
    tilt: "rotate-[1deg]",
    z: "z-20",
    cheers: 24,
    comments: 2,
    watching: 3,
    watchers: ["/demo/p2.jpg", "/demo/p3.jpg", "/demo/p4.jpg"],
  },
  {
    name: "Alex Martinez",
    handle: "alexm",
    avatar: "/demo/alex.jpg",
    ago: "1d",
    text: "ship my landing page",
    by: "Friday",
    tilt: "rotate-[5deg]",
    z: "z-0",
    cheers: 7,
    comments: 0,
    watching: 0,
    shipped: true,
  },
];

function CommitCardMock({ card }: { card: DemoCard }) {
  return (
    <div
      className={`w-[300px] max-w-full shrink-0 rounded-3xl border border-border bg-surface p-5 shadow-[0_18px_44px_-18px_rgba(27,26,22,0.32)] ${card.tilt} ${card.z}`}
    >
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[14px] font-bold text-ink">{card.name}</div>
          <div className="truncate text-[12.5px] text-muted">@{card.handle}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {card.shipped && (
            <span
              style={{ fontFamily: HAND }}
              className="rounded-full border border-success/40 px-2 py-0.5 text-[12px] text-success-strong"
            >
              shipped
            </span>
          )}
          <span className="text-[12.5px] text-faint">{card.ago}</span>
        </div>
      </div>

      <p style={{ fontFamily: HAND }} className="mt-4 text-[26px] leading-[1.15] text-ink">
        I&apos;m going to {card.text}
      </p>
      <div className="mt-2 flex items-end gap-2" style={{ fontFamily: HAND }}>
        <span className="text-[22px] text-muted">by</span>
        <span className="inline-flex flex-col">
          <span className="text-[22px]" style={{ color: ACCENT }}>{card.by}</span>
          <Underline className="h-2 w-full" />
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3 text-[13px] text-muted">
        <span className="flex items-center gap-1.5 font-medium">
          <Heart className="h-[17px] w-[17px]" style={{ fill: LIKE, color: LIKE }} />
          {card.cheers}
        </span>
        {card.comments > 0 && (
          <span className="flex items-center gap-1.5 font-medium">
            <MessageCircle className="h-[17px] w-[17px]" strokeWidth={2} />
            {card.comments}
          </span>
        )}
        <Send className="h-[16px] w-[16px]" strokeWidth={2} />
        {card.watching > 0 && (
          <span className="ml-auto flex items-center gap-1.5">
            {card.watchers && (
              <span className="flex -space-x-1.5">
                {card.watchers.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover ring-2 ring-surface"
                  />
                ))}
              </span>
            )}
            {card.watching} watching
          </span>
        )}
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[15px] font-bold text-white">
        {n}
      </span>
      <div>
        <div className="text-[15px] font-bold text-ink">{title}</div>
        <div className="mt-0.5 text-[14px] text-muted">{body}</div>
      </div>
    </div>
  );
}

const PROOF = ["/demo/p1.jpg", "/demo/p2.jpg", "/demo/p3.jpg", "/demo/p4.jpg", "/demo/maya.jpg"];

export function MarketingLanding() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <span style={{ fontFamily: HAND }} className="text-[28px] font-bold text-ink">
          commits.
        </span>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="px-3 py-2 text-[15px] font-medium text-ink hover:text-accent">
            sign in
          </Link>
          <Link
            href="/start"
            style={{ fontFamily: HAND }}
            className="rounded-full bg-ink px-5 py-2.5 text-[17px] font-bold text-white transition-transform active:scale-95"
          >
            make a commit
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-2 lg:gap-8 lg:pt-16">
        <div className="max-w-xl">
          <div className="inline-flex flex-col">
            <span style={{ fontFamily: HAND }} className="text-[21px] text-ink-soft">
              social accountability, minus the shame.
            </span>
            <Underline className="mt-0.5 h-2.5 w-64" />
          </div>

          <h1 className="mt-6 font-display text-[46px] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[58px]">
            For everything you keep saying you&apos;re going to do.
          </h1>

          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted">
            Commit out loud. Let your people cheer you on, follow the outcome, and hold you to it.
          </p>

          <Link
            href="/start"
            style={{ fontFamily: HAND }}
            className="mt-8 flex w-fit items-center gap-3 rounded-2xl bg-ink px-7 py-4 text-[22px] font-bold text-white transition-transform active:scale-[0.98]"
          >
            make your first commit <ArrowRight className="h-6 w-6" />
          </Link>
        </div>

        {/* Overlapping commit cards, clipped so the fan bleeds off the right
            edge instead of spilling left over the headline. */}
        <div className="relative -mx-5 overflow-hidden px-5 sm:mx-0 sm:px-0 lg:-mr-8">
          <div className="flex -space-x-12 py-4 sm:-space-x-10">
            {CARDS.map((c) => (
              <CommitCardMock key={c.handle} card={c} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 pb-14 sm:px-8">
        <div className="rounded-3xl border border-border-soft bg-surface-muted px-6 py-9 sm:px-10">
          <div className="mx-auto w-fit text-center">
            <h2 className="text-[26px] font-extrabold tracking-tight text-ink">
              Say it. Share it. Ship it.
            </h2>
            <Underline className="mx-auto mt-1 h-2.5 w-52" />
          </div>

          <div className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
            <Step n={1} title="Commit" body="I'm going to ___ by ___." />
            <Step n={2} title="Get witnessed" body="Friends cheer, watch, or join." />
            <Step n={3} title="Close the loop" body="Share what happened." />
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-center sm:gap-5">
          <div className="flex -space-x-2.5">
            {PROOF.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                className="h-9 w-9 rounded-full object-cover ring-2 ring-cream"
              />
            ))}
          </div>
          <p style={{ fontFamily: HAND }} className="text-[21px] text-ink-soft">
            See what people are committing to…{" "}
            <span className="relative inline-block">
              and whether they actually do it.
              <Underline className="absolute -bottom-1 left-0 h-2 w-full" />
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}
