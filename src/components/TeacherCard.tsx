import Link from "next/link";

export type TeacherCardData = {
  id: string;
  name: string;
  skill: string;
  businessName: string | null;
  address: string;
  profilePhotoUrl: string;
  coverUrl: string | null;
  distanceKm?: number;
};

/** Image-first card used on the home page and in search results. */
export default function TeacherCard({ t, highlighted }: { t: TeacherCardData; highlighted?: boolean }) {
  return (
    <Link href={`/teachers/${t.id}`} className={`tcard${highlighted ? " is-highlighted" : ""}`}>
      <div className="tcard-cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {t.coverUrl ? <img src={t.coverUrl} alt="" loading="lazy" /> : <div className="tcard-cover-empty">{t.skill}</div>}
        {t.distanceKm !== undefined && <span className="tcard-distance">{t.distanceKm} km away</span>}
      </div>
      <div className="tcard-body">
        <div className="tcard-skill">{t.skill}</div>
        <div className="tcard-title">{t.businessName || `Learn ${t.skill.toLowerCase()} with ${t.name.split(" ")[0]}`}</div>
        <div className="tcard-teacher">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.profilePhotoUrl} alt="" className="avatar xs" loading="lazy" />
          <span>{t.name}</span>
          <span className="verified" title="ID verified">✓</span>
        </div>
        <div className="tcard-meta">📍 {t.address}</div>
      </div>
    </Link>
  );
}
