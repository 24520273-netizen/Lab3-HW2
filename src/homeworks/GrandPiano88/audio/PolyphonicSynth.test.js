import test from 'node:test'
import assert from 'node:assert/strict'
import { PolyphonicSynth } from './PolyphonicSynth.js'

class MockParam {
  constructor() {
    this.value = 0.0001
  }

  setValueAtTime(value) {
    this.value = value
  }

  exponentialRampToValueAtTime(value) {
    this.value = value
  }

  cancelScheduledValues() {}
  cancelAndHoldAtTime() {}
}

class MockOscillator {
  constructor() {
    this.frequency = new MockParam()
    this.onended = null
    this.started = false
  }

  connect() {}
  disconnect() {}

  start() {
    this.started = true
  }

  stop() {}
}

class MockGain {
  constructor() {
    this.gain = new MockParam()
  }

  connect() {}
  disconnect() {}
}

class MockAudioContext {
  constructor() {
    this.currentTime = 0
    this.state = 'running'
    this.destination = {}
  }

  createOscillator() {
    return new MockOscillator()
  }

  createGain() {
    return new MockGain()
  }

  async resume() {
    this.state = 'running'
  }

  async close() {
    this.state = 'closed'
  }
}

test('A4 is 440 Hz and context is reused', async () => {
  globalThis.AudioContext = MockAudioContext
  const synth = new PolyphonicSynth()

  await synth.noteOn(69)
  const firstContext = synth.ctx

  assert.equal(synth.voices.get(69).freqHz, 440)

  await synth.noteOn(72)
  assert.equal(synth.ctx, firstContext)
  assert.equal(synth.voices.size, 2)

  synth.dispose()
  delete globalThis.AudioContext
})

test('eight voices, FIFO steal and no duplicate note', async () => {
  globalThis.AudioContext = MockAudioContext

  const stolen = []
  const synth = new PolyphonicSynth({
    onVoiceStolen: (midi) => stolen.push(midi),
  })

  for (let midi = 60; midi < 68; midi += 1) {
    await synth.noteOn(midi)
  }

  assert.equal(synth.voices.size, 8)

  const duplicate = await synth.noteOn(67)
  assert.equal(duplicate, false)
  assert.equal(synth.voices.size, 8)

  await synth.noteOn(68)

  assert.deepEqual(stolen, [60])
  assert.equal(synth.voices.has(60), false)
  assert.equal(synth.voices.has(68), true)
  assert.equal(synth.voices.size, 8)

  synth.noteOff(61)
  assert.equal(synth.voices.size, 7)

  synth.allNotesOff()
  assert.equal(synth.voices.size, 0)

  synth.dispose()
  delete globalThis.AudioContext
})

test('quick note-off before async resume cancels pending note', async () => {
  let resumeAudio

  class SuspendedContext extends MockAudioContext {
    constructor() {
      super()
      this.state = 'suspended'
    }

    resume() {
      return new Promise((resolve) => {
        resumeAudio = () => {
          this.state = 'running'
          resolve()
        }
      })
    }
  }

  globalThis.AudioContext = SuspendedContext
  const synth = new PolyphonicSynth()

  const pending = synth.noteOn(69)
  synth.noteOff(69)
  resumeAudio()

  assert.equal(await pending, false)
  assert.equal(synth.voices.size, 0)

  synth.dispose()
  delete globalThis.AudioContext
})
