import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Nav from "@/components/Nav";

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
      <body>
        <Providers config={{ mapsKey: process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "" }}>
          <Nav />
          <main>
            <div className="container">{children}</div>
          </main>
          <footer>
            <div className="container">
              Ujuzi Link: removing the financial and physical barriers to learning. Learners pay teachers directly
              after meeting and agreeing.
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
