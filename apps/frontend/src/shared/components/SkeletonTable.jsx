export default function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="min-w-full">
        <thead>
          <tr className="text-left text-xs uppercase text-slate-500">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3"> </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-t">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200"/>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
