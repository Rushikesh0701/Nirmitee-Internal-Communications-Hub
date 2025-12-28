import { useTheme } from '../../contexts/ThemeContext'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const MAUChart = ({ data, type = 'area' }) => {
  const { theme } = useTheme()

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        No data available
      </div>
    )
  }

  const ChartComponent = type === 'area' ? AreaChart : LineChart
  const DataComponent = type === 'area' ? Area : Line

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ChartComponent data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#052829' : '#e2e8f0'} />
        <XAxis 
          dataKey="month" 
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
            border: theme === 'dark' ? '1px solid #052829' : '1px solid #e2e8f0'
          }} 
        />
        <Legend />
        <DataComponent 
          type="monotone" 
          dataKey="users" 
          stroke="#3b82f6" 
          fill="#3b82f6" 
          fillOpacity={type === 'area' ? 0.3 : 0}
          name="Active Users"
        />
      </ChartComponent>
    </ResponsiveContainer>
  )
}

export default MAUChart

