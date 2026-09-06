"use client";

import { useEffect, useRef } from "react";

export function HeroGrid() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const host = layer?.parentElement;
    if (!layer || !host) return;

    const glow = layer;
    const section = host;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;

    function onMove(event: PointerEvent) {
      const rect = section.getBoundingClientRect();
      glow.style.setProperty("--glow-x", `${event.clientX - rect.left}px`);
      glow.style.setProperty("--glow-y", `${event.clientY - rect.top}px`);
      glow.dataset.active = "true";
    }

    function onLeave() {
      glow.dataset.active = "false";
    }

    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={layerRef}
      className="hero-grid-wrap pointer-events-none absolute inset-0"
      data-active="false"
    >
      <div className="hero-grid absolute inset-0 opacity-70" />
      <div className="hero-grid-glow absolute inset-0" />
    </div>
  );
}
