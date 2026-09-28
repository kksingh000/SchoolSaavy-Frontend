import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';

/**
 * One categorical ramp for the whole app, ordered so neighbouring series stay
 * distinguishable in greyscale as well as in colour.
 */
export const SERIES = [
  '#0A0F2C', // navy
  '#C9A84C', // gold
  '#2A5DB0', // info blue
  '#17875A', // success green
  '#B57D12', // amber
  '#7482B4', // navy 300
  '#C03A3A', // danger
  '#5D6478', // ink
];

const axisProps = {
  stroke: '#B6BDCD',
  tick: { fill: '#5D6478', fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: '#DFE3EC' },
} as const;

function TooltipBox({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string | number;
  currency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--radius-field)] bg-white px-3 py-2 shadow-[var(--shadow-pop)] hairline">
      {label !== undefined && (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          {label}
        </p>
      )}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-[13px] text-ink-700">
          <span className="size-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-ink-500">{entry.name}</span>
          <span className="ml-auto font-semibold tnum">
            {currency ? formatCurrency(entry.value as number) : formatNumber(entry.value as number)}
          </span>
        </p>
      ))}
    </div>
  );
}

export function AttendanceTrend({
  data,
}: {
  data: { date: string; present: number; absent: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="presentFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A0F2C" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#0A0F2C" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="absentFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C03A3A" stopOpacity={0.16} />
            <stop offset="100%" stopColor="#C03A3A" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#EEF1F6" vertical={false} />
        <XAxis dataKey="date" {...axisProps} />
        <YAxis {...axisProps} width={44} />
        <Tooltip content={<TooltipBox />} />
        <Area
          type="monotone"
          dataKey="present"
          name="Present"
          stroke="#0A0F2C"
          strokeWidth={2}
          fill="url(#presentFill)"
        />
        <Area
          type="monotone"
          dataKey="absent"
          name="Absent"
          stroke="#C03A3A"
          strokeWidth={2}
          fill="url(#absentFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function FeeCollectionChart({
  data,
}: {
  data: { month: string; collected: number; pending: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }} barGap={4}>
        <CartesianGrid stroke="#EEF1F6" vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis
          {...axisProps}
          width={58}
          tickFormatter={(v) => formatCurrency(v as number, true)}
        />
        <Tooltip content={<TooltipBox currency />} cursor={{ fill: '#EEF1F6' }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: '#5D6478', paddingTop: 8 }}
        />
        <Bar dataKey="collected" name="Collected" fill="#0A0F2C" radius={[4, 4, 0, 0]} />
        <Bar dataKey="pending" name="Pending" fill="#C9A84C" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DistributionChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={200} className="max-w-[200px]">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={54}
            outerRadius={84}
            paddingAngle={2}
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={SERIES[i % SERIES.length]} />
            ))}
          </Pie>
          <Tooltip content={<TooltipBox />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="w-full space-y-1.5">
        {data.slice(0, 8).map((entry, i) => (
          <li key={entry.name} className="flex items-center gap-2 text-[13px]">
            <span
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ background: SERIES[i % SERIES.length] }}
            />
            <span className="truncate text-ink-600">{entry.name}</span>
            <span className="ml-auto shrink-0 font-medium text-ink-900 tnum">
              {formatNumber(entry.value)}
            </span>
            <span className="w-10 shrink-0 text-right text-ink-400 tnum">
              {total ? `${Math.round((entry.value / total) * 100)}%` : '0%'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SimpleBar({
  data,
  color = '#0A0F2C',
  valueLabel = 'Value',
}: {
  data: { name: string; value: number }[];
  color?: string;
  valueLabel?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="#EEF1F6" vertical={false} />
        <XAxis dataKey="name" {...axisProps} interval={0} angle={data.length > 6 ? -25 : 0} dy={data.length > 6 ? 8 : 0} height={data.length > 6 ? 52 : 30} />
        <YAxis {...axisProps} width={44} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: '#EEF1F6' }} />
        <Bar dataKey="value" name={valueLabel} fill={color} radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
