"""
Creates 3 high-quality mockup images for BEBO the PET pitch deck:
  1. bebo-pet-on-desktop.png  — desktop with BEBO in bottom-right corner
  2. bebo-panel-open.png      — desktop with BEBO + assistant panel open
  3. bebo-ai-result.png       — close-up panel showing an AI output result
"""

from PIL import Image, ImageDraw, ImageFont
import math, os

OUT = os.path.dirname(os.path.abspath(__file__))
W, H = 1280, 720   # mock desktop resolution

# ─── Color palette ────────────────────────────────────────────────────────────
BG_DARK  = (18, 19, 31)          # #12131f
PURPLE   = (124, 92, 252)        # #7c5cfc
PURPLE_L = (167, 139, 250)       # #a78bfa
TEXT_W   = (238, 242, 255)       # #eef2ff
TEXT_DIM = (148, 163, 184)       # #94a3b8
CARD_BG  = (15, 23, 42, 180)     # rgba dark card
BORDER   = (167, 139, 250, 60)   # rgba purple border

# BEBO pet colors
BEBO_BODY_T = (255, 255, 255)
BEBO_BODY_B = (143, 215, 255)
BEBO_VISOR  = (7, 20, 33)
BEBO_EYE    = (82, 220, 255)
BEBO_ANT    = (100, 180, 255)
BEBO_CHEEK  = (255, 182, 193, 120)


# ─── Helper: draw BEBO robot at (cx, cy) with given scale ─────────────────────
def draw_bebo(draw: ImageDraw.ImageDraw, cx: int, cy: int, scale: float = 1.0, img: Image.Image = None):
    """Draw the BEBO robot character centered at (cx, cy)."""
    s = scale

    def p(x, y):
        return (int(cx + (x - 60) * s), int(cy + (y - 68) * s))

    def sz(v):
        return max(1, int(v * s))

    # Shadow
    draw.ellipse([p(32, 124), p(88, 130)], fill=(0, 0, 0, 60))

    # Body / torso (gradient-like via stacked ellipses)
    # torso
    body_pts = [p(39, 76), p(43, 68), p(77, 68), p(81, 76), p(86, 105), p(79, 116), p(42, 116), p(35, 105)]
    draw.polygon(body_pts, fill=BEBO_BODY_B, outline=None)

    # Arms
    for ax, ay, bx, by, cx2, cy2 in [
        (34, 78, 22, 91, 22, 101),
        (86, 78, 98, 91, 98, 101),
    ]:
        draw.line([p(ax, ay), p(bx, by), p(cx2, cy2)], fill=BEBO_BODY_T, width=sz(6))

    # Hands
    for hx, hy in [(22, 101), (98, 101)]:
        r = sz(6)
        px, py = p(hx, hy)
        draw.ellipse([px - r, py - r, px + r, py + r], fill=BEBO_BODY_T)

    # Legs
    for lx, ly, fx, fy in [(48, 111, 43, 123), (72, 111, 77, 123)]:
        draw.line([p(lx, ly), p(fx, fy)], fill=BEBO_BODY_T, width=sz(5))

    # Feet
    for pts in [
        [p(33, 123), p(51, 116), p(55, 124), p(50, 130), p(33, 130)],
        [p(65, 124), p(69, 116), p(87, 123), p(81, 130), p(65, 130)],
    ]:
        draw.polygon(pts, fill=BEBO_BODY_B)

    # Core (chest panel)
    core_tl = p(51, 84)
    core_br = p(69, 99)
    draw.rounded_rectangle([core_tl, core_br], radius=sz(5), fill=(30, 50, 80))
    # Core pulse dot
    px2, py2 = p(60, 91)
    r2 = sz(3)
    draw.ellipse([px2 - r2, py2 - r2, px2 + r2, py2 + r2], fill=BEBO_EYE)

    # Ears
    for ex, ey in [(25, 51), (95, 51)]:
        px3, py3 = p(ex, ey)
        r3 = sz(11)
        draw.ellipse([px3 - r3, py3 - r3, px3 + r3, py3 + r3], fill=BEBO_BODY_T)

    # Head
    head_pts = [p(29, 26), p(36, 17), p(84, 17), p(91, 26),
                p(98, 34), p(98, 67), p(91, 75), p(83, 84),
                p(37, 84), p(29, 75), p(22, 67), p(22, 34)]
    draw.polygon(head_pts, fill=BEBO_BODY_T)

    # Gradient effect on head (light top)
    draw.polygon([p(36, 17), p(84, 17), p(91, 26), p(29, 26)], fill=(220, 240, 255))

    # Visor
    visor_tl = p(31, 38)
    visor_br = p(89, 66)
    draw.rounded_rectangle([visor_tl, visor_br], radius=sz(14), fill=BEBO_VISOR)

    # Eyes
    for ex2, ey2 in [(48, 52), (72, 52)]:
        px4, py4 = p(ex2, ey2)
        # eye ring
        r4 = sz(8)
        draw.ellipse([px4 - r4, py4 - r4, px4 + r4, py4 + r4], fill=BEBO_EYE)
        # pupil
        r5 = sz(3)
        draw.ellipse([px4 - r5, py4 - r5, px4 + r5, py4 + r5], fill=(5, 50, 120))
        # shine
        r6 = sz(2)
        draw.ellipse([px4 - r5 + r6, py4 - r5, px4 - r5 + r6 + r6, py4 - r5 + r6], fill=(255, 255, 255))

    # Smile
    draw.arc([p(50, 55), p(72, 68)], start=10, end=170, fill=(80, 160, 200), width=sz(2))

    # Antennas
    for ax2, ay2, bx2, by2, tx, ty in [
        (39, 26, 34, 8, 33, 6),
        (81, 26, 86, 8, 87, 6),
    ]:
        draw.line([p(ax2, ay2), p(bx2, by2)], fill=BEBO_ANT, width=sz(2))
        px5, py5 = p(tx, ty)
        r7 = sz(4)
        draw.ellipse([px5 - r7, py5 - r7, px5 + r7, py5 + r7], fill=BEBO_ANT)

    # Status lights on forehead
    for lx2, ly2, col in [(52, 31, (80, 255, 140)), (60, 30, BEBO_EYE), (68, 31, (255, 180, 80))]:
        px6, py6 = p(lx2, ly2)
        r8 = sz(2)
        draw.ellipse([px6 - r8, py6 - r8, px6 + r8, py6 + r8], fill=col)

    # Blush cheeks
    if img:
        cheek = Image.new("RGBA", img.size, (0, 0, 0, 0))
        cd = ImageDraw.Draw(cheek)
        for chx, chy in [(39, 58), (81, 58)]:
            px7, py7 = p(chx, chy)
            r9 = sz(5)
            cd.ellipse([px7 - r9, py7 - r9, px7 + r9, py7 + r9], fill=(255, 130, 150, 80))
        img.paste(cheek, mask=cheek)


