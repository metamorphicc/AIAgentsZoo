import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "AI Agent Zoo — one mission, four specialist animals";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "src/app/icon.png"));
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "64px", background: "#070d07", color: "#f4f5ed" }}>
      <div style={{ display: "flex", flexDirection: "column", width: 660 }}>
        <span style={{ fontSize: 22, color: "#d5fa20", letterSpacing: 3 }}>AI AGENT ZOO</span>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 74, fontWeight: 700, lineHeight: 1.05, marginTop: 30 }}><span>ONE MIND.</span><span>FOUR INSTINCTS.</span></div>
        <div style={{ fontSize: 25, marginTop: 30, color: "#b1c0a9" }}>Scout. Build. Remember. Watch.</div>
        <div style={{ fontSize: 20, marginTop: 54, color: "#d5fa20" }}>agentzoo.tech → Enter the habitat</div>
      </div>
      {/* Satori requires a native image element for the supplied brand asset. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/png;base64,${logo.toString("base64")}`} width={350} height={350} alt="" style={{ borderRadius: 175 }} />
    </div>, size,
  );
}
