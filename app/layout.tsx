import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VFM — is it actually worth the money?",
  description:
    "Compare the same product across three real sellers, weighed on condition, seller trust, shipping, warranty and delivery — not just price. VFM tells you which listing deserves your money, and why.",
  keywords: [
    "price comparison",
    "value for money",
    "product comparison",
    "best price finder",
    "AI shopping assistant",
  ],
  openGraph: {
    title: "VFM — is it actually worth the money?",
    description:
      "The cheapest price is rarely the best value. VFM compares three sellers on condition, trust, shipping and warranty, then says which one to buy.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
