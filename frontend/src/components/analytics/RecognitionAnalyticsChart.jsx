import { useTheme } from '../../contexts/ThemeContext'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const RecognitionAnalyticsChart = ({ data, type = 'bar' }) => {
  const { theme } = useTheme()

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        No data available
      </div>
    )
  }

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: theme === 'dark' ? '#1e293b' : 'white', 
              border: theme === 'dark' ? '1px solid #0a0e17' : '1px solid #e2e8f0'
            }} 
          />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#0a0e17' : '#e2e8f0'} />
        <XAxis 
          dataKey="name" 
          stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} 
          tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
        />
        <YAxis 
          stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} 
          tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: theme === 'dark' ? '#1e293b' : 'white', 
            border: theme === 'dark' ? '1px solid #0a0e17' : '1px solid #e2e8f0'
          }} 
        />
        <Legend />
        <Bar dataKey="count" fill="#f59e0b" name="Recognitions" />
        <Bar dataKey="points" fill="#10b981" name="Points Awarded" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default RecognitionAnalyticsChart

