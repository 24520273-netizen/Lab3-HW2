import test from 'node:test'
import assert from 'node:assert/strict'
import { PianoRecorder } from './PianoRecorder.js'

test('records five notes with required fields', () => {
  let time = 1000
  const recorder = new PianoRecorder(() => time)

  recorder.start()

  for (let i = 0; i < 5; i += 1) {
    time += 100
    recorder.noteOn(60 + i, 440)
    time += 150
    recorder.noteOff(60 + i)
  }

  const events = recorder.stop()

  assert.equal(events.length, 5)
  assert.deepEqual(
    Object.keys(events[0]),
    ['midi', 'freqHz', 'durationMs', 'deltaMs'],
  )
  assert.equal(events[0].durationMs, 150)
  assert.deepEqual(
    events.map((event) => event.deltaMs),
    [100, 350, 600, 850, 1100],
  )
})

test('preserves overlapping notes and FIFO order', () => {
  let time = 0
  const recorder = new PianoRecorder(() => time)

  recorder.start()
  recorder.noteOn(60, 261.63)

  time = 50
  recorder.noteOn(64, 329.63)

  time = 100
  recorder.noteOff(60)

  time = 180
  recorder.noteOff(64)

  const events = recorder.stop()

  assert.deepEqual(events.map((e) => e.midi), [60, 64])
  assert.deepEqual(events.map((e) => e.deltaMs), [0, 50])
  assert.deepEqual(events.map((e) => e.durationMs), [100, 130])
})

test('stop finalizes held notes and avoids duplicates', () => {
  let time = 0
  const recorder = new PianoRecorder(() => time)

  recorder.start()
  assert.equal(recorder.noteOn(69, 440), true)
  assert.equal(recorder.noteOn(69, 440), false)

  time = 250
  const events = recorder.stop()

  assert.equal(events.length, 1)
  assert.equal(events[0].durationMs, 250)
  assert.equal(recorder.noteOn(70, 466), false)
})
