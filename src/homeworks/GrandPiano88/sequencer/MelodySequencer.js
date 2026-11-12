export class MelodySequencer {
  constructor(synth, {
    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = {}) {
    this.synth = synth
    this.wait = wait
    this.playing = false
  }

  validate(events) {
    if (!Array.isArray(events)) {
      throw new TypeError('Events must be an array')
    }

    for (const event of events) {
      if (
        !Number.isInteger(event.midi) ||
        event.midi < 21 ||
        event.midi > 108 ||
        !Number.isFinite(event.freqHz) ||
        event.freqHz <= 0 ||
        !Number.isFinite(event.durationMs) ||
        event.durationMs < 0 ||
        !Number.isFinite(event.deltaMs) ||
        event.deltaMs < 0
      ) {
        throw new RangeError('Invalid recorded note event')
      }
    }
  }

  async play(events) {
    if (this.playing) return false

    this.validate(events)

    if (events.length === 0) return false

    this.playing = true

    const ordered = events
      .map((event, index) => ({ ...event, index }))
      .sort((a, b) => a.deltaMs - b.deltaMs || a.index - b.index)

    try {
      const tasks = ordered.map(async (event) => {
        await this.wait(event.deltaMs)

        const started = await this.synth.noteOn(
          event.midi,
          event.freqHz,
        )

        if (!started) return

        try {
          await this.wait(event.durationMs)
        } finally {
          this.synth.noteOff(event.midi)
        }
      })

      await Promise.all(tasks)
      return true
    } finally {
      this.playing = false
    }
  }
}
