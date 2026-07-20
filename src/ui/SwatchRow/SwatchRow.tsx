interface Swatch {
  label: string;
  color: string;
}

interface SwatchRowProps {
  swatches: Swatch[];
  value: string;
  onChange: (color: string) => void;
}

export function SwatchRow({ swatches, value, onChange }: SwatchRowProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {swatches.map((swatch) => (
        <button
          key={swatch.color}
          type="button"
          aria-label={swatch.label}
          onClick={() => onChange(swatch.color)}
          className={`h-6 w-6 cursor-pointer rounded-full border-2 ${value === swatch.color ? 'border-accent' : 'border-transparent'}`}
          style={{ backgroundColor: swatch.color }}
        />
      ))}
    </div>
  );
}
