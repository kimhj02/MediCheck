import { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as WebBrowser from 'expo-web-browser'
import * as Font from 'expo-font'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'

/** useFonts는 RN에서 window 미정의 시 즉시 true를 줘 폰트 전에 UI가 뜰 수 있음 → loadAsync로 확실히 대기 */
const IONICONS_MAP = {
  ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
}

const queryClient = new QueryClient()

WebBrowser.maybeCompleteAuthSession()

export default function RootLayout() {
  const loadAuth = useAuthStore((state) => state.loadAuth)
  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    let alive = true
    Font.loadAsync(IONICONS_MAP)
      .catch(() => {})
      .finally(() => {
        if (alive) setFontsReady(true)
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    loadAuth()
  }, [loadAuth])

  if (!fontsReady) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0EA5E9' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' },
          /** 탭 그룹 라우트명 (tabs)이 뒤로가기 옆에 노출되는 것 방지 */
          headerBackTitleVisible: false,
          headerBackTitle: '',
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="hospital/[id]"
          options={{ title: '병원 상세' }}
        />
        <Stack.Screen
          name="login"
          options={{ title: '로그인', presentation: 'modal' }}
        />
        <Stack.Screen
          name="signup"
          options={{ title: '회원가입', presentation: 'modal' }}
        />
        <Stack.Screen name="my-reviews" options={{ title: '내 리뷰' }} />
        <Stack.Screen name="notification-settings" options={{ title: '알림 설정' }} />
        <Stack.Screen name="about" options={{ title: '앱 정보' }} />
        <Stack.Screen name="terms" options={{ title: '이용약관' }} />
        <Stack.Screen name="privacy" options={{ title: '개인정보처리방침' }} />
      </Stack>
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
})
