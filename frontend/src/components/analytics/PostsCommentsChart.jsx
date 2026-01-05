import { useTheme } from '../../contexts/ThemeContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const PostsCommentsChart = ({ data }) => {
  const { theme } = useTheme()

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
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
        <Bar dataKey="posts" fill="#3b82f6" name="Posts" />
        <Bar dataKey="comments" fill="#10b981" name="Comments" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default PostsCommentsChart

