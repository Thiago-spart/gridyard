import type { ReactNode } from 'react';

interface ResponsiveLayoutProps {
  scene: ReactNode;
  panel: ReactNode;
}

export function ResponsiveLayout({ scene, panel }: ResponsiveLayoutProps) {
  return (
    <div className="flex h-screen w-screen flex-col md:flex-row">
      <div className="min-h-0 flex-1">{scene}</div>
      <div className="max-h-[40vh] w-full overflow-y-auto bg-paper-raised p-3 md:max-h-none md:w-[280px]">
        {panel}
      </div>
    </div>
  );
}
