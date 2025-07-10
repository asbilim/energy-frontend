"use client";

import { useEffect, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";

const Mermaid = ({ chart, id }: { chart: string; id: string }) => {
  const { theme } = useTheme();
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return; // Skip on server

    let isMounted = true;

    // Log the chart content and theme for debugging
    console.debug("[Mermaid] Rendering diagram", { id, chart, theme });

    // Initialize mermaid (safe to call multiple times)
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === "dark" ? "dark" : "default",
      securityLevel: "loose",
      fontFamily: "inherit",
    });

    (async () => {
      try {
        // mermaid.render returns a Promise in v10+
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        if (isMounted) {
          console.debug("[Mermaid] Render success", { id });
          setSvg(renderedSvg);
        }
      } catch (error) {
        console.error("[Mermaid] Render error", error);
        if (isMounted) {
          setSvg(
            '<div class="text-red-500">Erreur de rendu du diagramme</div>'
          );
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [chart, theme, id]);

  if (!svg) {
    return (
      <div className="flex items-center justify-center p-4 min-h-[200px]">
        <p>Chargement du diagramme...</p>
      </div>
    );
  }

  return (
    <div
      className="mermaid-container"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default Mermaid;
