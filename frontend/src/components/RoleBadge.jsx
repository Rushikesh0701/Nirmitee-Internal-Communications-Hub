import { Shield, UserCheck, Users } from 'lucide-react'

/**
 * RoleBadge Component
 * Displays a user's role with appropriate styling and icon
 */
export default function RoleBadge({ role, size = 'sm', showIcon = true }) {
  if (!role) return null

  const getRoleBadgeStyle = (roleName) => {
    switch (roleName) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Moderator':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Employee':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleIcon = (roleName) => {
    switch (roleName) {
      case 'Admin':
        return <Shield size={size === 'sm' ? 12 : 16} />
      case 'Moderator':
        return <UserCheck size={size === 'sm' ? 12 : 16} />
      case 'Employee':
        return <Users size={size === 'sm' ? 12 : 16} />
      default:
        return <Users size={size === 'sm' ? 12 : 16} />
    }
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${getRoleBadgeStyle(role)} ${sizeClasses[size]}`}
    >
      {showIcon && getRoleIcon(role)}
      {role}
    </span>
  )
}

