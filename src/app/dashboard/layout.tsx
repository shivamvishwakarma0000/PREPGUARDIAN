export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-obsidian-900)] text-white overflow-hidden flex flex-col">
      {children}
    </div>
  );
}
