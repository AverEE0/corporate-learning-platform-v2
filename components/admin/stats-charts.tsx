"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface StatsChartsProps {
  stats: {
    totalUsers: number
    totalCourses: number
    totalStudents: number
    totalManagers: number
  }
  coursesByStatus?: { status: string; count: number }[]
  usersByRole?: { role: string; count: number }[]
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']

export function StatsCharts({ stats, coursesByStatus, usersByRole }: StatsChartsProps) {
  const usersData = usersByRole || [
    { role: 'Студенты', count: stats.totalStudents },
    { role: 'Менеджеры', count: stats.totalManagers },
    { role: 'Админы', count: stats.totalUsers - stats.totalStudents - stats.totalManagers },
  ]

  const coursesData = coursesByStatus || [
    { status: 'Опубликовано', count: stats.totalCourses },
    { status: 'Черновики', count: 0 },
  ]

  const monthlyData = [
    { month: 'Янв', users: 12, courses: 3 },
    { month: 'Фев', users: 19, courses: 5 },
    { month: 'Мар', users: 28, courses: 7 },
    { month: 'Апр', users: 35, courses: 9 },
    { month: 'Май', users: 42, courses: 11 },
    { month: 'Июн', users: 48, courses: 13 },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Users by Role Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Распределение пользователей</CardTitle>
          <CardDescription>По ролям</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={usersData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ role, percent }) => `${role}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {usersData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Courses by Status Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Курсы по статусам</CardTitle>
          <CardDescription>Распределение курсов</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={coursesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Growth Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Динамика роста</CardTitle>
          <CardDescription>Пользователи и курсы по месяцам</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" name="Пользователи" />
              <Line type="monotone" dataKey="courses" stroke="#10b981" name="Курсы" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

