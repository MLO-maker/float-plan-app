// React hook exposing the currently signed-in skipper (or null).

import { useEffect, useState } from 'react'
import { getCurrentUser, subscribe } from '../lib/auth.js'

export function useAuth() {
  const [user, setUser] = useState(() => getCurrentUser())
  useEffect(() => subscribe(() => setUser(getCurrentUser())), [])
  return user
}
