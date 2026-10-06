import BackButton from "@/components/ui/BackButton";

export default async function CTNewPrestationsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ role: string }>;
}) {
  return (
    <div>
      <div className="mb-4">
        <BackButton />
      </div>

      {children}
    </div>
  );
}