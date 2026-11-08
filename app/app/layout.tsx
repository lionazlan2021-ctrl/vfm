import type { Metadata } from "next";

/** The search app itself. The marketing page lives at "/". */
export const metadata: Metadata = {
  title: "Compare — VFM",
  description: "Compare a product across three real sellers and see which listing is actually worth the money.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
