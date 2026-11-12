
# LAB 03 - HOMEWORK 2
## 88-Key Polyphonic Piano & Concurrent FIFO Sequencer

### 1. Project Overview

Build a production-oriented 88-key piano application using React 19, Vite, JavaScript, CSS Modules, and the Web Audio API.

The application supports:
- 88 piano keys from A0 to C8.
- Polyphonic audio with a maximum of 8 active voices.
- FIFO voice stealing when the ninth voice is triggered.
- Note recording and FIFO sequence replay.
- Playback speeds of 0.5x, 1.0x, and 2.0x.
- Asynchronous playback cancellation and resource cleanup.
- Optimized React rendering with React.memo.
- Responsive and accessible user interface.

### 2. Technology Stack

- React 19
- Vite
- JavaScript ES2024
- CSS Modules
- Web Audio API
- React Hooks
- Git and GitHub

Do not introduce unnecessary dependencies.

### 3. Functional Requirements

#### 3.1. MIDI Note Generation

- Generate exactly 88 keys algorithmically.
- MIDI range: 21 through 108.
- First note: A0.
- Last note: C8.
- Exactly 52 white keys and 36 black keys.
- Use stable MIDI values as React keys.
- Calculate frequency with:

  `f = 440 * 2 ** ((midi - 69) / 12)`

Each note contains:

```js
{
  midi: 69,
  noteName: "A4",
  octave: 4,
  freqHz: 440,
  isBlack: false,
  whiteIndex: 27
}
```

#### 3.2. Piano Keyboard UI

- Render keys with an algorithm, not 88 hardcoded JSX elements.
- Implement a separate PianoKey component.
- Use React.memo to optimize re-rendering.
- Support mouse, touch, and keyboard interaction.
- Show pressed and released key states.
- Use accessible buttons and ARIA attributes.
- Display black keys above the gaps between white keys.
- Support horizontal keyboard scrolling on mobile.
- Avoid page-level horizontal overflow.

#### 3.3. Audio Engine

- Use the Web Audio API.
- Maintain one managed AudioContext.
- Create oscillator and gain nodes per voice.
- Support up to 8 simultaneous active voices.
- Use a Map to manage active voices.
- Track voice insertion order for FIFO.
- When the ninth voice starts, steal the oldest voice.
- Avoid double stopping oscillators.
- Disconnect audio nodes after release.
- Prevent resource leaks.

#### 3.4. ADSR and Audio Cleanup

- Apply gain envelopes to reduce audio clicks.
- Ramp gain toward 0.0001 before stopping oscillators.
- Example release duration: approximately 40 ms.
- Handle rapid note-on and note-off.
- Clean up voices on stop or component unmount.
- Never create an AudioContext per key press.

#### 3.5. Recording

Record note events with:

```js
{
  midi: 69,
  freqHz: 440,
  durationMs: 500,
  deltaMs: 250
}
```

Definitions:
- midi: MIDI number.
- freqHz: note frequency in hertz.
- durationMs: time between note-on and note-off.
- deltaMs: delay between consecutive note-on events.
- First event deltaMs = 0.
- Preserve overlapping and concurrent note events.
- Avoid mutating recorded React state.

#### 3.6. FIFO Replay

- Store recorded events in chronological order.
- Replay events in their original order.
- Preserve note timing and overlap.
- Support playback speed controls:
  - 0.5x
  - 1.0x
  - 2.0x
- Scale both event delays and note durations.
- Use the same 8-voice audio engine for replay.
- Ensure deterministic sequence ordering.

#### 3.7. Async Sequencer and Cancellation

- Use AbortController or an equivalent mechanism.
- Cancel pending playback tasks when Stop is pressed.
- Cancel playback when the component unmounts.
- Release active replay voices on cancellation.
- Clear pending timers.
- Prevent stale playback callbacks from running.
- Avoid memory leaks and unhandled Promise rejections.

### 4. Architecture

Planned project structure:

```text
src/
  homeworks/
    GrandPiano88/
      GrandPiano88.jsx
      GrandPiano88.module.css
      components/
        PianoKeyboard.jsx
        PianoKeyboard.module.css
        PianoKey.jsx
        PianoKey.module.css
        PianoControls.jsx
        SequencerControls.jsx
      audio/
        audioEngine.js
      hooks/
        usePiano.js
        useRecorder.js
        useSequencer.js
      utils/
        midi.js
```

Create files only when they are needed.

#### Component Responsibilities

**GrandPiano88**
- Main application layout.
- Integrates keyboard, audio, and sequencer.

**PianoKeyboard**
- Renders 88 PianoKey components.
- Receives pressed-note information.
- Maintains stable note metadata.

**PianoKey**
- Memoized individual piano key.
- Handles pointer and keyboard interaction.
- Displays pressed state.
- Does not manage AudioContext.

**Audio Engine**
- Controls AudioContext, oscillators, and gain nodes.
- Manages active voices and FIFO stealing.
- Handles safe release and cleanup.

**Recorder**
- Tracks note-on and note-off timestamps.
- Produces MIDI, frequency, duration, and delta data.

**Sequencer**
- Schedules replay events.
- Controls playback speeds.
- Cancels playback safely.

### 5. React Performance Strategy

- Wrap PianoKey with React.memo.
- Use useCallback for stable interaction callbacks.
- Generate MIDI note metadata outside render.
- Avoid new callback references for each key.
- Avoid passing unnecessary objects or arrays.
- Never mutate React state.
- Keep derived values outside state when practical.
- Verify render isolation using React DevTools Profiler.

Expected behavior:
- Pressing a key updates its pressed state.
- Releasing a key restores its normal state.
- Unchanged PianoKey components do not re-render unnecessarily.

