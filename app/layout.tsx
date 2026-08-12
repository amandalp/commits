import type { Metadata, Viewport } from "next";
import { Geist, Caveat } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { ThemeStyleProvider, type ThemeStyle } from "@/components/ThemeStyle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Handwritten marker face used by the "handwritten" theme.
const caveat = Caveat({
  variable: "--font-hand",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Commits — put it on the record",
  description:
    "I'm going to [do something] by [deadline]. Commit publicly, get cheered on, and ship it.",
  openGraph: {
    title: "Commits",
    description: "Put your commitments on the record.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f3ee",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const style: ThemeStyle =
    cookieStore.get("commits_theme")?.value === "clean" ? "clean" : "handwritten";

  return (
    <html
      lang="en"
      data-style={style}
      className={`${geistSans.variable} ${caveat.variable} h-full`}
    >
      <body className="min-h-full">
        <ThemeStyleProvider initial={style}>{children}</ThemeStyleProvider>
      </body>
    </html>
  );
}
