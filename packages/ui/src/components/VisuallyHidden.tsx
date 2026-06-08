import type { ReactNode } from 'react';

/** Content available to assistive tech but visually hidden (a11y labels). */
export function VisuallyHidden({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <span
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
      }}
    >
      {children}
    </span>
  );
}
