import { memo, useRef } from 'react'
import styles from './PianoKey.module.css'

function PianoKey({
  midi,
  noteName,
  isBlack,
  isPressed,
  onNoteOn,
  onNoteOff,
  whiteIndex,
}) {
  const pointerActive = useRef(false)
  const keyboardActive = useRef(false)
  const activePointerId = useRef(null)

  const start = (source) => {
    const wasActive = pointerActive.current || keyboardActive.current

    if (source === 'pointer') {
      if (pointerActive.current) return
      pointerActive.current = true
    } else {
      if (keyboardActive.current) return
      keyboardActive.current = true
    }

    if (!wasActive) onNoteOn(midi)
  }

  const stop = (source) => {
    if (source === 'pointer') {
      if (!pointerActive.current) return
      pointerActive.current = false
      activePointerId.current = null
    } else {
      if (!keyboardActive.current) return
      keyboardActive.current = false
    }

    if (!pointerActive.current && !keyboardActive.current) {
      onNoteOff(midi)
    }
  }

  const stopAll = () => {
    if (!pointerActive.current && !keyboardActive.current) return
    pointerActive.current = false
    keyboardActive.current = false
    activePointerId.current = null
    onNoteOff(midi)
  }

  const handlePointerDown = (event) => {
    if (event.button !== 0 || !event.isPrimary) return
    if (pointerActive.current) return

    event.preventDefault()
    activePointerId.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    start('pointer')
  }

  const handlePointerUp = (event) => {
    if (event.pointerId !== activePointerId.current) return

    stop('pointer')

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handlePointerCancel = (event) => {
    if (event.pointerId === activePointerId.current) {
      stop('pointer')
    }
  }

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    if (!event.repeat) start('keyboard')
  }

  const handleKeyUp = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    stop('keyboard')
  }

  return (
    <button
      type="button"
      className={`${styles.key} ${isBlack ? styles.black : styles.white} ${isPressed ? styles.pressed : ''}`}
      style={{ '--white-index': whiteIndex }}
      aria-label={`Piano note ${noteName}`}
      aria-pressed={isPressed}
      title={`${noteName} (MIDI ${midi})`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handlePointerCancel}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={stopAll}
      onClick={(event) => event.preventDefault()}
    >
      <span className={styles.label} aria-hidden="true">
        {noteName}
      </span>
    </button>
  )
}

export default memo(PianoKey)
