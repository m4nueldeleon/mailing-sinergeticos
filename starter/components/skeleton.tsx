/** Skeletons de vidrio: se muestran al instante mientras el servidor arma los datos. */

function Block({ className = "" }: { className?: string }) {
  return <div className={`glass animate-pulse ${className}`} />;
}

export function PageSkeleton({
  kpis = 0,
  table = true,
  board = false,
}: {
  kpis?: number;
  table?: boolean;
  board?: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2 px-1">
        <div className="h-8 w-64 animate-pulse rounded-xl bg-[var(--veil)]" />
        <div className="h-4 w-96 animate-pulse rounded-lg bg-[var(--veil)]" />
      </div>
      {kpis > 0 ? (
        <div className={`grid grid-cols-2 gap-4 xl:grid-cols-${Math.min(kpis, 4)}`}>
          {Array.from({ length: kpis }).map((_, i) => (
            <Block key={i} className="h-28" />
          ))}
        </div>
      ) : null}
      {board ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Block key={i} className="h-96 w-80 shrink-0" />
          ))}
        </div>
      ) : null}
      {table ? <Block className="h-[28rem]" /> : null}
    </div>
  );
}
