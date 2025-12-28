import { useTheme } from '../../contexts/ThemeContext'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const BlogAnalyticsChart = ({ data, type = 'line' }) => {
  const { theme } = useTheme()

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        No data available
      </div>
    )
  }

  const ChartComponent = type === 'bar' ? BarChart : LineChart
  const DataComponent = type === 'bar' ? Bar : Line

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ChartComponent data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#0a0e17' : '#e2e8f0'} />
        <XAxis 
          dataKey="date" 
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
        <DataComponent 
          type="monotone" 
          dataKey="views" 
          stroke="#3b82f6" 
          fill="#3b82f6" 
          fillOpacity={type === 'bar' ? 0.7 : 0}
          name="Views"
        />
        <DataComponent 
          type="monotone" 
          dataKey="likes" 
          stroke="#10b981" 
          fill="#10b981" 
          fillOpacity={type === 'bar' ? 0.7 : 0}
          name="Likes"
        />
        <DataComponent 
          type="monotone" 
          dataKey="comments" 
          stroke="#8b5cf6" 
          fill="#8b5cf6" 
          fillOpacity={type === 'bar' ? 0.7 : 0}
          name="Comments"
        />
      </ChartComponent>
    </ResponsiveContainer>
  )
}

export default BlogAnalyticsChart

