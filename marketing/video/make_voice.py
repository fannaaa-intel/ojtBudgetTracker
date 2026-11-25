"""Voice-over: one clip per scene with Microsoft's neural voices (edge-tts, needs internet).

Only the voice-over lines in scenes.json are sent. Output: out/build/vo-NN.mp3
A clip is re-made only when its line or voice settings change (cached in vo-NN.txt).
Usage: python marketing/video/make_voice.py
"""
import asyncio
import json
import pathlib

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent
BUILD = ROOT / "out" / "build"


async def make_clip(text: str, cfg: dict, out: pathlib.Path) -> None:
    tmp = out.with_suffix(".part")
    for attempt in range(1, 6):
        try:
            tts = edge_tts.Communicate(text, cfg["voice"], rate=cfg["rate"], pitch=cfg["pitch"])
            await tts.save(str(tmp))
            tmp.replace(out)
            return
        except Exception as e:  # the service sometimes answers 503; wait and retry
            print(f"  retry {attempt} for {out.name}: {e.__class__.__name__}")
            await asyncio.sleep(2 * attempt)
    raise SystemExit(f"voice failed for {out.name}")


async def main() -> None:
    cfg = json.loads((ROOT / "scenes.json").read_text(encoding="utf-8"))
    BUILD.mkdir(parents=True, exist_ok=True)
    for i, scene in enumerate(cfg["scenes"]):
        out = BUILD / f"vo-{i:02d}.mp3"
        key = BUILD / f"vo-{i:02d}.txt"
        sig = f'{cfg["voice"]}|{cfg["rate"]}|{cfg["pitch"]}|{scene["vo"]}'
        if out.exists() and key.exists() and key.read_text(encoding="utf-8") == sig:
            continue
        await make_clip(scene["vo"], cfg, out)
        key.write_text(sig, encoding="utf-8")
        print("voice", out.name)


asyncio.run(main())
