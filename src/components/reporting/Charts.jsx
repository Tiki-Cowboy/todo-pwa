import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import {
  format, subDays, eachDayOfInterval, isSameDay,
} from 'date-fns'

const FALLBACK_COLORS = ['#5b9bd5', '#9b7fd4', '#3db07a', '#e8a020', '#e05050', '#e87c4a', '#4ab8b8']
const PRIORITY_COLORS = { High: '#e05050', Medium: '#e8a020', Low: '#3db07a' }
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#1a2e32',
    border: '1px solid #2e4a50',
    borderRadius: '0.75rem',
    color: '#e8efe0',
    fontSize: '0.75rem',
  },
  cursor: { fill: 'rgba(232,160,32,0.08)' },
}

const axisProps = {
  tick: { fill: '#7a9a8a', fontSize: 11 },
  axisLine: { stroke: '#2e4a50' },
  tickLine: false,
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-40 text-text-tertiary text-sm italic">
      No data for this period
    </div>
  )
}

function ChartCard({ title, children, wide = false }) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 ${wide ? 'lg:col-span-2' : ''}`}
      style={{ border: '1px solid rgba(12,26,51,0.06)' }}
    >
      <h3 className="text-base font-semibold text-text-primary mb-4">{title}</h3>
      {children}
    </div>
  )
}

// ── 1. Tasks by Category (donut) ──────────────────────────────────────────────

function CategoryChart({ tasks, categories }) {
  const colorMap = Object.fromEntries(categories.map(c => [c.name, c.color]))
  const counts = tasks.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1
    return acc
  }, {})
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }))

  return (
    <ChartCard title="Tasks by Category">
      {data.length === 0 ? <EmptyState /> : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={colorMap[entry.name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(val, name) => [val, name]} />
          </PieChart>
        </ResponsiveContainer>
      )}
      {data.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {data.map((entry, i) => (
            <span key={entry.name} className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: colorMap[entry.name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length] }} />
              {entry.name} ({entry.value})
            </span>
          ))}
        </div>
      )}
    </ChartCard>
  )
}

// ── 2. Priority Breakdown (donut) ─────────────────────────────────────────────

function PriorityChart({ tasks }) {
  const data = ['High', 'Medium', 'Low'].map(p => ({
    name: p,
    value: tasks.filter(t => t.priority === p).length,
    fill: PRIORITY_COLORS[p],
  })).filter(d => d.value > 0)

  return (
    <ChartCard title="Priority Breakdown">
      {data.length === 0 ? <EmptyState /> : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
              {data.map(entry => <Cell key={entry.name} fill={entry.fill} />)}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      )}
      {data.length > 0 && (
        <div className="flex gap-4 mt-2 justify-center">
          {data.map(entry => (
            <span key={entry.name} className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.fill }} />
              {entry.name} ({entry.value})
            </span>
          ))}
        </div>
      )}
    </ChartCard>
  )
}

// ── 3. Completion Trend (line) ────────────────────────────────────────────────

function TrendChart({ tasks, range }) {
  const today = new Date()
  let start
  if (range === 'all') {
    const dates = tasks.map(t => t.completedAt).filter(Boolean)
    start = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : subDays(today, 30)
  } else {
    start = subDays(today, parseInt(range))
  }

  const data = eachDayOfInterval({ start, end: today }).map(date => ({
    date: format(date, 'MMM d'),
    tasks: tasks.filter(t => t.completedAt && isSameDay(t.completedAt, date)).length,
  }))

  const hasData = data.some(d => d.tasks > 0)

  return (
    <ChartCard title="Completion Trend" wide>
      {!hasData ? <EmptyState /> : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e4a50" />
            <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
            <YAxis {...axisProps} allowDecimals={false} />
            <Tooltip {...tooltipStyle} />
            <Line
              type="monotone"
              dataKey="tasks"
              stroke="#e8a020"
              strokeWidth={2}
              dot={{ fill: '#e8a020', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// ── 4. Tasks by Time of Day (bar) ─────────────────────────────────────────────

function TimeOfDayChart({ tasks }) {
  const data = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`,
    tasks: tasks.filter(t => t.completedAt?.getHours() === h).length,
  }))
  const hasData = data.some(d => d.tasks > 0)

  return (
    <ChartCard title="Tasks by Time of Day">
      {!hasData ? <EmptyState /> : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="hour" {...axisProps}
              tickFormatter={h => h.replace(':00', '')}
              interval={3}
            />
            <YAxis {...axisProps} allowDecimals={false} />
            <Tooltip {...tooltipStyle} labelFormatter={h => `${h}`} />
            <Bar dataKey="tasks" fill="#5b9bd5" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// ── 5. Tasks by Day of Week (bar) ─────────────────────────────────────────────

function DayOfWeekChart({ tasks }) {
  const data = DAY_NAMES.map((name, i) => ({
    name,
    tasks: tasks.filter(t => t.completedAt?.getDay() === i).length,
  }))
  const hasData = data.some(d => d.tasks > 0)

  return (
    <ChartCard title="Tasks by Day of Week">
      {!hasData ? <EmptyState /> : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} allowDecimals={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="tasks" fill="#9b7fd4" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// ── Exported grid ──────────────────────────────────────────────────────────────

export default function Charts({ tasks, categories, range }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <CategoryChart   tasks={tasks} categories={categories} />
      <PriorityChart   tasks={tasks} />
      <TrendChart      tasks={tasks} range={range} />
      <TimeOfDayChart  tasks={tasks} />
      <DayOfWeekChart  tasks={tasks} />
    </div>
  )
}
