import React, { useEffect, useState } from 'react';

import { fetchWikiSummary, type WikiSummary } from '../api/wiki';

export function WikiSummaryCard({ topic }: { topic: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WikiSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
  }, [topic]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await fetchWikiSummary(topic);
      setData(s);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load extra reading.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 space-y-2 dark:border-slate-800/80 dark:bg-slate-950/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Extra reading (instant)
          </p>
          <p className="text-[0.7rem] text-slate-600 dark:text-slate-400">
            Pulls a short summary from Wikipedia (no API key).
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="btn-outline disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading…' : data ? 'Refresh' : 'Load'}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-300">{error}</p>}

      {data && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{data.title}</p>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{data.extract}</p>
          <a
            href={data.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-secondary hover:underline underline-offset-4"
          >
            Read more on Wikipedia ↗
          </a>
        </div>
      )}
    </section>
  );
}
