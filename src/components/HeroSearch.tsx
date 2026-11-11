"use client";
import { useState } from "react";
import Icon from "./Icon";
import { PLACES } from "@/lib/places";

/**
 * Skill search with the location picker inside the bar. "Near me" hands over to the search page,
 * which asks the browser for the user's location; a town searches from that town's centre.
 */
export default function HeroSearch() {
  const [near, setNear] = useState<string>("nairobi");

  return (
    <form action="/search" role="search" aria-label="Find a teacher">
      <div className="search-bar hero-bar">
        <span className="hero-bar-q">
          <Icon name="search" />
          <label htmlFor="hero-q" className="sr-only">
            What skill would you like to learn?
          </label>
          <input id="hero-q" name="q" placeholder="What skill would you like to learn?" autoComplete="off" />
        </span>
        <span className="hero-bar-divider" aria-hidden />
        <label className="hero-bar-place">
          <Icon name="pin" />
          <span className="sr-only">Search near</span>
          <select name="near" value={near} onChange={(e) => setNear(e.target.value)}>
            {PLACES.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}, Kenya
              </option>
            ))}
            <option value="me">Near me (use my location)</option>
          </select>
        </label>
        <button className="btn amber" type="submit">
          Search <Icon name="arrow" />
        </button>
      </div>
    </form>
  );
}