def try_font(size):
    """Try to load a system font, fall back to default."""
    for name in [
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/calibri.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            pass
    return ImageFont.load_default()


def try_font_bold(size):
    for name in [
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/calibrib.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
    ]:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            pass
    return try_font(size)


# ─── Desktop wallpaper gradient ───────────────────────────────────────────────
def make_wallpaper(w, h):
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)
    # Deep blue-purple gradient, subtle noise-free
    for y in range(h):
        t = y / h
        r = int(10 + 25 * (1 - t))
        g = int(8 + 15 * (1 - t))
        b = int(35 + 50 * (1 - t))
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Subtle radial glow bottom-right (contained within canvas)
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(80, 0, -1):
        alpha = int(15 * (1 - i / 80))
        gd.ellipse([w - 160 + i, h - 160 + i, w - i, h - i],
                   fill=(124, 92, 252, alpha))
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, glow)
    return img.convert("RGB")


# ─── Taskbar ──────────────────────────────────────────────────────────────────
def draw_taskbar(draw, img, w, h):
    bar_h = 40
    # dark translucent bar
    bar = Image.new("RGBA", (w, bar_h), (10, 10, 20, 220))
    img.paste(Image.new("RGB", (w, bar_h), (12, 13, 28)), (0, h - bar_h))

    f = try_font(12)
    # clock
    draw.text((w - 60, h - 28), "10:42", font=f, fill=TEXT_DIM)
    draw.text((w - 60, h - 14), "14 May", font=f, fill=TEXT_DIM)

    # taskbar icons (simple dots)
    for i, col in enumerate([(255, 255, 255), BEBO_EYE, PURPLE_L]):
        x = 20 + i * 48
        draw.ellipse([x, h - 28, x + 14, h - 14], fill=col)


