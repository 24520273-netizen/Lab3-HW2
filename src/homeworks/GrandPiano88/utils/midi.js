const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B',
]

const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10])

export const MIDI_MIN = 21
export const MIDI_MAX = 108

export function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12)
}

export function generatePianoNotes() {
  const notes = []
  let whiteIndex = 0

  for (let midi = MIDI_MIN; midi <= MIDI_MAX; midi += 1) {
    const pitchClass = midi % 12
    const octave = Math.floor(midi / 12) - 1
    const noteName = `${NOTE_NAMES[pitchClass]}${octave}`
    const isBlack = BLACK_PITCH_CLASSES.has(pitchClass)

    notes.push({
      midi,
      noteName,
      octave,
      freqHz: midiToFrequency(midi),
      isBlack,
      whiteIndex,
    })

    if (!isBlack) {
      whiteIndex += 1
    }
  }

  return notes
}

export const PIANO_NOTES = generatePianoNotes()
