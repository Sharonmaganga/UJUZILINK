"use client";
import { createContext, useContext } from "react";
import { SessionProvider } from "next-auth/react";

type PublicConfig = { mapsKey: string };
const ConfigContext = createContext<PublicConfig>({ mapsKey: "" });

/** Settings the browser needs, read from env vars when the server starts (not baked in at build time). */
export function usePublicConfig() {
  return useContext(ConfigContext);
}

export default function Providers({ children, config }: { children: React.ReactNode; config: PublicConfig }) {
  return (
    <ConfigContext.Provider value={config}>
      <SessionProvider>{children}</SessionProvider>
    </ConfigContext.Provider>
  );
}
