import Link from "next/link";
import { PRICE_KES, TRIAL_DAYS } from "@/lib/subscription";

export default function Home() {
  return (
    <div className="stack" style={{ gap: 40 }}>
      <section className="hero">
        <h1>Learn a skill from someone near you</h1>
        <p className="muted">
          Ujuzi Link connects you with verified, skilled people in your area: tailors, mechanics, hairdressers,
          bakers, coders, musicians and more. Searching is always free.
        </p>
        <form action="/search" className="search-bar">
          <input name="q" placeholder="What do you want to learn? e.g. tailoring" aria-label="Skill" />
          <button className="btn" type="submit">
            Find teachers near me
          </button>
        </form>
      </section>

      <section>
        <h2>How it works</h2>
        <div className="steps">
          <div className="card">
            <strong>Search for a skill</strong>
            <p className="muted small">We use your location to show the closest verified teachers on a map.</p>
          </div>
          <div className="card">
            <strong>Contact the teacher</strong>
            <p className="muted small">Create a free account to see their phone and WhatsApp, then arrange to meet.</p>
          </div>
          <div className="card">
            <strong>Meet, agree and learn</strong>
            <p className="muted small">You pay the teacher directly once you have met and agreed. No middleman fees.</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Have a skill to share?</h2>
        <p className="muted">
          Get featured to learners near you. Your first {TRIAL_DAYS} days are free, then KES {PRICE_KES} a month via
          M-Pesa. To keep learners safe, every teacher is verified with a valid ID, a pinned location, a profile photo
          and photos of their place of trade.
        </p>
        <div className="row">
          <Link href="/register?role=TEACHER" className="btn">
            Become a teacher
          </Link>
          <Link href="/register" className="btn secondary">
            Join as a learner
          </Link>
        </div>
      </section>
    </div>
  );
}