# ─── Draw panel UI ────────────────────────────────────────────────────────────
def draw_panel(draw, img, px, py, pw=380, ph=620, show_output=True, output_text=None):
    """Draw the BEBO assistant panel at (px, py) with given dimensions."""
    fb = try_font(11)
    fm = try_font(13)
    fb2 = try_font_bold(13)
    fh = try_font_bold(20)
    fey = try_font_bold(10)

    # Panel background
    panel_bg = Image.new("RGBA", (pw, ph), (18, 19, 31, 245))
    pd = ImageDraw.Draw(panel_bg)

    # Top gradient tint
    for y in range(min(ph // 3, 200)):
        alpha = int(30 * (1 - y / 200))
        pd.line([(0, y), (pw, y)], fill=(124, 92, 252, alpha))

    # Border
    pd.rectangle([0, 0, pw - 1, ph - 1], outline=(124, 92, 252, 80), width=1)

    # Header
    pd.text((18, 16), "BEBO THE PET", font=fey, fill=PURPLE_L)
    pd.text((18, 32), "BEBO Assistant", font=fh, fill=TEXT_W)

    # Close button
    pd.rounded_rectangle([pw - 50, 14, pw - 16, 48], radius=8,
                          fill=(40, 42, 60), outline=(80, 80, 100, 80))
    pd.text((pw - 36, 18), "×", font=try_font(22), fill=TEXT_DIM)

    # Action buttons grid
    btn_labels = ["Summarize", "Humanize", "Simplify", "Draft Email", "Fix Grammar", "Ask AI"]
    btn_y = 70
    for i, label in enumerate(btn_labels):
        col = i % 2
        row = i // 2
        bx = 18 + col * (pw // 2 - 22)
        by = btn_y + row * 50
        bw = pw // 2 - 26
        bh = 42
        pd.rounded_rectangle([bx, by, bx + bw, by + bh], radius=8,
                              fill=(40, 25, 90, 200), outline=(124, 92, 252, 80))
        # center text
        tw = pd.textlength(label, font=fm)
        pd.text((bx + (bw - tw) // 2, by + 14), label, font=fm, fill=(240, 240, 255))

    # Input section
    inp_y = btn_y + 3 * 50 + 14
    pd.text((18, inp_y), "INPUT", font=fey, fill=TEXT_DIM)
    inp_box_y = inp_y + 16
    inp_h = 100
    pd.rounded_rectangle([18, inp_box_y, pw - 18, inp_box_y + inp_h], radius=8,
                          fill=(10, 18, 36, 200), outline=(80, 90, 110, 80))
    sample_input = "The company reported a 42% increase in\nrevenue this quarter, driven by strong\ngrowth in the Asia-Pacific region..."
    pd.text((28, inp_box_y + 10), sample_input, font=fm, fill=(160, 175, 200))

    # Output section
    out_y = inp_box_y + inp_h + 14
    # label row
    pd.text((18, out_y), "OUTPUT", font=fey, fill=TEXT_DIM)
    pd.rounded_rectangle([pw - 80, out_y - 2, pw - 18, out_y + 14], radius=6,
                          fill=(40, 25, 90, 200), outline=(124, 92, 252, 80))
    pd.text((pw - 70, out_y), "Copy", font=fey, fill=TEXT_W)

    out_box_y = out_y + 18
    out_h = ph - out_box_y - 30
    pd.rounded_rectangle([18, out_box_y, pw - 18, out_box_y + out_h], radius=8,
                          fill=(10, 18, 36, 200), outline=(80, 90, 110, 80))

    if show_output and output_text:
        lines = output_text.split("\n")
        for i2, line in enumerate(lines[:12]):
            pd.text((28, out_box_y + 10 + i2 * 18), line, font=fm, fill=(200, 215, 240))

    # Footer
    pd.text((18, ph - 18), "Ctrl+Shift+P opens this panel", font=fey, fill=(80, 90, 110))

    # Composite panel onto image
    if img.mode != "RGBA":
        img_rgba = img.convert("RGBA")
    else:
        img_rgba = img.copy()

    # Shadow under panel
    shadow = Image.new("RGBA", (pw + 20, ph + 20), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([10, 10, pw + 10, ph + 10], radius=16, fill=(0, 0, 0, 80))
    img_rgba.paste(shadow, (px - 10, py - 10), shadow)

    img_rgba.paste(panel_bg, (px, py), panel_bg)
    return img_rgba.convert("RGB")


# ─── Image 1: Desktop with BEBO pet in bottom-right corner ───────────────────
def make_img1():
    img = make_wallpaper(W, H)
    draw = ImageDraw.Draw(img)
    draw_taskbar(draw, img, W, H)

    # Desktop icons (left side)
    ficon = try_font(10)
    icons = [("This PC", 20), ("Recycle Bin", 60), ("Chrome", 100), ("VS Code", 140)]
    for name, iy in icons:
        draw.rectangle([10, iy, 42, iy + 32], fill=(40, 50, 70, 150), outline=(80, 100, 130, 100))
        draw.text((5, iy + 34), name, font=ficon, fill=TEXT_DIM)

    # BEBO pet — bottom right, above taskbar
    bebo_cx = W - 75
    bebo_cy = H - 40 - 70   # above taskbar
    img_rgba = img.convert("RGBA")
    bebo_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bebo_layer)
    draw_bebo(bd, bebo_cx, bebo_cy, scale=0.9, img=bebo_layer)
    img_final = Image.alpha_composite(img_rgba, bebo_layer).convert("RGB")

    # Speech bubble above BEBO
    bubble_draw = ImageDraw.Draw(img_final)
    bx, by = bebo_cx - 90, bebo_cy - 100
    bubble_draw.rounded_rectangle([bx, by, bx + 90, by + 28], radius=8,
                                   fill=(30, 35, 55), outline=PURPLE_L)
    fb = try_font(11)
    bubble_draw.text((bx + 8, by + 8), "Hello! 👋 Click me!", font=fb, fill=TEXT_W)
    # bubble tail
    bubble_draw.polygon([(bx + 70, by + 28), (bebo_cx - 10, beby := bebo_cy - 72), (bx + 50, by + 28)],
                        fill=(30, 35, 55))

    img_final.save(os.path.join(OUT, "bebo-pet-on-desktop.png"))
    print("✓ bebo-pet-on-desktop.png")
    return img_final


# ─── Image 2: BEBO + Panel open ───────────────────────────────────────────────
def make_img2():
    img = make_wallpaper(W, H)
    draw = ImageDraw.Draw(img)
    draw_taskbar(draw, img, W, H)

    # BEBO pet — bottom right
    bebo_cx = W - 75
    bebo_cy = H - 40 - 70
    img_rgba = img.convert("RGBA")
    bebo_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bebo_layer)
    draw_bebo(bd, bebo_cx, bebo_cy, scale=0.9, img=bebo_layer)
    img_mid = Image.alpha_composite(img_rgba, bebo_layer).convert("RGB")

    # Speech bubble
    bdraw = ImageDraw.Draw(img_mid)
    bx2 = bebo_cx - 80
    by2 = bebo_cy - 95
    bdraw.rounded_rectangle([bx2, by2, bx2 + 80, by2 + 25], radius=8,
                              fill=(30, 35, 55), outline=PURPLE_L)
    fb2 = try_font(10)
    bdraw.text((bx2 + 8, by2 + 7), "Working... ⚙️", font=fb2, fill=TEXT_W)

    # Panel — to the left of BEBO
    panel_w, panel_h = 380, 580
    panel_x = bebo_cx - 95 - panel_w
    panel_y = H - 40 - panel_h - 10

    output_text = (
        "Revenue up 42% driven by Asia-Pacific\n"
        "growth — strongest quarter in 3 years.\n"
        "\n"
        "Key points:\n"
        "Strong APAC expansion led growth\n"
        "Operating margins improved to 28%\n"
        "New product lines exceeded targets\n"
        "Customer retention reached 94%\n"
        "\n"
        "Implication: Board likely to approve\n"
        "increased investment in APAC markets."
    )

    img_mid = draw_panel(bdraw, img_mid, panel_x, panel_y, panel_w, panel_h,
                         show_output=True, output_text=output_text)

    img_mid.save(os.path.join(OUT, "bebo-panel-open.png"))
    print("✓ bebo-panel-open.png")
    return img_mid


# ─── Image 3: Close-up of panel with AI output ────────────────────────────────
def make_img3():
    pw, ph = 420, 660
    img = Image.new("RGB", (pw + 60, ph + 60), BG_DARK)
    draw = ImageDraw.Draw(img)

    # No extra glow — clean dark background is enough

    output_text = (
        "Revenue up 42% driven by Asia-Pacific growth —\n"
        "the strongest quarter in three years.\n"
        "\n"
        "APAC expansion led overall revenue increase\n"
        "Operating margins improved sharply to 28%\n"
        "New product lines exceeded all sales targets\n"
        "Customer retention rate reached a record 94%\n"
        "Board confidence in growth trajectory is high\n"
        "\n"
        "Implication: Increased investment in APAC is\n"
        "likely to be approved at the next board review."
    )

    img = draw_panel(draw, img, 30, 30, pw, ph, show_output=True, output_text=output_text)
    img.save(os.path.join(OUT, "bebo-ai-output.png"))
    print("✓ bebo-ai-output.png")
    return img


# ─── Run all ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    make_img1()
    make_img2()
    make_img3()
    print("\nAll mockup images generated successfully.")
