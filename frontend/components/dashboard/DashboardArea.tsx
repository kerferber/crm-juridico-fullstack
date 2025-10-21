import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface DashboardAreaProps {
  data: Array<{ label: string; value: number }>;
  title: string;
  description?: string;
  accent?: string;
}

const renderTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow">
      <div className="font-semibold">{item.payload.label}</div>
      <div>{item.value} concluídas</div>
    </div>
  );
};

export const DashboardArea: React.FC<DashboardAreaProps> = ({ data, title, description, accent = '#2B6CB0' }) => {
  return (
    <div className="dashboard-card" role="group" aria-label={title}>
      <header className="mb-3 space-y-1">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {description && <p className="text-xs text-[var(--text-secondary)]">{description}</p>}
      </header>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.6} />
                <stop offset="80%" stopColor={accent} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} allowDecimals={false} />
            <Tooltip content={renderTooltip} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={accent}
              strokeWidth={2}
              fill="url(#areaGradient)"
              name="Concluídas"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
