import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface DashboardBarProps {
  data: Array<{ label: string; value: number; secondary?: number }>;
  title: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
  secondaryLabel?: string;
}

const renderTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-xs text-[var(--text-primary)] shadow">
      {payload.map((item: any) => (
        <div key={item.dataKey} className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="font-semibold">{item.name}:</span>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
};

export const DashboardBar: React.FC<DashboardBarProps> = ({
  data,
  title,
  description,
  primaryColor = '#2B6CB0',
  secondaryColor = '#48BB78',
  secondaryLabel = 'Metas',
}) => {
  return (
    <div className="dashboard-card" role="group" aria-label={title}>
      <header className="mb-3 space-y-1">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {description && <p className="text-xs text-[var(--text-secondary)]">{description}</p>}
      </header>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip content={renderTooltip} />
            <Bar dataKey="value" name="Concluídas" radius={[6, 6, 0, 0]} fill={primaryColor} />
            {data.some(item => typeof item.secondary === 'number') && (
              <Bar dataKey="secondary" name={secondaryLabel} radius={[6, 6, 0, 0]} fill={secondaryColor} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
