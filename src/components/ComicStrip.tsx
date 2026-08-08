import { COMIC_PANELS } from "@/lib/plain-language";

export function ComicStrip() {
  return (
    <section className="comic-strip mb-6 animate-rise-delay" aria-label="How this works">
      {COMIC_PANELS.map((p) => (
        <article key={p.n} className="comic-panel panel">
          <div className="comic-num" aria-hidden>
            {p.n}
          </div>
          <h3 className="font-display text-base mb-1.5 leading-snug">{p.title}</h3>
          <p className="text-xs muted leading-relaxed">{p.body}</p>
        </article>
      ))}
    </section>
  );
}
