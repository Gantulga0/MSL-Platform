'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ChevronRight } from 'lucide-react';
import { cn } from '@msl/ui';
import { useT } from '@/i18n/client';
import type { TopicNode } from '@/lib/dictionary/types';

/**
 * Render-time numbering derived from a node's position in the tree:
 * top-level nodes read "1.", "2."… and descendants "1.1", "1.2.3"… The numbers
 * are never stored — they fall straight out of the path passed down the tree.
 */
function numbering(path: number[]): string {
  const joined = path.join('.');
  return path.length === 1 ? `${joined}.` : joined;
}

/**
 * Accessible, collapsible topic tree for dictionary browse (S-06). A real
 * nested <ul>/<li> structure; parents are disclosure buttons (keyboard-operable,
 * aria-expanded) and every node is a link that filters the dictionary by topic.
 * The live approved-word count (subtree total) is shown in parentheses.
 */
export function TopicTree({
  topics,
  activeId,
}: {
  topics: TopicNode[];
  /** Currently-filtered topic id — highlighted with aria-current. */
  activeId?: string;
}): React.ReactElement {
  const t = useT();
  return (
    <ul aria-label={t('dict.topicTreeLabel')} className="space-y-0.5">
      {topics.map((node, i) => (
        <TopicItem key={node.id} node={node} path={[i + 1]} activeId={activeId} />
      ))}
    </ul>
  );
}

function TopicItem({
  node,
  path,
  activeId,
}: {
  node: TopicNode;
  path: number[];
  activeId?: string;
}): React.ReactElement {
  const t = useT();
  // Top-level groups start open so the counts are visible at a glance; deeper
  // levels start collapsed to keep the tree compact.
  const [open, setOpen] = useState(path.length === 1);
  const hasChildren = node.children.length > 0;
  const panelId = `topic-children-${node.id}`;
  const active = node.id === activeId;

  return (
    <li>
      <div className="flex items-center gap-1">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={t(open ? 'dict.collapseTopic' : 'dict.expandTopic', {
              name: node.name,
            })}
            className="flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-full text-fg-muted hover:bg-surface-muted"
          >
            <ChevronRight
              aria-hidden
              className={cn(
                'h-5 w-5 transition-transform motion-reduce:transition-none',
                open && 'rotate-90',
              )}
            />
          </button>
        ) : (
          // Spacer keeps a childless node's label aligned with its siblings'.
          <span className="inline-block min-w-touch shrink-0" aria-hidden />
        )}

        <Link
          href={`/dictionary?topic=${node.id}` as Route}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex min-h-touch flex-1 items-center gap-2 rounded-full px-3 text-fg transition-colors',
            active ? 'bg-tint-sage font-semibold' : 'hover:bg-surface-muted',
          )}
        >
          <span className="tabular-nums text-fg-subtle">{numbering(path)}</span>
          <span className={cn('flex-1', !active && 'font-medium')}>{node.name}</span>
          <span className="font-semibold text-accent-ink">({node.wordCount})</span>
        </Link>
      </div>

      {hasChildren && (
        <ul id={panelId} hidden={!open} className="ml-5 space-y-0.5 border-l border-border pl-1">
          {node.children.map((child, j) => (
            <TopicItem key={child.id} node={child} path={[...path, j + 1]} activeId={activeId} />
          ))}
        </ul>
      )}
    </li>
  );
}
