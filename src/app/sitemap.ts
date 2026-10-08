import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/zoo", "/agents", "/enclosures", "/operators", "/trace", "/artifacts", "/tasks", "/protocol", "/nodes", ...["raven-1", "beaver-1", "owl-1", "meerkat-1"].map((id) => `/agents/${id}`)].map((path) => ({ url: `${siteUrl}${path}`, changeFrequency: "weekly", priority: path ? 0.7 : 1 }));
}
