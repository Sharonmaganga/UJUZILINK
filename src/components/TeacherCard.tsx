import Link from "next/link";
import Icon from "./Icon";
import { iconForSkill } from "@/lib/skills";

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

export const teacherTitle = (t: { businessName: string | null; skill: string; name: string }) =>
  t.businessName || `Learn ${t.skill.toLowerCase()} with ${t.name.split(" ")[0]}`;

/** Image-first card for verified teachers (home page discovery preview). */
export default function TeacherCard({ t }: { t: TeacherCardData }) {
  return (
    <Link href={`/teachers/${t.id}`} className="tcard">
      <div className="tcard-cover">
        {t.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.coverUrl} alt="" loading="lazy" />
        ) : (
          <div className="cover-empty">
            <Icon name={iconForSkill(t.skill)} />
          </div>
        )}
        {t.distanceKm !== undefined && (
          <span className="badge">
            <Icon name="pin" /> {t.distanceKm} km
          </span>
        )}
      </div>
      <div className="tcard-body">
        <div className="tcard-skill">{t.skill}</div>
        <div className="tcard-title">{teacherTitle(t)}</div>
        <div className="tcard-who">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.profilePhotoUrl} alt="" className="avatar xs" loading="lazy" />
          <span>{t.name}</span>
          <span className="verified-badge" title="ID verified">
            <Icon name="shield" label="Verified" />
          </span>
        </div>
        <div className="tcard-where">
          <Icon name="pin" />
          <span>{t.address}</span>
        </div>
      </div>
    </Link>
  );
}
