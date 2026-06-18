import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo";

export const alt = "Forge — Build. Learn. Contribute.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social preview card (1200×630) shown when the landing link is shared. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          color: "#ffffff",
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #4f46e5 55%, #7c6cf5 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.82)",
          }}
        >
          Profile Building Drive · {SITE.orgShort} · {SITE.schoolShort}
        </div>
        <div style={{ display: "flex", fontSize: 132, fontWeight: 800, marginTop: 18 }}>
          Forge
        </div>
        <div style={{ display: "flex", fontSize: 52, fontWeight: 600, marginTop: 6 }}>
          Build. Learn. Contribute.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            marginTop: 30,
            maxWidth: 940,
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          Students build on real repositories, mentors review and guide, teachers track progress —
          learning made measurable.
        </div>
      </div>
    ),
    { ...size },
  );
}
