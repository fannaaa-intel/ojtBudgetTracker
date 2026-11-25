"""Renders the OJT Budget tutorial video (1080x1920, 30 fps) and mixes voice + music.

Monochrome motion graphics: drifting dot grid + soft glow, kinetic captions (word by word),
a floating phone whose screen cross-fades between screenshots, tap ripples, zoom callouts,
logo pulse rings and a QR end card. Needs Pillow, numpy, ffmpeg/ffprobe on PATH.

Usage:
  python render_video.py            full render -> out/ojt-budget-tutorial.mp4
  python render_video.py --stills   a few key frames -> out/still-*.png (quick check)
Run make_voice.py first (voice clips in out/build/).
"""
import json
import math
import pathlib
import subprocess
import sys

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent
REPO = ROOT.parent.parent
OUT = ROOT / "out"
BUILD = OUT / "build"
SHOTS = ROOT / "shots"

W, H, FPS = 1080, 1920, 30
# dark theme tokens (src/theme/index.ts)
BG = (10, 10, 10)
SURF = (22, 22, 22)
BORDER = (44, 44, 44)
TEXT = (245, 245, 245)
SEC = (166, 166, 166)
MUTED = (110, 110, 110)

FONTS = pathlib.Path("C:/Windows/Fonts")
F_BOLD = str(FONTS / "segoeuib.ttf")
F_SEMI = str(FONTS / "seguisb.ttf")
F_REG = str(FONTS / "segoeui.ttf")

# phone: screenshot without the status bar, inside a thin bezel
CROP_TOP = 150
SCR_H = 1340
SCR_W = round(SCR_H * 1080 / (2340 - CROP_TOP))
BEZ = 14
PH_W, PH_H = SCR_W + 2 * BEZ, SCR_H + 2 * BEZ
PH_X = (W - PH_W) // 2
PH_Y = 500

VO_DELAY = 0.3
XFADE = 0.45


# ---------- helpers ----------
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out(p):
    p = clamp(p)
    return 1 - (1 - p) ** 3


def ease_in_out(p):
    p = clamp(p)
    return 4 * p ** 3 if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2


def ease_back(p):
    p = clamp(p)
    c1 = 1.4
    return 1 + (c1 + 1) * (p - 1) ** 3 + c1 * (p - 1) ** 2


def font(path, size):
    return ImageFont.truetype(path, size)


def with_alpha(img, k):
    if k >= 0.999:
        return img
    out = img.copy()
    out.putalpha(img.getchannel("A").point(lambda v: int(v * k)))
    return out


def paste(frame, img, x, y, alpha=1.0):
    if alpha <= 0.003:
        return
    frame.alpha_composite(with_alpha(img, alpha), (int(round(x)), int(round(y))))


def rounded_mask(size, radius, scale=3):
    w, h = size
    m = Image.new("L", (w * scale, h * scale), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * scale - 1, h * scale - 1), radius * scale, fill=255)
    return m.resize(size, Image.LANCZOS)


def ring_patch(radius, width, color, alpha, scale=3):
    """Anti-aliased circle outline as an RGBA patch (centre = patch centre)."""
    r = max(1, int(radius))
    size = 2 * r + 2 * width + 4
    big = Image.new("L", (size * scale, size * scale), 0)
    c = size * scale / 2
    ImageDraw.Draw(big).ellipse((c - r * scale, c - r * scale, c + r * scale, c + r * scale),
                                outline=int(255 * alpha), width=width * scale)
    mask = big.resize((size, size), Image.LANCZOS)
    patch = Image.new("RGBA", (size, size), color + (0,))
    patch.putalpha(mask)
    return patch


def disc_patch(radius, color, alpha, scale=3):
    r = max(1, int(radius))
    size = 2 * r + 4
    big = Image.new("L", (size * scale, size * scale), 0)
    c = size * scale / 2
    ImageDraw.Draw(big).ellipse((c - r * scale, c - r * scale, c + r * scale, c + r * scale), fill=int(255 * alpha))
    patch = Image.new("RGBA", (size, size), color + (0,))
    patch.putalpha(big.resize((size, size), Image.LANCZOS))
    return patch


def paste_centered(frame, patch, cx, cy, alpha=1.0):
    paste(frame, patch, cx - patch.width / 2, cy - patch.height / 2, alpha)


