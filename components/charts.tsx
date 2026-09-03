'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
const COLORS = ['hsl(221 83% 53%)', 'hsl(142 71% 45%)', 'hsl(38 92% 50%)', 'hsl(280 65% 60%)', 'hsl(340 75% 55%)'];
export function MonthlyRequestsChart({ data }: { data: { month: string; requests: number }[] }) {
  return <ResponsiveContainer width="100%" height={260}><BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215 16% 47%)" /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(215 16% 47%)" /><Tooltip contentStyle={{ background: 'white', border: '1px solid hsl(214 32% 91%)', borderRadius: 8, fontSize: 12 }} /><Bar dataKey="requests" fill="hsl(221 83% 53%)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>;
}
export function DepartmentBreakdownChart({ data }: { data: { name: string; value: number }[] }) {
  return <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Legend wrapperStyle={{ fontSize: 12 }} /><Tooltip contentStyle={{ background: 'white', border: '1px solid hsl(214 32% 91%)', borderRadius: 8, fontSize: 12 }} /></PieChart></ResponsiveContainer>;
}
export function VacationUsageChart({ data }: { data: { month: string; days: number }[] }) {
  return <ResponsiveContainer width="100%" height={260}><LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215 16% 47%)" /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(215 16% 47%)" /><Tooltip contentStyle={{ background: 'white', border: '1px solid hsl(214 32% 91%)', borderRadius: 8, fontSize: 12 }} /><Line type="monotone" dataKey="days" stroke="hsl(142 71% 45%)" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>;
}
