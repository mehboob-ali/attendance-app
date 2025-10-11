export default function Badge({ color = 'slate', children }) {
  const colorMap = {
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    red: 'bg-rose-50 text-rose-700 border border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200'
  };
  
  return (
    <span className={`badge ${colorMap[color] || colorMap.slate}`}>
      {children}
    </span>
  );
}
