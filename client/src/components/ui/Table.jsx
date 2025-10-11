export default function Table({ headers, rows, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b border-slate-200">
            {headers.map((header, i) => (
              <th key={i} className="py-3 pr-4 font-medium text-slate-700">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              {row.map((cell, j) => (
                <td key={j} className="py-3 pr-4">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
