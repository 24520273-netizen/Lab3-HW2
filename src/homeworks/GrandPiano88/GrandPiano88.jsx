import { useCallback, useEffect, useRef, useState } from 'react'
import PianoKeyboard from './components/PianoKeyboard'
import { PolyphonicSynth } from './audio/PolyphonicSynth'
import { midiToFrequency } from './utils/midi'
import styles from './GrandPiano88.module.css'

function GrandPiano88() {
  const [pressedNotes, setPressedNotes] = useState(() => new Set())
  const synthRef = useRef(null)

  const getSynth = useCallback(() => {
    if (!synthRef.current) {
      synthRef.current = new PolyphonicSynth({
        maxVoices: 8,
        onVoiceStolen: (midi) => {
          setPressedNotes((previous) => {
            if (!previous.has(midi)) return previous

            const next = new Set(previous)
            next.delete(midi)
            return next
          })
        },
      })
    }

    return synthRef.current
  }, [])

  const handleNoteOn = useCallback((midi) => {
    const synth = getSynth()

    setPressedNotes((previous) => {
      if (previous.has(midi)) return previous

      const next = new Set(previous)
      next.add(midi)
      return next
    })

    void synth.noteOn(midi, midiToFrequency(midi)).catch((error) => {
      console.error('Unable to play piano note:', error)

      setPressedNotes((previous) => {
        if (!previous.has(midi)) return previous

        const next = new Set(previous)
        next.delete(midi)
        return next
      })
    })
  }, [getSynth])

  const handleNoteOff = useCallback((midi) => {
    synthRef.current?.noteOff(midi)

    setPressedNotes((previous) => {
      if (!previous.has(midi)) return previous

      const next = new Set(previous)
      next.delete(midi)
      return next
    })
  }, [])

  const handleAllNotesOff = useCallback(() => {
    synthRef.current?.allNotesOff()
    setPressedNotes((previous) =>
      previous.size === 0 ? previous : new Set()
    )
  }, [])

  useEffect(() => {
    const onWindowBlur = () => handleAllNotesOff()

    const onVisibilityChange = () => {
      if (document.hidden) handleAllNotesOff()
    }

    window.addEventListener('blur', onWindowBlur)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('blur', onWindowBlur)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      synthRef.current?.dispose()
      synthRef.current = null
    }
  }, [handleAllNotesOff])

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
          Audio Enabled
        </span>
      </section>

      <footer className={styles.footer}>
        Web Audio API - 8-Voice Polyphony - FIFO Voice Stealing
      </footer>
    </main>
  )
}

export default GrandPiano88
