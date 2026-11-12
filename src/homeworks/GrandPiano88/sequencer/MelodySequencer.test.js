import test from 'node:test'
import assert from 'node:assert/strict'
import { MelodySequencer } from './MelodySequencer.js'

test('replays events in FIFO start-time order', async () => {
  const calls = []

  const synth = {
    async noteOn(midi) {
      calls.push(`on:${midi}`)
      return true
    },
    noteOff(midi) {
      calls.push(`off:${midi}`)
    },
  }

  const sequencer = new MelodySequencer(synth, {
    wait: async () => {},
  })

  await sequencer.play([
    { midi: 67, freqHz: 392, deltaMs: 200, durationMs: 100 },
    { midi: 60, freqHz: 261.63, deltaMs: 0, durationMs: 100 },
    { midi: 64, freqHz: 329.63, deltaMs: 100, durationMs: 100 },
  ])

  const noteOns = calls.filter((call) => call.startsWith('on:'))

  assert.deepEqual(noteOns, [
    'on:60',
    'on:64',
    'on:67',
  ])
})

test('starts overlapping notes before completing playback', async () => {
  const active = new Set()
  let maximumActive = 0

  const synth = {
    async noteOn(midi) {
      active.add(midi)
      maximumActive = Math.max(maximumActive, active.size)
      return true
    },
    noteOff(midi) {
      active.delete(midi)
    },
  }

  const sequencer = new MelodySequencer(synth, {
    wait: async () => {},
  })

  await sequencer.play([
    { midi: 60, freqHz: 261.63, deltaMs: 0, durationMs: 500 },
    { midi: 64, freqHz: 329.63, deltaMs: 0, durationMs: 500 },
    { midi: 67, freqHz: 392, deltaMs: 0, durationMs: 500 },
  ])

  assert.equal(maximumActive, 3)
  assert.equal(active.size, 0)
  assert.equal(sequencer.playing, false)
})

test('rejects invalid events and empty recordings', async () => {
  const synth = {
    async noteOn() {
      return true
    },
    noteOff() {},
  }

  const sequencer = new MelodySequencer(synth)

  assert.equal(await sequencer.play([]), false)

  await assert.rejects(
    () => sequencer.play([
      { midi: 200, freqHz: 440, deltaMs: 0, durationMs: 100 },
    ]),
    RangeError,
  )
})
