'use client';

import { useState } from 'react';
import { Dialog } from '@msl/ui';
import { SignTile } from './SignTile';
import { SignMedia } from './SignMedia';
import type { SignItem } from './types';

const DEFAULT_GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5';

export function SignBoard({
  items,
  gridLabel,
  closeLabel,
  gridClassName = DEFAULT_GRID,
  tileSize = 'lg',
}: {
  items: SignItem[];
  gridLabel: string;
  closeLabel: string;
  gridClassName?: string;
  tileSize?: 'lg' | 'sm';
}): React.ReactElement {
  const [active, setActive] = useState<SignItem | null>(null);

  return (
    <>
      <ul aria-label={gridLabel} className={gridClassName}>
        {items.map((item) => (
          <li key={item.key}>
            <SignTile item={item} size={tileSize} onOpen={() => setActive(item)} />
          </li>
        ))}
      </ul>

      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
        title={active?.dialogLabel ?? ''}
        closeLabel={closeLabel}
        className="max-w-2xl"
      >
        {active && (
          <div className="flex flex-col items-center gap-5">
            <span
              aria-hidden
              className="grid h-20 min-w-20 place-items-center rounded-2xl bg-gradient-to-br from-tint-sage to-tint-lav px-5 font-display text-5xl font-extrabold leading-none text-fg"
            >
              {active.display}
            </span>
            <SignMedia src={active.src} label={active.dialogLabel} kind={active.kind} />
          </div>
        )}
      </Dialog>
    </>
  );
}
