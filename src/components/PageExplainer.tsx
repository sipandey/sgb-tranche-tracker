export function PageExplainer({
  title = "What is this page?",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-4 sm:p-5 mb-6 animate-rise-delay">
      <h2 className="font-display text-lg mb-2">{title}</h2>
      <div className="text-sm muted leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