def text_img(text, path, size, color, tracking=0):
    f = font(path, size)
    if tracking:
        widths = [f.getlength(ch) + tracking for ch in text]
        w = int(sum(widths)) + 4
    else:
        w = int(f.getlength(text)) + 4
    asc, desc = f.getmetrics()
    img = Image.new("RGBA", (w, asc + desc + 4), color + (0,))
    d = ImageDraw.Draw(img)
    if tracking:
        x = 0.0
        for ch, cw in zip(text, widths):
            d.text((x, 0), ch, font=f, fill=color + (255,))
            x += cw
    else:
        d.text((0, 0), text, font=f, fill=color + (255,))
    return img


def pill(text, size=30, filled=False):
    label = text_img(text.upper(), F_SEMI, size, BG if filled else SEC, tracking=3)
    w, h = label.width + 56, label.height + 26
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    big = Image.new("RGBA", (w * 3, h * 3), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    if filled:
        d.rounded_rectangle((0, 0, w * 3 - 1, h * 3 - 1), h * 3 // 2, fill=TEXT + (255,))
    else:
        d.rounded_rectangle((3, 3, w * 3 - 4, h * 3 - 4), h * 3 // 2, outline=BORDER + (255,), width=8)
    img = big.resize((w, h), Image.LANCZOS)
    img.alpha_composite(label, ((w - label.width) // 2, (h - label.height) // 2 - 2))
    return img


class Caption:
    """Word-by-word kinetic caption, centred, wrapped to max_w."""

    def __init__(self, text, size, max_w, top, emph=None):
        f = font(F_BOLD, size)
        self.words = []
        space = f.getlength(" ")
        lines, line, lw = [], [], 0.0
        for word in text.split():
            img = text_img(word, F_BOLD, size, TEXT)
            if emph and word.strip("?.,!").lower() == emph.lower():
                pad = int(size * 0.18)
                box = Image.new("RGBA", (img.width + 2 * pad, img.height + pad), (0, 0, 0, 0))
                big = Image.new("RGBA", (box.width * 3, box.height * 3), (0, 0, 0, 0))
                ImageDraw.Draw(big).rounded_rectangle((0, int(size * 0.32) * 3, box.width * 3 - 1, box.height * 3 - 1),
                                                      int(size * 0.2) * 3, fill=TEXT + (255,))
                box = big.resize(box.size, Image.LANCZOS)
                box.alpha_composite(text_img(word, F_BOLD, size, BG), (pad, int(pad * 0.4)))
                img = box
            need = img.width if not line else lw + space + img.width
            if line and need > max_w:
                lines.append((line, lw))
                line, lw = [], 0.0
                need = img.width
            line.append(img)
            lw = need
        if line:
            lines.append((line, lw))
        lh = int(size * 1.22)
        for li, (imgs, width) in enumerate(lines):
            x = (W - width) / 2
            for img in imgs:
                self.words.append((img, x, top + li * lh))
                x += img.width + space
        self.height = len(lines) * lh

    def draw(self, frame, t, t_out=None, start=0.15, stagger=0.09, dur=0.45):
        out_k = 1.0
        if t_out is not None and t > t_out:
            out_k = 1 - ease_in_out((t - t_out) / 0.35)
        for i, (img, x, y) in enumerate(self.words):
            p = ease_out((t - start - i * stagger) / dur)
            if p <= 0:
                continue
            dy = (1 - p) * 36 - (1 - out_k) * 24
            paste(frame, img, x, y + dy, p * out_k)


# ---------- assets ----------
def load_logo(size):
    # logo-mark.png is black on transparent: its alpha channel is the shape
    src = Image.open(REPO / "assets" / "brand" / "logo-mark.png").convert("RGBA")
    alpha = src.getchannel("A").resize((size, size), Image.LANCZOS)
    img = Image.new("RGBA", (size, size), TEXT + (0,))
    img.putalpha(alpha)
    return img


def phone_image(shot_file):
    src = Image.open(SHOTS / shot_file).convert("RGB")
    scr = src.crop((0, CROP_TOP, 1080, 2340)).resize((SCR_W, SCR_H), Image.LANCZOS).convert("RGBA")
    scr.putalpha(rounded_mask((SCR_W, SCR_H), 48))
    big = Image.new("RGBA", (PH_W * 3, PH_H * 3), (0, 0, 0, 0))
    ImageDraw.Draw(big).rounded_rectangle((2, 2, PH_W * 3 - 3, PH_H * 3 - 3), 62 * 3, fill=SURF + (255,),
                                          outline=BORDER + (255,), width=9)
    ph = big.resize((PH_W, PH_H), Image.LANCZOS)
    ph.alpha_composite(scr, (BEZ, BEZ))
    return ph


def to_screen(x, y):
    """Original screenshot coords (1080x2340) -> phone-relative coords."""
    return BEZ + x * SCR_W / 1080, BEZ + (y - CROP_TOP) * SCR_H / (2340 - CROP_TOP)


def callout_image(shot_file, box):
    x0, y0, x1, y1 = box
    crop = Image.open(SHOTS / shot_file).convert("RGB").crop((x0, y0, x1, y1))
    scale = min(940 / crop.width, 1.6)
    cw, ch = int(crop.width * scale), int(crop.height * scale)
    crop = crop.resize((cw, ch), Image.LANCZOS).convert("RGBA")
    crop.putalpha(rounded_mask((cw, ch), 30))
    pad = 10
    w, h = cw + 2 * pad, ch + 2 * pad
    big = Image.new("RGBA", (w * 3, h * 3), (0, 0, 0, 0))
    ImageDraw.Draw(big).rounded_rectangle((2, 2, w * 3 - 3, h * 3 - 3), 38 * 3, fill=SURF + (255,),
                                          outline=(120, 120, 120, 255), width=6)
    card = big.resize((w, h), Image.LANCZOS)
    card.alpha_composite(crop, (pad, pad))
    # soft shadow
    sh = Image.new("RGBA", (w + 120, h + 120), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((60, 75, w + 60, h + 75), 40, fill=(0, 0, 0, 200))
    sh = sh.filter(ImageFilter.GaussianBlur(26))
    sh.alpha_composite(card, (60, 60))
    return sh


def qr_card():
    qr = Image.open(ROOT / "apk-qr.png").convert("L").resize((560, 560), Image.NEAREST)
    size = 620
    big = Image.new("RGBA", (size * 3, size * 3), (0, 0, 0, 0))
    ImageDraw.Draw(big).rounded_rectangle((0, 0, size * 3 - 1, size * 3 - 1), 44 * 3, fill=(255, 255, 255, 255))
    card = big.resize((size, size), Image.LANCZOS)
    card.paste(qr.convert("RGBA"), (30, 30))
    return card


def background_layers():
    step = 54
    grid = Image.new("RGB", (W, H + step), BG)
    d = ImageDraw.Draw(grid)
    for y in range(0, H + step, step):
        for x in range(step // 2, W, step):
            d.ellipse((x - 2, y - 2, x + 2, y + 2), fill=(30, 30, 30))
    g = 1500
    yy, xx = np.mgrid[0:g, 0:g]
    r = np.sqrt((xx - g / 2) ** 2 + (yy - g / 2) ** 2) / (g / 2)
    v = np.clip(1 - r, 0, 1) ** 2.2
    glow = (BG[0] + v * 26).astype(np.uint8)
    glow_img = Image.fromarray(glow, "L").convert("RGB")
    return grid, glow_img, step


# ---------- timeline ----------
def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def tighten(src, dst):
    """Cut edge-tts' long pauses: lead silence off, every pause capped at 0.4 s."""
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return
    af = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05:"
          "stop_periods=-1:stop_duration=0.4:stop_threshold=-45dB:stop_silence=0.4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-af", af, "-ar", "44100", "-ac", "2", str(dst)],
                   check=True)


def build_timeline(cfg):
    scenes = cfg["scenes"]
    t = 0.0
    for i, s in enumerate(scenes):
        mp3 = BUILD / f"vo-{i:02d}.mp3"
        vo = BUILD / f"vo-{i:02d}.wav"
        tighten(mp3, vo)
        s["vo_file"] = vo
        s["vo_dur"] = probe(vo)
        pad = {"hook": 0.6, "brand": 0.6, "end": 2.6}.get(s["kind"], 0.15)
        s["start"] = t
        s["dur"] = max(3.0, VO_DELAY + s["vo_dur"] + pad)
        t += s["dur"]
    return scenes, t


# ---------- renderer ----------
class Renderer:
    def __init__(self, cfg):
        self.scenes, self.total = build_timeline(cfg)
        self.grid, self.glow, self.grid_step = background_layers()
        self.logo_big = load_logo(300)
        self.logo_small = load_logo(64)
        self.qr = qr_card()
        self.brand_small = text_img("OJT Budget", F_SEMI, 40, TEXT)
        self.hint = text_img(cfg.get("drive_link_hint", "Link sa group chat"), F_REG, 46, SEC)
        self.phones = {}
        self.callouts = {}
        self.tags = {}
        self.captions = []
        self.pills = {}
        for i, s in enumerate(self.scenes):
            kind = s["kind"]
            if kind == "shot":
                self.phones[i] = phone_image(s["shot"])
                if "callout" in s:
                    self.callouts[i] = callout_image(s["shot"], s["callout"])
                self.tags.setdefault(s["tag"], pill(s["tag"], 28))
                self.captions.append(Caption(s["caption"], 76, 900, 250))
            elif kind == "hook":
                self.captions.append(Caption(s["caption"], 118, 900, 760, emph="allowance"))
            elif kind == "brand":
                self.captions.append(Caption(s["caption"], 112, 900, 1080))
            else:  # end
                self.captions.append(Caption(s["caption"], 108, 900, 230))
            if "pills" in s:
                self.pills[i] = [pill(p, 30) for p in s["pills"]]
        rng = np.random.default_rng(3)
        self.particles = [dict(x=float(rng.uniform(60, W - 60)), y=float(rng.uniform(0, H)),
                               size=int(rng.uniform(56, 190)), speed=float(rng.uniform(18, 46)),
                               alpha=float(rng.uniform(0.05, 0.16)), phase=float(rng.uniform(0, 6.28)))
                          for _ in range(14)]
        self.peso = {}

    def peso_img(self, size):
        if size not in self.peso:
            self.peso[size] = text_img("\u20b1", F_BOLD, size, TEXT)
        return self.peso[size]

    def scene_at(self, t):
        for i, s in enumerate(self.scenes):
            if t < s["start"] + s["dur"]:
                return i, t - s["start"]
        return len(self.scenes) - 1, t - self.scenes[-1]["start"]

    def base(self, t):
        off = int((t * 14) % self.grid_step)
        frame = self.grid.crop((0, off, W, off + H))
        gx = int(W / 2 + 60 * math.sin(t / 6.0) - self.glow.width / 2)
        gy = int(H * 0.55 + 80 * math.cos(t / 7.5) - self.glow.height / 2)
        region = (max(gx, 0), max(gy, 0), min(gx + self.glow.width, W), min(gy + self.glow.height, H))
        sub = self.glow.crop((region[0] - gx, region[1] - gy, region[2] - gx, region[3] - gy))
        frame.paste(ImageChops.lighter(frame.crop(region), sub), region[:2])
        return frame.convert("RGBA")

    def draw_particles(self, frame, t, k):
        if k <= 0:
            return
        for p in self.particles:
            y = (p["y"] - t * p["speed"]) % (H + 300) - 150
            x = p["x"] + 18 * math.sin(t / 2.5 + p["phase"])
            paste_centered(frame, self.peso_img(p["size"]), x, y, p["alpha"] * k)

    def phone_pos(self, t):
        return PH_X, PH_Y + 7 * math.sin(2 * math.pi * t / 6.5)

    def frame(self, t):
        i, lt = self.scene_at(t)
        s = self.scenes[i]
        kind = s["kind"]
        frame = self.base(t)

        # particles: hook (full), brand (fading), elsewhere off
        if kind == "hook":
            self.draw_particles(frame, t, 1.0)
        elif kind == "brand":
            self.draw_particles(frame, t, 1 - ease_in_out((lt - s["dur"] + 1.2) / 1.2))

        t_out = s["dur"] - 0.4 if i + 1 < len(self.scenes) else None

        if kind == "brand":
            cx, cy = W / 2, 780
            k = ease_out(lt / 0.7)
            for n in range(3):  # pulse rings
                ph = ((lt + n * 0.9) % 2.7) / 2.7
                paste_centered(frame, ring_patch(190 + ph * 230, 2, TEXT, 0.35 * (1 - ph)), cx, cy, k)
            paste_centered(frame, ring_patch(190, 2, BORDER, 1.0), cx, cy, k)
            logo = self.logo_big
            sc = 0.85 + 0.15 * ease_back(lt / 0.8)
            lg = logo.resize((int(logo.width * sc), int(logo.height * sc)), Image.LANCZOS)
            out_k = 1 - ease_in_out((lt - t_out) / 0.35) if t_out and lt > t_out else 1
            paste_centered(frame, lg, cx, cy, k * out_k)
            self.captions[i].draw(frame, lt, t_out, start=0.35)
            self.draw_pills(frame, i, lt, 1290, 1.3, t_out)

        if kind == "hook":
            self.captions[i].draw(frame, lt, t_out, start=0.3, stagger=0.14, dur=0.55)

        if kind == "shot" or (kind == "end" and lt < 0.8):
            self.draw_phone(frame, i, lt, kind)

        if kind == "shot":
            self.draw_tag(frame, i, lt)
            self.draw_tap(frame, i, lt)
            self.draw_callout(frame, i, lt, t_out)
            self.captions[i].draw(frame, lt, t_out)

        if kind == "end":
            self.captions[i].draw(frame, lt, None, start=0.5)
            p = ease_back((lt - 0.7) / 0.6)
            if p > 0:
                sc = 0.8 + 0.2 * p
                qr = self.qr.resize((int(self.qr.width * sc), int(self.qr.height * sc)), Image.LANCZOS)
                paste_centered(frame, qr, W / 2, 790, clamp(p))
                ph = ((lt - 0.7) % 2.4) / 2.4
                paste_centered(frame, ring_patch(330 + ph * 120, 2, TEXT, 0.3 * (1 - ph)), W / 2, 790, clamp(p))
            paste(frame, self.hint, (W - self.hint.width) / 2, 1160 + 20 * (1 - ease_out((lt - 1.2) / 0.5)),
                  ease_out((lt - 1.2) / 0.5))
            self.draw_pills(frame, i, lt, 1290, 1.5, None)
            k = ease_out((lt - 2.0) / 0.6)
            bw = self.logo_small.width + 18 + self.brand_small.width
            bx = (W - bw) / 2
            paste(frame, self.logo_small, bx, 1690, k)
            paste(frame, self.brand_small, bx + self.logo_small.width + 18, 1690 + 4, k)

        # global fade in/out
        fade = min(ease_out(t / 0.6), clamp((self.total - t) / 1.2))
        if fade < 1:
            black = Image.new("RGBA", (W, H), (0, 0, 0, int(255 * (1 - fade))))
            frame.alpha_composite(black)
        return frame.convert("RGB")

    def draw_pills(self, frame, i, lt, y, start, t_out):
        pills = self.pills.get(i)
        if not pills:
            return
        gap = 18
        total = sum(p.width for p in pills) + gap * (len(pills) - 1)
        x = (W - total) / 2
        out_k = 1 - ease_in_out((lt - t_out) / 0.35) if t_out and lt > t_out else 1
        for n, p in enumerate(pills):
            k = ease_back((lt - start - n * 0.22) / 0.45)
            if k > 0:
                sc = 0.7 + 0.3 * k
                img = p.resize((max(1, int(p.width * sc)), max(1, int(p.height * sc))), Image.LANCZOS)
                paste_centered(frame, img, x + p.width / 2, y + p.height / 2, clamp(k) * out_k)
            x += p.width + gap

    def prev_shot(self, i):
        return i - 1 if i > 0 and self.scenes[i - 1]["kind"] == "shot" else None

    def draw_phone(self, frame, i, lt, kind):
        t_abs = self.scenes[i]["start"] + lt
        x, y = self.phone_pos(t_abs)
        if kind == "end":  # phone drops away
            p = ease_in_out(lt / 0.8)
            j = i - 1
            paste(frame, self.phones[j], x, y + p * 700, 1 - p)
            return
        prev = self.prev_shot(i)
        if prev is None:  # first shot: phone rises in
            p = ease_out(lt / 0.9)
            paste(frame, self.phones[i], x, y + (1 - p) * 420, p)
            return
        p = ease_in_out(lt / XFADE)
        if p < 1:
            img = Image.blend(self.phones[prev], self.phones[i], p)
            paste(frame, img, x, y)
        else:
            paste(frame, self.phones[i], x, y)

    def draw_tag(self, frame, i, lt):
        tag = self.scenes[i]["tag"]
        img = self.tags[tag]
        prev = self.prev_shot(i)
        same = prev is not None and self.scenes[prev]["tag"] == tag
        nxt = i + 1 < len(self.scenes) and self.scenes[i + 1].get("tag") == tag
        k = 1.0 if same else ease_out((lt - 0.05) / 0.4)
        dur = self.scenes[i]["dur"]
        if not nxt and lt > dur - 0.4:
            k *= 1 - ease_in_out((lt - dur + 0.4) / 0.35)
        paste(frame, img, (W - img.width) / 2, 150 + (1 - k) * 14, k)

    def draw_tap(self, frame, i, lt):
        s = self.scenes[i]
        if "tap" not in s:
            return
        x, y = self.phone_pos(s["start"] + lt)
        sx, sy = to_screen(*s["tap"])
        cx, cy = x + sx, y + sy
        t0 = 1.0
        d = lt - t0
        if d < 0 or d > 1.6:
            return
        dot_k = ease_out(d / 0.18) * (1 - ease_in_out((d - 1.0) / 0.5))
        paste_centered(frame, disc_patch(30, TEXT, 0.18), cx, cy, dot_k)
        paste_centered(frame, disc_patch(17, TEXT, 0.92), cx, cy, dot_k)
        for n in range(2):
            q = (d - n * 0.35) / 0.8
            if 0 < q < 1:
                paste_centered(frame, ring_patch(22 + 70 * ease_out(q), 3, TEXT, 0.8), cx, cy, 1 - q)

    def draw_callout(self, frame, i, lt, t_out):
        card = self.callouts.get(i)
        if card is None:
            return
        s = self.scenes[i]
        x, y = self.phone_pos(s["start"] + lt)
        _, top = to_screen(0, s["callout"][1])
        _, bot = to_screen(0, s["callout"][3])
        cy = y + (top + bot) / 2
        cy = clamp(cy, 480 + card.height / 2, H - 40 - card.height / 2)
        p = ease_back((lt - 1.1) / 0.5)
        if p <= 0:
            return
        k = clamp(p)
        if t_out and lt > t_out:
            k *= 1 - ease_in_out((lt - t_out) / 0.35)
        sc = 0.9 + 0.1 * p
        img = card.resize((int(card.width * sc), int(card.height * sc)), Image.LANCZOS) if sc != 1 else card
        paste_centered(frame, img, W / 2, cy, k)


def render(stills=False, remix=False):
    cfg = json.loads((ROOT / "scenes.json").read_text(encoding="utf-8"))
    r = Renderer(cfg)
    OUT.mkdir(exist_ok=True)
    print(f"timeline {r.total:.1f} s, {len(r.scenes)} scenes")
    if stills:
        picks = []
        for i, s in enumerate(r.scenes):
            picks.append((f"still-{i:02d}", s["start"] + min(s["dur"] - 0.5, 1.6 if s["kind"] == "shot" else 2.6)))
        for name, t in picks:
            r.frame(t).save(OUT / f"{name}.png")
        print("stills written")
        return
    video = BUILD / "video.mp4"
    if remix and video.exists():
        mix(r, video)
        return
    n = int(math.ceil(r.total * FPS))
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "18",
                           "-pix_fmt", "yuv420p", str(video)], stdin=subprocess.PIPE)
    for f in range(n):
        ff.stdin.write(r.frame(f / FPS).tobytes())
        if f % 150 == 0:
            print(f"frame {f}/{n}", flush=True)
    ff.stdin.close()
    if ff.wait() != 0:
        raise SystemExit("ffmpeg video encode failed")
    mix(r, video)


def mix(r, video):
    # music bed, length of the video
    music = BUILD / "music.wav"
    subprocess.run([sys.executable, str(ROOT / "make_music.py"), f"{r.total:.2f}", str(music)], check=True)

    # mix: voice clips at their scene starts, music ducked under the voice
    inputs = ["-i", str(video), "-i", str(music)]
    parts = []
    for k, s in enumerate(r.scenes):
        inputs += ["-i", str(s["vo_file"])]
        ms = int((s["start"] + VO_DELAY) * 1000)
        parts.append(f"[{k + 2}:a]aresample=44100,aformat=channel_layouts=stereo,adelay={ms}|{ms}[v{k}]")
    vo_labels = "".join(f"[v{k}]" for k in range(len(r.scenes)))
    graph = ";".join(parts + [
        # pad the voice to the full length, or the ducker (and -shortest) cut the end card
        f"{vo_labels}amix=inputs={len(r.scenes)}:normalize=0,apad=whole_dur={r.total:.3f}[vo]",
        "[vo]asplit[vo1][vo2]",
        "[1:a]volume=0.16[m]",  # bed ~6 dB under the voice, ducked further while she talks
        "[m][vo1]sidechaincompress=threshold=0.02:ratio=5:attack=30:release=600[md]",
        "[md][vo2]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]",
    ])
    final = OUT / "ojt-budget-tutorial.mp4"
    subprocess.run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", graph, "-map", "0:v", "-map", "[a]",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-shortest",
                    "-movflags", "+faststart", str(final)], check=True)
    print(f"done {final} ({r.total:.1f} s)")


if __name__ == "__main__":
    render(stills="--stills" in sys.argv, remix="--remix" in sys.argv)
