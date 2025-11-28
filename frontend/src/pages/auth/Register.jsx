import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'

const Register = () => {
  const navigate = useNavigate()
  const { register: registerUser, login } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)
    
    // Combine firstName and lastName into name
    const name = `${data.firstName} ${data.lastName}`.trim()
    
    const result = await registerUser({
      email: data.email,
      password: data.password,
      name
    })
    
    setLoading(false)

    if (result.success) {
      toast.success('Registration successful! Please login.')
      // Auto-login after registration
      const loginResult = await login(data.email, data.password)
      if (loginResult.success) {
        navigate('/dashboard')
      } else {
        navigate('/login')
      }
    } else {
      toast.error(result.error || 'Registration failed')
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create Account
        </h2>
        <p className="text-gray-600">Join Nirmitee Internal Hub</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              {...register('firstName', { required: 'First name is required' })}
              className="input"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              {...register('lastName', { required: 'Last name is required' })}
              className="input"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@nirmitee\.io$/i,
                message: 'Only @nirmitee.io email addresses are allowed'
              }
            })}
            className="input"
            placeholder="xyz@nirmitee.io"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Only Nirmitee employees with @nirmitee.io email can register
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
              }
            })}
            className="input"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === password || 'Passwords do not match'
            })}
            className="input"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department (Optional)
          </label>
          <input type="text" {...register('department')} className="input" />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary flex items-center justify-center gap-2"
        >
          <UserPlus size={18} />
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register

