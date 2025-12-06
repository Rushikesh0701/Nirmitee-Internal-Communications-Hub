import { Outlet, Link } from 'react-router-dom'
import Logo from '../assets/Logo.png'

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/dashboard">
            <img src={Logo} alt="Nirmitee.io" className="h-16 mx-auto mb-4 cursor-pointer hover:opacity-80 transition-opacity" />
          </Link>
          <p className="text-gray-600 text-lg">Internal Communications Platform</p>
        </div>
        <div className="bg-white rounded-lg shadow-xl p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout

