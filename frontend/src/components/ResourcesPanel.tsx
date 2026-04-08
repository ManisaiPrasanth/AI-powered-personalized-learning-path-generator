import React from 'react';

import type { ResourceLink } from '../content/machineLearning';

function LinkList({ items }: { items: ResourceLink[] }) {
  return (
    <ul className="space-y-2 text-xs">
      {items.map((l) => (
        <li key={l.url}>
          <a
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-slate-800 transition hover:text-secondary dark:text-slate-200"
          >
            <span className="text-slate-500">↗</span>
            <span className="underline decoration-slate-400 underline-offset-4 hover:decoration-secondary/60 dark:decoration-slate-700">
              {l.label}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function ResourcesPanel({
  youtube,
  datasets,
  docs
}: {
  youtube: ResourceLink[];
  datasets: ResourceLink[];
  docs: ResourceLink[];
}) {
  return (
    <section className="card-elevated space-y-4 p-4 md:p-5">
      <div>
        <p className="pill-muted mb-2 inline-block">Resources</p>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Learn faster with curated links
        </h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          YouTube links open as search results so you always get up-to-date videos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">
          <p className="mb-3 text-xs font-semibold text-slate-800 dark:text-slate-200">YouTube</p>
          <LinkList items={youtube} />
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">
          <p className="mb-3 text-xs font-semibold text-slate-800 dark:text-slate-200">Datasets</p>
          <LinkList items={datasets} />
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">
          <p className="mb-3 text-xs font-semibold text-slate-800 dark:text-slate-200">Docs</p>
          <LinkList items={docs} />
        </div>
      </div>
    </section>
  );
}
