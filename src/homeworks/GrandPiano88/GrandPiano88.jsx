import { useCallback, useEffect, useRef, useState } from 'react'
import PianoKeyboard from './components/PianoKeyboard'
import RecordingControls from './components/RecordingControls'
import { PolyphonicSynth } from './audio/PolyphonicSynth'
import { PianoRecorder } from './recording/PianoRecorder'
import { MelodySequencer } from './sequencer/MelodySequencer'
import { midiToFrequency } from './utils/midi'
import styles from './GrandPiano88.module.css'

function GrandPiano88() {
  const [pressedNotes, setPressedNotes] = useState(() => new Set())
  const [events, setEvents] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [error, setError] = useState('')

  const synthRef = useRef(null)
  const recorderRef = useRef(null)
  const sequencerRef = useRef(null)
  const liveHeldRef = useRef(new Set())
  const playRunRef = useRef(0)

  const getRecorder = useCallback(() => {
    if (!recorderRef.current) {
      recorderRef.current = new PianoRecorder()
    }
    return recorderRef.current
  }, [])

  const getSynth = useCallback(() => {
    if (!synthRef.current) {
      synthRef.current = new PolyphonicSynth({
        maxVoices: 8,
        onVoiceStolen: (midi) => {
          liveHeldRef.current.delete(midi)
          recorderRef.current?.noteOff(midi)

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

  const stopReplay = useCallback(() => {
    playRunRef.current += 1
    sequencerRef.current?.stop()
    setIsPlaying(false)
  }, [])

  const handleNoteOn = useCallback((midi) => {
    if (liveHeldRef.current.has(midi)) return

    if (sequencerRef.current?.playing) {
      stopReplay()
    }

    liveHeldRef.current.add(midi)

    const synth = getSynth()
    const frequency = midiToFrequency(midi)

    getRecorder().noteOn(midi, frequency)

    setPressedNotes((previous) => {
      const next = new Set(previous)
      next.add(midi)
      return next
    })

    void synth.noteOn(midi, frequency).catch((cause) => {
      console.error('Piano note error:', cause)
      liveHeldRef.current.delete(midi)
      recorderRef.current?.noteOff(midi)

      setPressedNotes((previous) => {
        if (!previous.has(midi)) return previous
        const next = new Set(previous)
        next.delete(midi)
        return next
      })

      setError('Unable to play note. Check browser audio permissions.')
    })
  }, [getRecorder, getSynth, stopReplay])

  const handleNoteOff = useCallback((midi) => {
    if (!liveHeldRef.current.delete(midi)) return

    synthRef.current?.noteOff(midi)
    recorderRef.current?.noteOff(midi)

    if (recorderRef.current?.recording) {
      setEvents(recorderRef.current.getEvents())
    }

    setPressedNotes((previous) => {
      if (!previous.has(midi)) return previous
      const next = new Set(previous)
      next.delete(midi)
      return next
    })
  }, [])

  const releaseLiveNotes = useCallback(() => {
    for (const midi of liveHeldRef.current) {
      recorderRef.current?.noteOff(midi)
    }

    liveHeldRef.current.clear()
    synthRef.current?.allNotesOff()

    setPressedNotes((previous) =>
      previous.size === 0 ? previous : new Set()
    )
  }, [])

  const startRecording = useCallback(() => {
    if (sequencerRef.current?.playing || liveHeldRef.current.size) {
      setError('Release all keys before starting a recording.')
      return
    }

    if (!getRecorder().start()) return

    setEvents([])
    setError('')
    setIsRecording(true)
  }, [getRecorder])

  const stopRecording = useCallback(() => {
    const recorded = getRecorder().stop()
    setEvents(recorded)
    setIsRecording(false)
  }, [getRecorder])

  const playSequence = useCallback(() => {
    if (isRecording || isPlaying || events.length === 0) return

    if (liveHeldRef.current.size) {
      setError('Release all live piano keys before replay.')
      return
    }

    const synth = getSynth()

    if (!sequencerRef.current) {
      sequencerRef.current = new MelodySequencer(synth)
    }

    const seq = sequencerRef.current
    const run = ++playRunRef.current

    setError('')
    setIsPlaying(true)

    void seq.play(events, speed)
      .catch((cause) => {
        console.error('Sequencer error:', cause)
        if (playRunRef.current === run) {
          setError('Sequence playback failed.')
        }
      })
      .finally(() => {
        if (playRunRef.current === run) {
          setIsPlaying(false)
        }
      })
  }, [events, getSynth, isPlaying, isRecording, speed])

  useEffect(() => {
    const onBlur = () => {
      stopReplay()
      releaseLiveNotes()
    }

    const onVisibilityChange = () => {
      if (document.hidden) onBlur()
    }

    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibilityChange)

      sequencerRef.current?.stop()
      recorderRef.current?.stop()

      liveHeldRef.current.clear()
      synthRef.current?.dispose()

      sequencerRef.current = null
      synthRef.current = null
      recorderRef.current = null
    }
  }, [releaseLiveNotes, stopReplay])

  const activeNotes = [...pressedNotes]
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

      <RecordingControls
        isRecording={isRecording}
        isPlaying={isPlaying}
        noteCount={events.length}
        speed={speed}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onPlay={playSequence}
        onStop={stopReplay}
        onSpeedChange={setSpeed}
        error={error}
      />

      <footer className={styles.footer}>
        Web Audio API - 8-Voice Polyphony - FIFO Sequencer
      </footer>
    </main>
  )
}

export default GrandPiano88
