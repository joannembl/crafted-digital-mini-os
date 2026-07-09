import { AlertTriangle, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  requireText,
  onCancel,
  onConfirm,
}) {
  const [typedText, setTypedText] = useState('')

  useEffect(() => {
    if (open) setTypedText('')
  }, [open])

  if (!open) return null

  const requiresMatch = Boolean(requireText)
  const canConfirm = !requiresMatch || typedText === requireText

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) onCancel?.()
  }

  return (
    <div className="modal-backdrop" onMouseDown={handleBackdropClick} role="presentation">
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <button className="modal-close-button" type="button" onClick={onCancel} aria-label="Close dialog">
          <X size={18} />
        </button>
        <div className={`confirm-icon ${tone}`}>
          <AlertTriangle size={22} />
        </div>
        <div className="confirm-dialog-content">
          <h2 id="confirm-dialog-title">{title}</h2>
          {message ? <p>{message}</p> : null}
          {requiresMatch ? (
            <label className="confirm-text-label">
              Type <strong>{requireText}</strong> to confirm.
              <input
                autoFocus
                value={typedText}
                onChange={(event) => setTypedText(event.target.value)}
                placeholder={requireText}
              />
            </label>
          ) : null}
        </div>
        <div className="confirm-dialog-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>{cancelLabel}</button>
          <button className={tone === 'danger' ? 'danger-button' : 'primary-button'} type="button" onClick={onConfirm} disabled={!canConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
