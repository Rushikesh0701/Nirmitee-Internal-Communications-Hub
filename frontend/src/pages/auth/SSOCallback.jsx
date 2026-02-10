import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'

/**
 * SSO Callback page - handles the OAuth redirect from providers like Google.
 * Clerk uses this intermediate page to finalize the session before
 * redirecting to the final destination (e.g., /dashboard).
 */
const SSOCallback = () => {
  return <AuthenticateWithRedirectCallback />
}

export default SSOCallback
