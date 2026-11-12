import { useCallback, useState } from 'react'
import PianoKeyboard from './components/PianoKeyboard'
import styles from './GrandPiano88.module.css'

function GrandPiano88() {
  const [pressedNotes, setPressedNotes] = useState(() => new Set())

  const handleNoteOn = useCallback((midi) => {
    setPressedNotes((previous) => {
      if (previous.has(midi)) return previous

      const next = new Set(previous)
      next.add(midi)
      return next
    })
  }, [])

  const handleNoteOff = useCallback((midi) => {
    setPressedNotes((previous) => {
      if (!previous.has(midi)) return previous

      const next = new Set(previous)
      next.delete(midi)
      return next
    })
  }, [])

  const activeNotes = Array.from(pressedNotes)
    .sort((a, b) => a - b)
    .join(', ')

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>UIT - LAB 03 - HOMEWORK 2</p>
        <h1>88-Key Polyphonic Piano</h1>
        <p className={styles.subtitle}>
          Interactive Grand Piano powered by React 19
        </p>
      </header>

      <PianoKeyboard
        pressedNotes={pressedNotes}
        onNoteOn={handleNoteOn}
        onNoteOff={handleNoteOff}
      />

      <section className={styles.status} aria-label="Piano status">
        <div>
          <strong>Active notes: {pressedNotes.size}</strong>
          <p>
            {pressedNotes.size > 0
              ? `MIDI: ${activeNotes}`
              : 'No keys pressed'}
          </p>
        </div>

        <span className={styles.statusBadge}>
          UI Mode
        </span>
      </section>

      <footer className={styles.footer}>
        Audio Engine and polyphony will be implemented in Step 3.
      </footer>
    </main>
  )
}

export default GrandPiano88
