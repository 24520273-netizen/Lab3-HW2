import { midiToFrequency } from '../utils/midi.js'

export class PolyphonicSynth {
  constructor({ maxVoices = 8, onVoiceStolen = () => {} } = {}) {
    this.ctx = null
    this.maxVoices = maxVoices
    this.voices = new Map()
    this.nodes = new Set()
    this.requested = new Set()
    this.onVoiceStolen = onVoiceStolen
    this.disposed = false
  }

  async ensureContext() {
    if (this.disposed) {
      throw new Error('Synth has been disposed')
    }

    if (!this.ctx) {
      const AudioContextClass =
        globalThis.AudioContext || globalThis.webkitAudioContext

      if (!AudioContextClass) {
        throw new Error('Web Audio API is not supported')
      }

      this.ctx = new AudioContextClass()
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }

    return this.ctx
  }

  _createVoice(midi, freqHz, startAt = this.ctx.currentTime) {
    const oscillator = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(freqHz, startAt)
    gain.gain.setValueAtTime(0.0001, startAt)

    oscillator.connect(gain)
    gain.connect(this.ctx.destination)

    const voice = {
      midi,
      freqHz,
      oscillator,
      gain,
      startedAt: startAt,
      releasing: false,
      ended: false,
    }

    this.nodes.add(voice)
    oscillator.onended = () => this._cleanupVoice(voice)
    oscillator.start(startAt)

    return voice
  }

  _cleanupVoice(voice) {
    if (voice.ended) return
    voice.ended = true

    if (this.voices.get(voice.midi) === voice) {
      this.voices.delete(voice.midi)
    }

    this.nodes.delete(voice)
    voice.oscillator.onended = null
    voice.oscillator.disconnect()
    voice.gain.disconnect()
  }

  _forceStopVoice(voice) {
    if (voice.ended) return

    if (this.ctx && this.ctx.state !== 'closed') {
      const now = this.ctx.currentTime
      voice.gain.gain.cancelScheduledValues(now)
      voice.gain.gain.setValueAtTime(0, now)

      try {
        voice.oscillator.stop(now)
      } catch (error) {
        if (error.name !== 'InvalidStateError') throw error
      }
    }

    this._cleanupVoice(voice)
  }

  async noteOn(midi, freqHz = midiToFrequency(midi)) {
    if (this.disposed || this.requested.has(midi)) return false

    if (!Number.isInteger(midi) || midi < 21 || midi > 108) {
      throw new RangeError('MIDI note must be between 21 and 108')
    }

    if (!Number.isFinite(freqHz) || freqHz <= 0) {
      throw new RangeError('Frequency must be positive')
    }

    this.requested.add(midi)

    try {
      await this.ensureContext()
    } catch (error) {
      this.requested.delete(midi)
      throw error
    }

    if (this.disposed || !this.requested.has(midi)) {
      return false
    }

    const startAt = this._makeRoom()
    const voice = this._createVoice(midi, freqHz, startAt)

    voice.gain.gain.exponentialRampToValueAtTime(
      0.18,
      startAt + 0.015,
    )

    this.voices.set(midi, voice)
    return true
  }

  _makeRoom() {
    let startAt = this.ctx.currentTime

    while (this.nodes.size >= this.maxVoices) {
      const releaseTail = [...this.nodes].find(
        (voice) => voice.releasing,
      )

      if (releaseTail) {
        this._forceStopVoice(releaseTail)
        continue
      }

      const oldest = this.voices.values().next().value

      if (!oldest) {
        throw new Error('Voice capacity is inconsistent')
      }

      this.requested.delete(oldest.midi)
      this._releaseVoice(oldest, 0.005)

      startAt = Math.max(
        startAt,
        this.ctx.currentTime + 0.006,
      )

      this.onVoiceStolen(oldest.midi)
      break
    }

    return startAt
  }
  _releaseVoice(voice, duration = 0.04) {
    if (!voice || voice.ended || voice.releasing) return

    voice.releasing = true

    if (this.voices.get(voice.midi) === voice) {
      this.voices.delete(voice.midi)
    }

    const now = this.ctx.currentTime
    const param = voice.gain.gain

    if (typeof param.cancelAndHoldAtTime === 'function') {
      param.cancelAndHoldAtTime(now)
    } else {
      param.cancelScheduledValues(now)
      param.setValueAtTime(Math.max(param.value, 0.0001), now)
    }

    param.exponentialRampToValueAtTime(
      0.0001,
      now + duration,
    )

    voice.oscillator.stop(now + duration + 0.005)
  }

  noteOff(midi) {
    this.requested.delete(midi)

    const voice = this.voices.get(midi)
    if (voice) this._releaseVoice(voice)
  }

  allNotesOff() {
    this.requested.clear()

    for (const voice of [...this.voices.values()]) {
      this._releaseVoice(voice)
    }
  }
  dispose() {
    if (this.disposed) return
    this.disposed = true

    this.requested.clear()

    for (const voice of [...this.nodes]) {
      this._forceStopVoice(voice)
    }

    this.voices.clear()

    const ctx = this.ctx
    this.ctx = null

    if (ctx && ctx.state !== 'closed') {
      void ctx.close().catch((error) => {
        console.error('AudioContext cleanup failed:', error)
      })
    }
  }
}

export { midiToFrequency }
