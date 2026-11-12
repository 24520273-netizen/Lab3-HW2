import styles from './RecordingControls.module.css'

export default function RecordingControls({
  isRecording,
  isPlaying,
  noteCount,
  speed,
  onStartRecording,
  onStopRecording,
  onPlay,
  onStop,
  onSpeedChange,
  error,
}) {
  return (
    <section className={styles.panel} aria-labelledby="recorder-title">
      <div className={styles.heading}>
        <div>
          <h2 id="recorder-title">Recording & Sequencer</h2>
          <p>Record and replay your piano performance.</p>
        </div>
        <span className={styles.status} role="status">
          {isRecording
            ? 'Recording'
            : isPlaying
              ? 'Playing'
              : 'Ready'}
        </span>
      </div>

      <p aria-live="polite">
        Recorded notes: <strong>{noteCount}</strong>
      </p>

      <div className={styles.controls}>
        <button
          type="button"
          onClick={onStartRecording}
          disabled={isRecording || isPlaying}
        >
          Start Recording
        </button>

        <button
          type="button"
          onClick={onStopRecording}
          disabled={!isRecording}
        >
          Stop Recording
        </button>

        <label className={styles.speed}>
          Playback speed
          <select
            value={speed}
            onChange={(event) =>
              onSpeedChange(Number(event.target.value))
            }
            disabled={isPlaying}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1.0x</option>
            <option value={2}>2.0x</option>
          </select>
        </label>

        <button
          type="button"
          onClick={onPlay}
          disabled={isPlaying || isRecording || noteCount === 0}
        >
          Play Sequence
        </button>

        <button
          type="button"
          onClick={onStop}
          disabled={!isPlaying}
        >
          Stop Sequence
        </button>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
