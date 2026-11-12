import test from 'node:test'
import assert from 'node:assert/strict'
import { MelodySequencer } from './MelodySequencer.js'

function makeSynth() {
  const calls = []
  const voices = new Map()

  return {
    calls,
    voices,
    async noteOn(midi) {
      if (voices.has(midi)) return false
      voices.set(midi, { midi })
      calls.push(`on:${midi}`)
      return true
    },
    noteOff(midi) {
      voices.delete(midi)
      calls.push(`off:${midi}`)
    },
  }
}

function event(midi, deltaMs, durationMs) {
  return {
    midi,
    freqHz: 440,
    deltaMs,
    durationMs,
  }
}

test('rejects invalid speed', async () => {
  const seq = new MelodySequencer(makeSynth())

  await assert.rejects(
    () => seq.play([event(69, 0, 100)], 3),
    RangeError,
  )
})

test('speed scales both offsets and durations', async () => {
  for (const speed of [0.5, 1, 2]) {
    const waits = []
    const synth = makeSynth()

    const seq = new MelodySequencer(synth, {
      wait: async (ms) => {
        waits.push(ms)
      },
    })

    assert.equal(
      await seq.play([event(69, 200, 400)], speed),
      true,
    )

    assert.deepEqual(waits, [200 / speed, 400 / speed])
    assert.deepEqual(synth.calls, ['on:69', 'off:69'])
  }
})

test('stop cancels future note starts', async () => {
  const synth = makeSynth()

  const seq = new MelodySequencer(synth, {
    wait: (ms, signal) => new Promise((resolve, reject) => {
      if (ms === 0) {
        resolve()
        return
      }

      const onAbort = () => {
        reject(new DOMException('Aborted', 'AbortError'))
      }

      if (signal.aborted) {
        onAbort()
      } else {
        signal.addEventListener('abort', onAbort, { once: true })
      }
    }),
  })

  const playback = seq.play([
    event(60, 0, 500),
    event(64, 1000, 500),
  ])

  await Promise.resolve()
  await Promise.resolve()

  seq.stop()

  assert.equal(await playback, false)
  assert.equal(synth.voices.size, 0)
  assert.equal(synth.calls.includes('on:64'), false)
  assert.equal(seq.playing, false)
})

test('stop preserves unrelated live voices', async () => {
  const synth = makeSynth()
  await synth.noteOn(72)

  const seq = new MelodySequencer(synth, {
    wait: (ms, signal) => new Promise((resolve, reject) => {
      if (ms === 0) {
        resolve()
        return
      }

      signal.addEventListener(
        'abort',
        () => reject(new DOMException('Aborted', 'AbortError')),
        { once: true },
      )
    }),
  })

  const playback = seq.play([
    event(60, 0, 1000),
  ])

  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()

  seq.stop()
  await playback

  assert.equal(synth.voices.has(72), true)
  assert.equal(synth.voices.has(60), false)
})
