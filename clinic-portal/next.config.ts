import type { NextConfig } from "next";
import { securityHeaders } from "./security-headers";

// Only the exact development value can select legacy mock infrastructure.
// Missing, QA, production, and unknown values resolve to the fail-closed graph.
const composition =
  process.env.SAXLEM_PORTAL_ENV === "development"
    ? "./src/infrastructure/composition/development.ts"
    : "./src/infrastructure/composition/production.ts";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    resolveAlias: {
      "@portal-composition": composition,
    },
  },
};

export default nextConfig;
