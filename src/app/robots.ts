import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The signed-in areas and the gated file route hold nothing indexable and
      // would just burn crawl budget on redirects. This is a politeness hint, not
      // a control — the actual protection is in src/lib/dal.ts.
      disallow: [
        "/api/",
        "/admin",
        "/submit",
        "/submissions",
        "/notifications",
        "/login",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
