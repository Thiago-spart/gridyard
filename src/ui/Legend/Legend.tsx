import { PIECE_DEFS } from '../../lib/pieces';

const LEGEND_DEFS = Object.values(PIECE_DEFS).filter((def) => def.type !== 'custom');

export function Legend() {
  return (
    <ul className="flex flex-col gap-1 text-sm text-ink">
      {LEGEND_DEFS.map((def) => (
        <li key={def.type} className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: def.color }} />
          {def.label}
        </li>
      ))}
    </ul>
  );
}
