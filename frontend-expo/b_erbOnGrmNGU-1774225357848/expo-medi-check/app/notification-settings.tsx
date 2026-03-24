import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native'
import * as SecureStore from 'expo-secure-store'

const STORAGE_KEY = 'medicheck_notification_prefs'

type Prefs = {
  /** 주변 병원·앱 안내성 알림 (로컬 저장만, 실제 푸시는 추후 연동) */
  nearbyTips: boolean
  /** 이벤트·혜택 알림 */
  promotion: boolean
}

const DEFAULT_PREFS: Prefs = { nearbyTips: true, promotion: false }

export default function NotificationSettingsScreen() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY)
        if (alive && raw) {
          const parsed = JSON.parse(raw) as Partial<Prefs>
          setPrefs({
            nearbyTips: parsed.nearbyTips ?? DEFAULT_PREFS.nearbyTips,
            promotion: parsed.promotion ?? DEFAULT_PREFS.promotion,
          })
        }
      } catch {
        /* ignore */
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const persist = useCallback(async (next: Prefs) => {
    setPrefs(next)
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#0EA5E9" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.lead}>
        알림 설정은 기기에 저장됩니다.{'\n'}
        실제 푸시 알림은 이후 버전에서 연동할 수 있습니다.
      </Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.title}>주변·이용 안내</Text>
            <Text style={styles.sub}>반경 검색, 앱 업데이트 안내 등</Text>
          </View>
          <Switch
            value={prefs.nearbyTips}
            onValueChange={(v) => persist({ ...prefs, nearbyTips: v })}
            trackColor={{ false: '#CBD5E1', true: '#7DD3FC' }}
            thumbColor={prefs.nearbyTips ? '#0EA5E9' : '#F4F4F5'}
            {...(Platform.OS === 'ios' ? { ios_backgroundColor: '#CBD5E1' } : {})}
          />
        </View>

        <View style={[styles.row, styles.rowBorder]}>
          <View style={styles.rowText}>
            <Text style={styles.title}>이벤트·혜택</Text>
            <Text style={styles.sub}>프로모션 및 설문 안내 (선택)</Text>
          </View>
          <Switch
            value={prefs.promotion}
            onValueChange={(v) => persist({ ...prefs, promotion: v })}
            trackColor={{ false: '#CBD5E1', true: '#7DD3FC' }}
            thumbColor={prefs.promotion ? '#0EA5E9' : '#F4F4F5'}
            {...(Platform.OS === 'ios' ? { ios_backgroundColor: '#CBD5E1' } : {})}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  lead: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rowText: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  sub: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
})
