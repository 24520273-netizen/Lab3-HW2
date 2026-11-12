# AI Failure Audit - Lab 03 Homework 2

## Project Information

- Project: 88-Key Polyphonic Piano & Concurrent FIFO Sequencer
- Framework: React 19 + Vite
- Language: JavaScript
- AI Tool: ChatGPT
- Verified AI Failures: 3

## Failure 1 - Incorrect ES Module Import

### AI Task
Implement PolyphonicSynth and automated tests using Node.js.

### Incorrect Code

```javascript
import { midiToFrequency } from '../utils/midi'
```

### Actual Error

```text
Error [ERR_MODULE_NOT_FOUND]:
Cannot find module .../utils/midi
```

### Root Cause
The AI-generated import omitted the `.js` extension.
Node.js ESM did not resolve the relative path, although Vite
successfully built the application.

### Correction

```javascript
import { midiToFrequency } from '../utils/midi.js'
```

### Verification
Re-run the PolyphonicSynth automated tests.

### Evidence
Terminal log showing ERR_MODULE_NOT_FOUND.

### Fix Commit
To be filled using git log.

---

## Failure 2 - Unused Variable in PianoRecorder

### AI Task
Implement recording and finalize held notes when Stop Recording is pressed.

### Incorrect Code

```javascript
for (const [midi, held] of this.held) {
```

### Actual Error

```text
PianoRecorder.js
67:17 error 'midi' is assigned a value but never used
```

### Root Cause
The AI-generated code destructured `midi` but never used it.
This violated the project's ESLint no-unused-vars rule.

### Correction

```javascript
for (const held of this.held.values()) {
```

### Verification
- Recorder tests: 3/3 PASS.
- Re-run ESLint and production build after correction.

### Evidence
Terminal log showing ESLint no-unused-vars failure.

### Fix Commit
To be filled using git log.

---

## Failure 3 - Accessibility Issues on Mobile

### AI Task
Build a responsive 88-key piano UI using CSS Modules,
supporting WCAG 2.2 AA and Lighthouse Accessibility 100.

### Observed Failure

Initial Chrome Lighthouse Accessibility score: 91/100.

Reported problems:
- Insufficient contrast ratio.
- Insufficient touch target size or spacing.

Affected elements:
- Piano keyboard description.
- Footer text.
- White and black piano keys.

### Root Cause
The initial AI-generated CSS used light text colors
and narrow touch targets.

### Correction
- Increased text contrast.
- Adjusted piano key dimensions.
- Preserved horizontal scrolling for the keyboard.

### Verification
Chrome Lighthouse Accessibility score after correction:
100/100, as confirmed by the project developer.

### Evidence
- Screenshot: Lighthouse 91/100 with failing elements.
- Screenshot: Lighthouse 100/100 after correction.

### Fix Commit
To be filled using git log.

---

## Final Summary

| Failure | Root Cause | Resolution |
|---------|------------|------------|
| ESM import | Missing .js extension | Corrected import |
| Recorder ESLint | Unused midi variable | Iterated over values |
| Accessibility | Low contrast and small targets | Updated CSS |

Verified failures: 3.

All three failures were identified during the actual
development and verification process.

## Final Requirements

- Attach original error evidence.
- Attach verification results after each fix.
- Record actual fix commit hashes.
- Do not invent error logs or screenshots.
