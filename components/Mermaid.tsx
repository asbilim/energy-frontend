"use client";

import { useEffect, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";

const Mermaid = ({ chart, id }: { chart: string; id: string }) => {
  const { theme } = useTheme();
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === "dark" ? "dark" : "default",
      securityLevel: "loose",
      fontFamily: "inherit",
    });

    let isMounted = true;
    try {
      mermaid.render(id, chart, (renderedSvg) => {
        if (isMounted) {
          setSvg(renderedSvg);
        }
      });
    } catch (e) {
      console.error(e);
    }

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
