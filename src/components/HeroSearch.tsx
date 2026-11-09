"use client";
import { useRef, useState } from "react";
import Icon from "./Icon";
import { PLACES } from "@/lib/places";

/** Skill search with a town selector. "Use my location" hands over to the search page, which asks the browser. */
export default function HeroSearch() {
  const form = useRef<HTMLFormElement>(null);
  const [near, setNear] = useState("me");

  function locateMe() {
    setNear("me");
    // Let state flush to the hidden select before submitting.
    requestAnimationFrame(() => form.current?.requestSubmit());
  }

  return (
    <form ref={form} action="/search" role="search" aria-label="Find a teacher">
      <div className="search-bar">
        <Icon name="search" />
        <label htmlFor="hero-q" className="sr-only">
          What skill would you like to learn?
        </label>
        <input id="hero-q" name="q" placeholder="What skill would you like to learn?" autoComplete="off" />
        <button className="btn" type="submit" aria-label="Search">
          <span className="btn-label">Search</span> <Icon name="arrow" />
        </button>
      </div>
      <div className="hero-meta">
        <button type="button" className="ghost-link" onClick={locateMe}>
          <Icon name="locate" /> Use my location
        </button>
        <span className="hero-dot" aria-hidden />
        <label className="place-select">
          <Icon name="map" />
          <span className="sr-only">Search near</span>
          <select name="near" value={near} onChange={(e) => setNear(e.target.value)}>
            <option value="me">Near me</option>
            {PLACES.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}, Kenya
              </option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}
