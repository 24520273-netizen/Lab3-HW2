import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MIDI_MIN,
  MIDI_MAX,
  PIANO_NOTES,
  generatePianoNotes,
  midiToFrequency,
} from './midi.js'

test('generates exactly 88 consecutive MIDI notes', () => {
  assert.equal(MIDI_MIN, 21)
  assert.equal(MIDI_MAX, 108)
  assert.equal(PIANO_NOTES.length, 88)

  for (let i = 0; i < PIANO_NOTES.length; i += 1) {
    assert.equal(PIANO_NOTES[i].midi, 21 + i)
  }

  assert.equal(PIANO_NOTES[0].noteName, 'A0')
  assert.equal(PIANO_NOTES.at(-1).noteName, 'C8')
})

test('generates 52 white and 36 black keys', () => {
  const white = PIANO_NOTES.filter((note) => !note.isBlack)
  const black = PIANO_NOTES.filter((note) => note.isBlack)

  assert.equal(white.length, 52)
  assert.equal(black.length, 36)

  assert.deepEqual(
    white.map((note) => note.whiteIndex),
    Array.from({ length: 52 }, (_, index) => index),
  )
})

test('calculates correct musical frequencies', () => {
  assert.equal(midiToFrequency(69), 440)

  assert.ok(
    Math.abs(midiToFrequency(21) - 27.5) < 0.0001,
  )

  assert.ok(
    Math.abs(midiToFrequency(108) - 4186.009) < 0.01,
  )

  for (const note of PIANO_NOTES) {
    assert.ok(Number.isFinite(note.freqHz))
    assert.ok(note.freqHz > 0)
    assert.equal(note.freqHz, midiToFrequency(note.midi))
  }
})

test('note generation is deterministic', () => {
  const generated = generatePianoNotes()
  assert.deepEqual(generated, PIANO_NOTES)
})
