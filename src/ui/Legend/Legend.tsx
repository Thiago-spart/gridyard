import { PIECE_DEFS } from '../../lib/pieces';

export function Legend() {
  return (
    <ul className="flex flex-col gap-1 text-sm text-ink">
      {Object.values(PIECE_DEFS).map((def) => (
        <li key={def.type} className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: def.color }} />
          {def.label}
        </li>
      ))}
    </ul>
  );
}
