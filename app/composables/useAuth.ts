import type { User, AuthError, AuthResponse } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'user' | 'admin' | 'moderator'
  workspaces: string[]
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    notifications: boolean
  }
  subscription: {
    plan: 'free' | 'pro' | 'enterprise'
    expiresAt?: string
  }
  createdAt: string
  lastSeenAt: string
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
}

export const useAuth = () => {
  const nuxtApp = useNuxtApp()
  const router = useRouter()

  const state = reactive<AuthState>({
    user: null,
    loading: true,
    initialized: false
  })

  // Check if Supabase is properly configured
  const isSupabaseConfigured = () => {
    return nuxtApp.nuxtApp.$supabase && 
           nuxtApp.nuxtApp.$supabase.auth &&
           process.client // Only run on client side
  }

  // Initialize auth state
  const initialize = async () => {
    try {
      state.loading = true

      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured - auth features disabled')
        state.loading = false
        state.initialized = true
        return
      }

      // Get initial session
      const { data: { session }, error } = await nuxtApp.nuxtApp.$supabase.auth.getSession()

      if (error) {
        console.error('Auth initialization error:', error)
      } else if (session?.user) {
        await loadUserProfile(session.user)
      }

      // Listen for auth changes
      nuxtApp.nuxtApp.$supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event)

        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          state.user = null
          await router.push('/auth/login')
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          await loadUserProfile(session.user)
        }
      })
    } catch (error) {
      console.error('Auth initialization failed:', error)
    } finally {
      state.loading = false
      state.initialized = true
    }
  }

  // Load user profile data
  const loadUserProfile = async (user: User) => {
    try {
      // In a real app, fetch additional profile data from your database
      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
        avatar: user.user_metadata?.avatar_url,
        role: 'user', // Would come from database
        workspaces: [], // Would come from database
        preferences: {
          theme: 'system',
          language: 'en',
          notifications: true
        },
        subscription: {
          plan: 'free'
        },
        createdAt: user.created_at,
        lastSeenAt: new Date().toISOString()
      }

      state.user = authUser

      // Update last seen timestamp in database
      await updateLastSeen()
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  }

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean, error?: string }> => {
    try {
      if (!isSupabaseConfigured()) {
        return { success: false, error: 'Authentication not configured' }
      }

      state.loading = true

      const { data, error } = await nuxtApp.nuxtApp.$supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        await loadUserProfile(data.user)
        await router.push('/')
      }

      return { success: true }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      state.loading = false
    }
  }

  // Sign up with email and password
  const signUpWithEmail = async (email: string, password: string, fullName?: string): Promise<{ success: boolean, error?: string }> => {
    try {
      if (!isSupabaseConfigured()) {
        return { success: false, error: 'Authentication not configured' }
      }

      state.loading = true

      const { data, error } = await nuxtApp.nuxtApp.$supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user && !data.user.email_confirmed_at) {
        return {
          success: true,
          error: 'Please check your email and click the confirmation link to complete your registration.'
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      state.loading = false
    }
  }

  // Sign in with OAuth provider
  const signInWithProvider = async (provider: 'google' | 'github' | 'discord'): Promise<{ success: boolean, error?: string }> => {
    try {
      state.loading = true

      const { data, error } = await nuxtApp.$supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('OAuth sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      state.loading = false
    }
  }

  // Sign out
  const signOut = async (): Promise<{ success: boolean, error?: string }> => {
    try {
      state.loading = true

      const { error } = await nuxtApp.$supabase.auth.signOut()

      if (error) {
        return { success: false, error: error.message }
      }

      state.user = null
      await router.push('/auth/login')

      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      state.loading = false
    }
  }

  // Reset password
  const resetPassword = async (email: string): Promise<{ success: boolean, error?: string }> => {
    try {
      const { error } = await nuxtApp.$supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Reset password error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Update password
  const updatePassword = async (newPassword: string): Promise<{ success: boolean, error?: string }> => {
    try {
      const { error } = await nuxtApp.$supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Update password error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Update user profile
  const updateProfile = async (updates: Partial<Pick<AuthUser, 'name' | 'preferences'>>): Promise<{ success: boolean, error?: string }> => {
    try {
      const { error } = await nuxtApp.$supabase.auth.updateUser({
        data: {
          full_name: updates.name
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Update local state
      if (state.user) {
        if (updates.name) state.user.name = updates.name
        if (updates.preferences) {
          state.user.preferences = { ...state.user.preferences, ...updates.preferences }
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Update last seen timestamp
  const updateLastSeen = async () => {
    if (state.user) {
      state.user.lastSeenAt = new Date().toISOString()
      // In a real app, update this in the database
    }
  }

  // Check if user has permission
  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false

    // Basic role-based permissions
    if (state.user.role === 'admin') return true
    if (state.user.role === 'moderator' && permission !== 'admin') return true

    return permission === 'user'
  }

  // Check if user can access workspace
  const canAccessWorkspace = (workspaceId: string): boolean => {
    if (!state.user) return false
    if (state.user.role === 'admin') return true

    return state.user.workspaces.includes(workspaceId)
  }

  // Initialize on composable creation
  if (!state.initialized) {
    initialize()
  }

  return {
    // State
    user: readonly(ref(state.user)),
    loading: readonly(ref(state.loading)),
    isAuthenticated: computed(() => !!state.user),
    isLoading: computed(() => state.loading),

    // Methods
    initialize,
    signInWithEmail,
    signUpWithEmail,
    signInWithProvider,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    hasPermission,
    canAccessWorkspace
  }
}
