"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  {
    date: "Jan",
    visitors: 120,
  },
  {
    date: "Feb",
    visitors: 240,
  },
  {
    date: "Mar",
    visitors: 380,
  },
  {
    date: "Apr",
    visitors: 470,
  },
  {
    date: "May",
    visitors: 540,
  },
  {
    date: "Jun",
    visitors: 580,
  },
  {
    date: "Jul",
    visitors: 690,
  },
  {
    date: "Aug",
    visitors: 820,
  },
  {
    date: "Sep",
    visitors: 950,
  },
  {
    date: "Oct",
    visitors: 1100,
  },
  {
    date: "Nov",
    visitors: 1200,
  },
  {
    date: "Dec",
    visitors: 1380,
  },
]

export function VisitorsChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip />
        <Line type="monotone" dataKey="visitors" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
