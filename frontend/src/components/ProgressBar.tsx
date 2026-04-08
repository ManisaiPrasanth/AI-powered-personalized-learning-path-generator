import React from 'react';

interface Props {
  value: number;
}

export const ProgressBar: React.FC<Props> = ({ value }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full rounded-full bg-slate-200 h-2 overflow-hidden dark:bg-slate-800">
      <div
        className="h-2 bg-gradient-to-r from-sky-400 to-emerald-400 transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
