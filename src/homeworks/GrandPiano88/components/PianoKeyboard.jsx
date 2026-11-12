import PianoKey from './PianoKey'
import { PIANO_NOTES } from '../utils/midi'
import styles from './PianoKeyboard.module.css'

const noop = () => {}

function PianoKeyboard({
  pressedNotes = null,
  onNoteOn = noop,
  onNoteOff = noop,
}) {
  return (
    <section className={styles.section} aria-labelledby="keyboard-title">
      <div className={styles.heading}>
        <div>
          <h2 id="keyboard-title">Grand Piano 88</h2>
          <p>A0 - C8 | MIDI 21 - 108</p>
        </div>
        <span className={styles.count}>88 keys</span>
      </div>

      <p className={styles.hint}>
        Use your mouse, touch, or Tab and Enter/Space to play.
        On smaller screens, scroll the keyboard horizontally.
      </p>

      <div
        className={styles.scrollArea}
        tabIndex={0}
        role="region"
        aria-label="Scrollable piano keyboard"
      >
        <div className={styles.keyboard}>
          {PIANO_NOTES.map((note) => (
            <PianoKey
              key={note.midi}
              midi={note.midi}
              noteName={note.noteName}
              isBlack={note.isBlack}
              whiteIndex={note.whiteIndex}
              isPressed={pressedNotes?.has(note.midi) ?? false}
              onNoteOn={onNoteOn}
              onNoteOff={onNoteOff}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default PianoKeyboard
