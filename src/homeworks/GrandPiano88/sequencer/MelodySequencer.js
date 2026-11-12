function abortError() {
  return new DOMException('Playback aborted', 'AbortError')
}

function abortableWait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError())
      return
    }

    const cleanup = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', onAbort)
    }

    const onAbort = () => {
      cleanup()
      reject(abortError())
    }

    const timer = setTimeout(() => {
      cleanup()
      resolve()
    }, Math.max(0, ms))

    signal.addEventListener('abort', onAbort, { once: true })
  })
}

export class MelodySequencer {
  constructor(synth, { wait = abortableWait } = {}) {
    this.synth = synth
    this.wait = wait
    this.playing = false
    this.controller = null
    this.owned = new Map()
    this.pending = new Set()
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

  releaseOwned(midi, voice) {
    if (this.owned.get(midi) !== voice) return

    this.owned.delete(midi)

    if (
      !this.synth.voices ||
      this.synth.voices.get(midi) === voice
    ) {
      this.synth.noteOff(midi)
    }
  }

  stop() {
    if (!this.controller) return

    this.controller.abort()

    for (const midi of this.pending) {
      if (!this.owned.has(midi)) {
        this.synth.noteOff(midi)
      }
    }

    this.pending.clear()

    for (const [midi, voice] of [...this.owned]) {
      this.releaseOwned(midi, voice)
    }

    this.controller = null
    this.playing = false
  }

  async play(events, speed = 1) {
    if (this.playing) return false

    this.validate(events)

    if (![0.5, 1, 2].includes(speed)) {
      throw new RangeError('Invalid playback speed')
    }

    if (events.length === 0) return false

    const controller = new AbortController()
    const { signal } = controller

    this.controller = controller
    this.playing = true
    this.owned.clear()
    this.pending.clear()

    const ordered = events
      .map((event, index) => ({ ...event, index }))
      .sort((a, b) => a.deltaMs - b.deltaMs || a.index - b.index)

    const playEvent = async (event) => {
      await this.wait(event.deltaMs / speed, signal)

      if (signal.aborted) return

      if (
        this.synth.voices?.has(event.midi) ||
        this.pending.has(event.midi)
      ) {
        return
      }

      this.pending.add(event.midi)

      let started

      try {
        started = await this.synth.noteOn(
          event.midi,
          event.freqHz,
        )
      } finally {
        this.pending.delete(event.midi)
      }

      if (!started) return

      const voice = this.synth.voices?.get(event.midi) ?? null

      if (signal.aborted) {
        if (
          !this.synth.voices ||
          this.synth.voices.get(event.midi) === voice
        ) {
          this.synth.noteOff(event.midi)
        }
        return
      }

      this.owned.set(event.midi, voice)

      try {
        await this.wait(event.durationMs / speed, signal)
      } finally {
        this.releaseOwned(event.midi, voice)
      }
    }

    try {
      await Promise.all(ordered.map(playEvent))
      return !signal.aborted
    } catch (error) {
      if (error.name === 'AbortError' && signal.aborted) {
        return false
      }

      this.stop()
      throw error
    } finally {
      if (this.controller === controller) {
        this.stop()
      }
    }
  }
}
