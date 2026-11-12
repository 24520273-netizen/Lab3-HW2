import PianoKeyboard from './components/PianoKeyboard'
import styles from './GrandPiano88.module.css'

function GrandPiano88() {
  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>UIT - LAB 03 - HOMEWORK 2</p>
        <h1>88-Key Polyphonic Piano</h1>
        <p className={styles.subtitle}>
          Interactive Grand Piano powered by React 19
        </p>
      </header>

      <PianoKeyboard />

      <footer className={styles.footer}>
        Piano UI preview - Audio Engine will be implemented in Step 3.
      </footer>
    </main>
  )
}

export default GrandPiano88
