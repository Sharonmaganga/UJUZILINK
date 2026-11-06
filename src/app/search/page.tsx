import SearchClient from "./SearchClient";

export const metadata = { title: "Find a teacher · Ujuzi Link" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <SearchClient initialQuery={q ?? ""} />;
}
