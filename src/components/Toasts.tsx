import { Check, Info, Moon, Star, X } from 'lucide-react'
import { useBrowser } from '../store/browser'

export function Toasts() {
  const { state, dismissToast, navigate, wakeTabs } = useBrowser()

  if (state.toasts.length === 0) return null

  return (
    <div className="toasts" aria-live="polite">
      {state.toasts.map((toast) => {
        const Icon = toast.icon === 'moon' ? Moon : toast.icon === 'check' ? Check : toast.icon === 'info' ? Info : Star
        return (
          <div className="toast" key={toast.id}>
            <span className="toast__icon" data-tone={toast.icon ?? 'star'}>
              <Icon size={14} strokeWidth={2.2} />
            </span>
            <span className="toast__message">{toast.message}</span>
            {toast.actionLabel && (
              <button
                className="toast__action"
                onClick={() => {
                  if (toast.undo?.type === 'hibernate') {
                    wakeTabs(toast.undo.ids)
                  } else if (toast.actionUrl) {
                    navigate(toast.actionUrl)
                  }
                  dismissToast(toast.id)
                }}
              >
                {toast.actionLabel}
              </button>
            )}
            <button className="toast__close" onClick={() => dismissToast(toast.id)} aria-label="Dismiss">
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
