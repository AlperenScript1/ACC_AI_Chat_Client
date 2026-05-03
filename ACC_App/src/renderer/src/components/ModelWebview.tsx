import { useEffect, useRef } from 'react'
import type { Model } from '@renderer/types'

export type WebviewLike = HTMLElement & { executeJavaScript: (code: string) => Promise<unknown> }

type WebviewElement = WebviewLike

export interface ModelWebviewProps {
  model: Model
  isActive: boolean
  onActivity: (id: string) => void
  onWake: (id: string) => void
  /** Lets App.tsx keep refs for sync injection */
  registerWebview?: (modelId: string, el: WebviewLike | null) => void
}

export function ModelWebview({
  model,
  isActive,
  onActivity,
  onWake,
  registerWebview
}: ModelWebviewProps): React.JSX.Element {
  const webviewRef = useRef<WebviewElement | null>(null)

  useEffect(() => {
    if (model.isAsleep) {
      registerWebview?.(model.id, null)
    }
  }, [model.id, model.isAsleep, registerWebview])

  useEffect(() => {
    return () => {
      registerWebview?.(model.id, null)
    }
  }, [model.id, registerWebview])

  useEffect(() => {
    const wv = webviewRef.current
    if (!wv || model.isAsleep) return

    const handleActivity = (): void => onActivity(model.id)

    wv.addEventListener('ipc-message', handleActivity)
    wv.addEventListener('console-message', handleActivity)
    wv.addEventListener('did-start-loading', handleActivity)
    wv.addEventListener('did-navigate', handleActivity)
    wv.addEventListener('focus', handleActivity)

    return () => {
      wv.removeEventListener('ipc-message', handleActivity)
      wv.removeEventListener('console-message', handleActivity)
      wv.removeEventListener('did-start-loading', handleActivity)
      wv.removeEventListener('did-navigate', handleActivity)
      wv.removeEventListener('focus', handleActivity)
    }
  }, [model.id, model.isAsleep, onActivity])

  if (model.isAsleep) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#f5f5f5] dark:bg-[#050505] text-black dark:text-white px-6">
        <div className="text-4xl select-none" aria-hidden>
          🌙
        </div>
        <p className="mt-4 text-center text-sm font-medium text-black/80 dark:text-white/80">
          {model.name} uyku modunda
        </p>
        <button
          type="button"
          onClick={() => onWake(model.id)}
          className="mt-3 px-5 py-2 rounded-lg text-[13px] border border-black/10 dark:border-white/15 bg-black/[0.04] dark:bg-white/[0.07] hover:bg-black/[0.08] dark:hover:bg-white/10 text-black dark:text-white cursor-pointer transition-colors"
        >
          Uyandır
        </button>
      </div>
    )
  }

  return (
    <div
      className="h-full w-full"
      role="presentation"
      onMouseDown={() => onActivity(model.id)}
      onKeyDown={() => onActivity(model.id)}
    >
      {/* eslint-disable react/no-unknown-property */}
      <webview
        ref={(el) => {
          const typed = el as unknown as WebviewElement | null
          webviewRef.current = typed
          registerWebview?.(model.id, typed)
        }}
        src={model.url}
        className="w-full h-full"
        allowpopups={true}
        partition="persist:acc"
        tabIndex={isActive ? 0 : -1}
      />
      {/* eslint-enable react/no-unknown-property */}
    </div>
  )
}
