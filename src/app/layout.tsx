import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Ujuzi Link: learn skills from people near you",
  description:
    "Ujuzi Link connects people who want to learn a skill with verified, skilled teachers near them. Free for learners.",
};

// Read env vars per request so hosts that only inject them at runtime (e.g. RumptyCloud) work.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers config={{ mapsKey: process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "" }}>
          <Nav />
          <main>
            <div className="container">{children}</div>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
