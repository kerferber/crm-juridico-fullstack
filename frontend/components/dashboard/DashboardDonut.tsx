import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

interface DashboardDonutProps {
  data: Array<{ name: string; value: number; color: string }>;
  title: string;
  description?: string;
}

const renderTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-xs text-[var(--text-primary)] shadow">
      <div className="font-semibold">{item.name}</div>
      <div>{item.value}</div>
    </div>
  );
};

export const DashboardDonut: React.FC<DashboardDonutProps> = ({ data, title, description }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="dashboard-card" role="group" aria-label={title}>
      <header className="mb-3 space-y-1">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {description && <p className="text-xs text-[var(--text-secondary)]">{description}</p>}
      </header>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="h-48 flex-1 min-w-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map(entry => (
                  <Cell key={entry.name} fill={entry.color} aria-label={`${entry.name}: ${entry.value}`} />
                ))}
              </Pie>
              <Tooltip content={renderTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 text-xs text-[var(--text-secondary)]" aria-hidden="true">
          {data.map(entry => (
            <div key={entry.name} className="flex items-center gap-3">
              <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="flex-1 font-medium text-[var(--text-primary)]">{entry.name}</span>
              <span>{entry.value}</span>
            </div>
          ))}
          <div className="mt-3 text-sm font-semibold text-[var(--text-primary)]">Total: {total}</div>
        </div>
      </div>
    </div>
  );
};
