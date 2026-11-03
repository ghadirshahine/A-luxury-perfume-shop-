import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { Amiri, Cormorant_Garamond, Tajawal } from "next/font/google";
import Link from "next/link";
import { SanityLive } from "@/sanity/lib/live";
import { VisualEditing } from "next-sanity/visual-editing";
import { CartButton } from "@/components/cart-button";
import { CopyrightYear } from "@/components/copyright-year";
import { DisableDraftMode } from "@/components/disable-draft-mode";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
});

const amiri = Amiri({
  variable: "--font-display",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-english-display",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "DAR AL-AUMARA — Oriental Fragrances",
    template: "%s · DAR AL-AUMARA",
  },
  description:
    "Luxury oriental perfumes, oud and bakhoor. Live catalogue managed in Sanity Studio.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Visual Editing overlay is only mounted while Draft Mode is active (i.e. an
  // editor is previewing from the Studio). Shoppers never load this code.
  const draft = await draftMode();
  const isDraft = draft.isEnabled;

  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${amiri.variable} ${cormorant.variable} dark h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-black text-zinc-50">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-black/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              دار الأُمراء
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/products" className="text-zinc-400 hover:text-amber-200">
                العطور
              </Link>
              <CartButton />
            </nav>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-white/10 py-10 text-center text-sm text-zinc-500">
          © <CopyrightYear /> دار الأُمراء
        </footer>

        {/* Real-time content updates (live catalogue). */}
        <SanityLive />
        {/* Visual Editing overlay + exit control, only when previewing. */}
        {isDraft && (
          <>
            <DisableDraftMode />
            <VisualEditing />
          </>
        )}
      </body>
    </html>
  );
}
