import "../../globals.css";
import { BackToHub } from "@/components/anomalie-003/BackToHub";

export default async function AnomalieLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Map slug → code data-anomalie pour activer la palette CSS dédiée.
  const code = slug.startsWith("003")
    ? "003"
    : slug.startsWith("001")
      ? "001"
      : "default";

  return (
    <div data-anomalie={code} className="min-h-screen relative">
      <BackToHub variant={code} />
      {children}
    </div>
  );
}
