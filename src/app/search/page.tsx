import SearchClient from "./SearchClient";

export const metadata = { title: "Find teachers near you · Ujuzi Link" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; near?: string; skill?: string }>;
}) {
  const { q, near, skill } = await searchParams;
  return <SearchClient initialQuery={q ?? ""} initialNear={near ?? "me"} initialSkill={skill ?? ""} />;
}
