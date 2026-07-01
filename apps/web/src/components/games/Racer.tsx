'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Timer, Users } from 'lucide-react';
import { useT } from '@/i18n/client';
import { RaceSolo } from './RaceSolo';
import { RaceMultiplayer } from './RaceMultiplayer';

type Mode = 'solo' | 'multi';

export function Racer(): React.ReactElement {
  const params = useSearchParams();

  const [mode, setMode] = useState<Mode | null>(
    params.get('room') ? 'multi' : null,
  );

  return (
    <RaceShell mode={mode} onPick={setMode}>
      {mode === 'solo' && <RaceSolo onExit={() => setMode(null)} />}
      {mode === 'multi' && <RaceMultiplayer onExit={() => setMode(null)} />}

      {mode === null && <EmptyRaceState onPick={setMode} />}
    </RaceShell>
  );
}

function RaceShell({
  mode,
  onPick,
  children,
}: {
  mode: Mode | null;
  onPick: (mode: Mode) => void;
  children: React.ReactNode;
}): React.ReactElement {
  const t = useT();

  const modes = [
    {
      key: 'solo' as const,
      icon: Timer,
      title: t('game.race.soloTitle'),
    },
    {
      key: 'multi' as const,
      icon: Users,
      title: t('game.race.multiTitle'),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border bg-surface p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-fg">
                {t('game.race.title')}
              </h2>
              <p className="mt-1 text-sm text-fg-muted">
                {t('game.race.chooseMode')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-bg p-1">
              {modes.map(({ key, icon: Icon, title }) => {
                const active = mode === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onPick(key)}
                    className={[
                      'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      active
                        ? 'bg-accent-subtle text-accent-ink shadow-sm'
                        : 'text-fg-muted hover:bg-accent-subtle/60 hover:text-fg',
                    ].join(' ')}
                    aria-pressed={active}
                  >
                    <Icon aria-hidden className="h-4 w-4" />
                    {title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

function EmptyRaceState({
  onPick,
}: {
  onPick: (mode: Mode) => void;
}): React.ReactElement {
  const t = useT();

  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-border bg-bg p-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-subtle text-accent-ink">
          <Timer aria-hidden className="h-7 w-7" />
        </div>

        <h3 className="font-display text-lg font-bold text-fg">
          {t('game.race.chooseMode')}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          Solo mode дээр ганцаараа time attack хийж болно. Multiplayer mode дээр room үүсгээд найзтайгаа уралдана.
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => onPick('solo')}
            className="rounded-xl bg-accent-subtle px-4 py-2 text-sm font-semibold text-accent-ink transition hover:opacity-90"
          >
            {t('game.race.soloTitle')}
          </button>

          <button
            type="button"
            onClick={() => onPick('multi')}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-fg transition hover:bg-accent-subtle/60"
          >
            {t('game.race.multiTitle')}
          </button>
        </div>
      </div>
    </div>
  );
}