### 6. Accessibility and Responsive Design

- Semantic HTML and correct heading hierarchy.
- Piano keys are `<button type="button">`.
- Each key has an accessible name.
- Use `aria-pressed` to indicate key state.
- Support Enter and Space.
- Visible focus indication.
- Pointer cancellation and release handling.
- WCAG 2.2 AA target.
- Lighthouse Accessibility target: 100.
- Responsive layout at 375px.
- Horizontal scrolling limited to piano region.
- Respect reduced-motion preferences.

### 7. Project Rules

- Use React 19 functional components.
- Use createRoot() and StrictMode.
- Use CSS Modules for application components.
- Do not use ReactDOM.render().
- Do not use Class Components.
- Do not use defaultProps or keyCode.
- Do not use window.alert().
- Avoid redundant useEffect.
- Clean up timers, promises, oscillators, and audio nodes.
- Do not modify the Homework 1 repository.
- Preserve lecturer-required commit messages.
- Follow Plan -> Implement -> Verify -> Commit.
- Do not push, merge, reset, or rebase without explicit approval.

### 8. Step and Commit Plan

#### Step 1 - Project Setup & Planning (2 commits)

1. `chore(hw2): initialize react19 piano project`
2. `docs(hw2): define piano architecture and task decomposition`

Deliverables:
- React 19 + Vite setup.
- project-rules.md.
- TASK_DECOMPOSITION.md.
- Lint and build verification.

#### Step 2 - 88-Key UI & React.memo (4 commits)

3. `feat(hw2): generate 88 piano notes from midi range`
4. `feat(hw2): implement memoized piano key component`
5. `feat(hw2): build responsive 88-key piano layout`
6. `feat(hw2): add piano key interactions and render isolation`

Deliverables:
- MIDI data generation.
- 88-key piano UI.
- Press/release interactions.
- Responsive CSS Modules.
- React.memo optimization.

#### Step 3 - Audio Engine & Polyphony (4 commits)

7. `feat(hw2): implement web audio engine`
8. `feat(hw2): support eight voice polyphony`
9. `feat(hw2): implement fifo voice stealing`
10. `fix(hw2): implement audio envelope and cleanup`

Deliverables:
- Web Audio API integration.
- Maximum 8 active voices.
- FIFO voice stealing.
- Gain envelopes and audio cleanup.

#### Step 4 - FIFO Recording & Replay (4 commits)

11. `feat(hw2): implement note event recording`
12. `feat(hw2): implement fifo sequence replay`
13. `feat(hw2): support playback speed controls`
14. `feat(hw2): implement cancellation and stop`

Deliverables:
- Recorded note events.
- FIFO replay.
- 0.5x, 1.0x, and 2.0x.
- Stop Sequence and AbortController cleanup.

#### Step 5 - Verification, Accessibility & Audit (3 commits)

15. `test(hw2): verify piano and sequencer behavior`
16. `fix(hw2): improve accessibility and responsiveness`
17. `docs(hw2): complete ai failure audit and submission`

Deliverables:
- Functional testing.
- Performance verification.
- Accessibility and responsive checks.
- AI Failure Audit with at least 3 actual documented errors.
- Final submission evidence.

**Target: 17 meaningful commits.**

This is a planning target, not a mandatory number. Adjust if necessary without creating empty or meaningless commits.

### 9. Verification Checklist

#### Step 1
- [ ] React 19 and Vite installed.
- [ ] project-rules.md created.
- [ ] TASK_DECOMPOSITION.md created.
- [ ] Lint PASS.
- [ ] Production build PASS.
- [ ] Two commits created.

#### Step 2
- [ ] 88 MIDI notes generated.
- [ ] 52 white keys, 36 black keys.
- [ ] A0 and C8 verified.
- [ ] A4 frequency equals 440 Hz.
- [ ] Keys visually positioned correctly.
- [ ] Pointer press/release works.
- [ ] Keyboard interaction works.
- [ ] No stuck keys during cancellation.
- [ ] React.memo render isolation verified.
- [ ] Responsive at 375px.

#### Step 3
- [ ] Audio plays correctly.
- [ ] Maximum eight active voices.
- [ ] Ninth voice steals oldest active voice.
- [ ] Multiple notes can play together.
- [ ] No repeated AudioContext creation.
- [ ] No double oscillator stop.
- [ ] Audio nodes cleaned up.

#### Step 4
- [ ] Recording works.
- [ ] Four required event fields are present.
- [ ] Playback works at three speeds.
- [ ] FIFO order preserved.
- [ ] Concurrent notes retain overlap.
- [ ] Stop cancels pending playback.
- [ ] Unmount cleanup verified.

#### Step 5
- [ ] Lint and production build PASS.
- [ ] Browser console has no errors.
- [ ] No React key warnings.
- [ ] React DevTools Profiler evidence.
- [ ] Accessibility checked.
- [ ] Lighthouse Accessibility evaluated.
- [ ] At least 3 real AI failures recorded with evidence.
- [ ] Git history and commit count verified.

### 10. AI Failure Audit

Document at least three real AI-assisted development failures.

For each failure, record:
- Original AI suggestion or generated code.
- Observed error or unexpected behavior.
- Supporting screenshot or terminal log.
- Root cause analysis.
- Correction applied.
- Verification after the fix.

Do not invent failures or evidence.

### 11. Development Workflow

For each step:

1. Plan.
2. Implement.
3. Verify.
4. Commit.

Each commit must contain meaningful changes and pass the relevant checks.

Do not commit unverified code.

Do not push until explicitly requested.
