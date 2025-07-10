"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  {
    date: "Jan",
    sales: 400,
  },
  {
    date: "Feb",
    sales: 300,
  },
  {
    date: "Mar",
    sales: 200,
  },
  {
    date: "Apr",
    sales: 278,
  },
  {
    date: "May",
    sales: 189,
  },
  {
    date: "Jun",
    sales: 239,
  },
  {
    date: "Jul",
    sales: 349,
  },
  {
    date: "Aug",
    sales: 430,
  },
  {
    date: "Sep",
    sales: 290,
  },
  {
    date: "Oct",
    sales: 349,
  },
  {
    date: "Nov",
    sales: 420,
  },
  {
    date: "Dec",
    sales: 500,
  },
]

export function SalesChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip />
        <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
