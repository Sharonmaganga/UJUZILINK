"use client";
import { useEffect } from "react";

/**
 * Marks the sticky nav with .is-scrolled once the page has moved. The homepage uses it to
 * keep the nav transparent over the hero photo and solid once it sits over page content.
 */
export default function NavScrollState() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>(".nav");
    if (!nav) return;
    const update = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return null;
}
