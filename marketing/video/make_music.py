"""Original chill lo-fi bed for the tutorial video (no samples, no licences).

Soft electric-piano chords, round bass, swung hats, soft kick/snare, vinyl crackle,
all low-passed so it sits under the voice. Deterministic (fixed seed).
Usage: python make_music.py <seconds> <out.wav>
"""
import sys
import wave

import numpy as np

SR = 44100
BPM = 76
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)

# Fmaj9 -> Em7 -> Dm9 -> Cmaj7(add9): (bass, chord notes) as MIDI numbers
PROG = [
    (41, [57, 60, 64, 67, 69]),
    (40, [55, 59, 62, 64, 67]),
    (38, [57, 60, 62, 64, 65]),
    (36, [55, 59, 62, 64, 67]),
]
PENTA = [72, 74, 76, 79, 81, 84]  # C major pentatonic, high and soft


def hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def lowpass(x: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    spec = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(x.shape[0], 1 / SR)
    resp = 1 / np.sqrt(1 + (f / cutoff) ** (2 * order))
    if x.ndim == 2:
        resp = resp[:, None]
    return np.fft.irfft(spec * resp, n=x.shape[0], axis=0)


def ep_note(freq: float, dur: float, vel: float, detune: float = 0.0) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = freq * 2 ** (detune / 1200)
    tone = (np.sin(2 * np.pi * f * t)
            + 0.30 * np.sin(2 * np.pi * 2 * f * t)
            + 0.08 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.25)
            + 0.04 * np.sin(2 * np.pi * 7 * f * t) * np.exp(-t / 0.05))  # tine "tick"
    env = np.minimum(t / 0.008, 1) * np.exp(-t / 1.9)
    trem = 1 + 0.12 * np.sin(2 * np.pi * 4.2 * t)
    return vel * tone * env * trem


def add(buf: np.ndarray, sig: np.ndarray, start: float, pan: float = 0.0) -> None:
    i = int(start * SR)
    if i >= buf.shape[0]:
        return
    sig = sig[: buf.shape[0] - i]
    buf[i:i + len(sig), 0] += sig * (1 - max(pan, 0))
    buf[i:i + len(sig), 1] += sig * (1 + min(pan, 0))


def kick() -> np.ndarray:
    t = np.arange(int(0.35 * SR)) / SR
    f = 45 + 75 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)


def snare() -> np.ndarray:
    t = np.arange(int(0.25 * SR)) / SR
    noise = lowpass(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.07)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05)
    return 0.5 * noise + 0.35 * body


def hat() -> np.ndarray:
    t = np.arange(int(0.06 * SR)) / SR
    n = rng.standard_normal(len(t))
    n = n - lowpass(n, 6000)  # keep the top
    return n * np.exp(-t / 0.018)


def make(seconds: float, out: str) -> None:
    n = int(seconds * SR)
    music = np.zeros((n, 2))
    drums = np.zeros((n, 2))
    k, s = kick(), snare()
    swing = 0.11 * BEAT
    bars = int(seconds / BAR) + 1
    for b in range(bars):
        t0 = b * BAR
        bass, chord = PROG[b % len(PROG)]
        # chords: downbeat + a softer push on the "and" of 2
        for hit, vel in ((0.0, 0.16), (1.5 * BEAT + swing, 0.09)):
            for j, m in enumerate(chord):
                strum = j * 0.014
                add(music, ep_note(hz(m), BAR, vel, -4), t0 + hit + strum, -0.35)
                add(music, ep_note(hz(m), BAR, vel, +4), t0 + hit + strum + 0.006, 0.35)
        # bass: root on 1, fifth-ish pickup on 3.5
        add(music, ep_note(hz(bass + 12), 1.8 * BEAT, 0.30), t0)
        add(music, ep_note(hz(bass + 12), 1.2 * BEAT, 0.18), t0 + 2.5 * BEAT + swing)
        # sparse melody every other bar
        if b % 2 == 1:
            for q in sorted(rng.choice(8, size=3, replace=False)):
                when = t0 + q * BEAT / 2 + (swing if q % 2 else 0)
                add(music, ep_note(hz(int(rng.choice(PENTA))), 1.2, 0.05), when, float(rng.uniform(-0.4, 0.4)))
        # drums (start after the first two bars so the intro breathes)
        if b >= 2:
            for beat in (0, 2):
                add(drums, k * 0.55, t0 + beat * BEAT)
            if b % 4 == 3:
                add(drums, k * 0.35, t0 + 2.5 * BEAT + swing)
            for beat in (1, 3):
                add(drums, s * 0.22, t0 + beat * BEAT + 0.01)
            for e in range(8):
                when = t0 + e * BEAT / 2 + (swing if e % 2 else 0)
                add(drums, hat() * (0.05 if e % 2 else 0.08), when, 0.2)

    # duck the chords a little on every kick (gentle pump)
    t = np.arange(n) / SR
    since = np.mod(t, 2 * BEAT)
    music *= (1 - 0.18 * np.exp(-since / 0.18))[:, None]

    mix = lowpass(music, 2600) + lowpass(drums, 5000)
    # vinyl: soft hiss + crackle
    hiss = lowpass(rng.standard_normal((n, 2)), 3000) * 0.004
    crackle = np.zeros((n, 2))
    pops = rng.integers(0, n, size=int(seconds * 6))
    crackle[pops, rng.integers(0, 2, size=len(pops))] = rng.uniform(0.02, 0.08, size=len(pops))
    mix += hiss + lowpass(crackle, 4000)
    # fades + normalise
    fade_in = np.minimum(t / 2.5, 1)
    fade_out = np.clip((seconds - t) / 3.5, 0, 1)
    mix *= (fade_in * fade_out)[:, None]
    mix /= np.max(np.abs(mix)) / 0.89
    pcm = (mix * 32767).astype(np.int16)
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    make(float(sys.argv[1]), sys.argv[2])
    print("music", sys.argv[2])
