export class PianoRecorder {
  constructor(now = () => performance.now()) {
    this.now = now
    this.recording = false
    this.startedAt = 0
    this.events = []
    this.held = new Map()
    this.nextId = 0
  }

  start() {
    if (this.recording) return false

    this.events = []
    this.held.clear()
    this.nextId = 0
    this.startedAt = this.now()
    this.recording = true
    return true
  }

  noteOn(midi, freqHz) {
    if (!this.recording || this.held.has(midi)) return false

    const timestamp = this.now()

    const event = {
      id: this.nextId++,
      midi,
      freqHz,
      durationMs: null,
      deltaMs: Math.max(0, timestamp - this.startedAt),
    }

    this.events = [...this.events, event]
    this.held.set(midi, {
      id: event.id,
      startedAt: timestamp,
    })

    return true
  }

  noteOff(midi) {
    if (!this.recording) return false

    const held = this.held.get(midi)
    if (!held) return false

    const durationMs = Math.max(0, this.now() - held.startedAt)

    this.events = this.events.map((event) =>
      event.id === held.id
        ? { ...event, durationMs }
        : event
    )

    this.held.delete(midi)
    return true
  }

  stop() {
    if (!this.recording) return this.getEvents()

    const stoppedAt = this.now()

    for (const held of this.held.values()) {
      const durationMs = Math.max(
        0,
        stoppedAt - held.startedAt,
      )

      this.events = this.events.map((event) =>
        event.id === held.id
          ? { ...event, durationMs }
          : event
      )
    }

    this.held.clear()
    this.recording = false
    return this.getEvents()
  }

  getEvents() {
    return this.events
      .filter((event) => event.durationMs !== null)
      .map(({ midi, freqHz, durationMs, deltaMs }) => ({
        midi,
        freqHz,
        durationMs,
        deltaMs,
      }))
  }
}
