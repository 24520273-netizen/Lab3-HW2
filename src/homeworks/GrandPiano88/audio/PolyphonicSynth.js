import { midiToFrequency } from '../utils/midi'

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
