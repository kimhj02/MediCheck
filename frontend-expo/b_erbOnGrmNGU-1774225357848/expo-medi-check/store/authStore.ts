import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  setAuth: (user: AuthUser, token: string) => Promise<void>
  logout: () => Promise<void>
  loadAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: async (user, token) => {
    await SecureStore.setItemAsync('token', token)
    await SecureStore.setItemAsync('user', JSON.stringify(user))
    set({ user, token })
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token')
    await SecureStore.deleteItemAsync('user')
    set({ user: null, token: null })
  },

  loadAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('token')
      const userJson = await SecureStore.getItemAsync('user')
      if (token && userJson) {
        const user = JSON.parse(userJson) as AuthUser
        set({ user, token, isLoading: false })
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },
}))
