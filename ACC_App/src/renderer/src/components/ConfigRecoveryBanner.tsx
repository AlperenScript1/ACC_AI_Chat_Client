import { useEffect, useState } from 'react'

export function ConfigRecoveryBanner(): React.JSX.Element | null {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const recreated = await window.api.wasConfigRecreated()
        if (!cancelled && recreated) {
          setVisible(true)
          void window.api.acknowledgeConfigRecreated()
        }
      } catch {
        // ignore (dev / API unavailable)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'min(860px, calc(100vw - 24px))',
        borderRadius: 17,
        background: 'rgba(17, 24, 39, 0.85)',
        border: '1px solid rgba(255, 0, 0, 0.35)',
        boxShadow: '0 12px 40px rgba(255, 0, 0, 0.2)',
        color: 'rgba(255, 0, 0, 0.92)',
        padding: '10px 12px',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flexShrink: 0, marginTop: 1, fontSize: 16, lineHeight: 1.2 }}>⚠️</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255, 0, 0, 0.95)' }}>
            Yapılandırma Dosyası Yeniden Oluşturuldu
          </div>
          <div style={{ marginTop: 2, fontSize: 12, color: 'rgba(255, 255, 255, 0.75)' }}>
            <code
              style={{
                padding: '1px 6px',
                borderRadius: 999,
                background: 'rgba(255, 0, 0, 0.12)',
                border: '1px solid rgba(255, 0, 0, 0.22)',
                color: 'rgb(255, 196, 0)'
              }}
            >
              config.json
            </code>{' '}
            bulunamadığı veya bozuk olduğu için varsayılan ayarlarla otomatik olarak yeniden oluşturuldu.
            Önceki ayarlarınız kaybolmuş olabilir.
          </div>
        </div>

        <button
          onClick={() => setVisible(false)}
          aria-label="Kapat"
          style={{
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            color: 'rgb(255, 255, 255)',
            fontSize: 18,
            cursor: 'pointer',
            padding: '0 2px',
            lineHeight: 1,
            marginTop: -1
          }}
        >
          X
        </button>
      </div>
    </div>
  )
}

