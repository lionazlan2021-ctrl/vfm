import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VFM.com — Value For Money | AI Shopping Price Comparison",
  description:
    "VFM.com uses real-time AI search to find the best prices for any product across Amazon, Best Buy, Walmart, and more. Compare sellers, check value-for-money scores, and shop smarter.",
  keywords: ["price comparison", "AI shopping assistant", "value for money", "best price finder", "product comparison"],
  openGraph: {
    title: "VFM.com — Value For Money",
    description: "AI-powered real-time price comparison across trusted online sellers.",
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
