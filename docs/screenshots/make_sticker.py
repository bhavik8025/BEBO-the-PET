"""
Creates a WhatsApp-ready BEBO sticker:
  - 512x512 pixels, transparent background
  - BEBO robot character + "BEBO" name label
  - Saved as WebP (required by WhatsApp)
"""

from PIL import Image, ImageDraw, ImageFont
import os, math

OUT = os.path.dirname(os.path.abspath(__file__))
SIZE = 512

# Colors
BEBO_BODY_TOP  = (220, 240, 255)
BEBO_BODY_BOT  = (130, 205, 255)
BEBO_VISOR     = (8, 18, 35)
BEBO_EYE_GLOW  = (72, 215, 255)
BEBO_EYE_DARK  = (5, 40, 110)
BEBO_ANT_COLOR = (90, 170, 255)
BEBO_SHADOW    = (60, 30, 140, 50)
PURPLE         = (124, 92, 252)
PURPLE_L       = (167, 139, 250)
WHITE          = (255, 255, 255)
TEXT_W         = (238, 242, 255)

def font(size, bold=False):
    candidates = []
    if bold:
        candidates = [
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/calibrib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/impact.ttf",
        ]
    else:
        candidates = [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/calibri.ttf",
            "C:/Windows/Fonts/arial.ttf",
        ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    return ImageFont.load_default()


def draw_bebo_sticker():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # ── Scale / center the robot ──────────────────────────────────────────────
    # SVG viewBox is 120x136. We'll draw the bot at scale=3.2 centered in 512x512
    # but shifted up to leave room for "BEBO" label at bottom
    scale = 3.2
    cx = 256          # horizontal center
    cy = 195          # vertical center of robot body (shifted up)

    def p(x, y):
        """Map SVG coordinate to canvas pixel."""
        return (int(cx + (x - 60) * scale), int(cy + (y - 68) * scale))

    def r(v):
        return max(1, int(v * scale))

    # ── Drop shadow ───────────────────────────────────────────────────────────
    shadow_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow_layer)
    for i in range(20, 0, -1):
        a = int(60 * (1 - i / 20))
        sw = int(100 * scale / 4) + i * 3
        sh = int(10 * scale / 4) + i
        sx, sy = p(60, 127)
        sd.ellipse([sx - sw // 2, sy - sh // 2, sx + sw // 2, sy + sh // 2],
                   fill=(40, 0, 80, a))
    img = Image.alpha_composite(img, shadow_layer)
    d = ImageDraw.Draw(img)

    # ── Outer glow (purple halo behind character) ──────────────────────────────
    glow_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow_layer)
    for i in range(60, 0, -1):
        a = int(18 * (1 - i / 60))
        gr = int(160 + i * 1.5)
        gd.ellipse([cx - gr, cy - gr + 10, cx + gr, cy + gr + 10],
                   fill=(*PURPLE, a))
    img = Image.alpha_composite(img, glow_layer)
    d = ImageDraw.Draw(img)

    # ── Torso ─────────────────────────────────────────────────────────────────
    torso_pts = [p(39,76), p(43,68), p(77,68), p(81,76), p(86,105), p(79,116), p(42,116), p(35,105)]
    d.polygon(torso_pts, fill=(*BEBO_BODY_BOT, 255))
    # lighter torso top
    torso_top = [p(43,68), p(77,68), p(81,76), p(39,76)]
    d.polygon(torso_top, fill=(*BEBO_BODY_TOP, 255))

    # ── Arms ──────────────────────────────────────────────────────────────────
    for ax, ay, bx2, by2 in [(34,78,22,101), (86,78,98,101)]:
        d.line([p(ax,ay), p(bx2,by2)], fill=(*BEBO_BODY_TOP, 255), width=r(7))
    # Hands
    for hx, hy in [(22,101),(98,101)]:
        px, py = p(hx, hy)
        rv = r(7)
        d.ellipse([px-rv, py-rv, px+rv, py+rv], fill=(*BEBO_BODY_TOP, 255))
        # hand highlight
        rv2 = r(3)
        d.ellipse([px-rv2, py-rv2-r(2), px+rv2, py-r(2)], fill=(240,250,255,180))

    # ── Legs ──────────────────────────────────────────────────────────────────
    for lx, ly, fx, fy in [(48,111,43,123),(72,111,77,123)]:
        d.line([p(lx,ly), p(fx,fy)], fill=(*BEBO_BODY_TOP, 255), width=r(6))
    # Feet
    for foot_pts in [
        [p(33,123), p(51,116), p(55,124), p(50,130), p(33,130)],
        [p(65,124), p(69,116), p(87,123), p(81,130), p(65,130)],
    ]:
        d.polygon(foot_pts, fill=(*BEBO_BODY_BOT, 255))
        d.polygon(foot_pts, outline=(*BEBO_BODY_TOP, 120), width=1)

    # ── Chest core panel ──────────────────────────────────────────────────────
    ctlx, ctly = p(51,84)
    cbrx, cbry = p(69,99)
    d.rounded_rectangle([ctlx, ctly, cbrx, cbry], radius=r(5), fill=(20, 40, 80, 255))
    # Pulsing dot
    px2, py2 = p(60, 91)
    for ri, alpha in [(r(5),30),(r(4),60),(r(3),200)]:
        d.ellipse([px2-ri, py2-ri, px2+ri, py2+ri], fill=(*BEBO_EYE_GLOW, alpha))
    # Core shine lines
    d.line([p(54,105), p(67,105)], fill=(*BEBO_EYE_GLOW, 100), width=r(1))

    # ── Ears ──────────────────────────────────────────────────────────────────
    for ex, ey in [(25,51),(95,51)]:
        px3, py3 = p(ex, ey)
        rv3 = r(11)
        d.ellipse([px3-rv3, py3-rv3, px3+rv3, py3+rv3], fill=(*BEBO_BODY_TOP, 255))
        d.ellipse([px3-rv3+r(2), py3-rv3+r(2), px3+rv3-r(2), py3+rv3-r(2)],
                  fill=(200, 225, 245, 255))

    # ── Head ──────────────────────────────────────────────────────────────────
    head_pts = [p(29,26), p(36,17), p(84,17), p(91,26),
                p(98,34), p(98,67), p(91,75), p(83,84),
                p(37,84), p(29,75), p(22,67), p(22,34)]
    d.polygon(head_pts, fill=(*BEBO_BODY_TOP, 255))

    # Head gradient top highlight
    head_top = [p(36,17), p(84,17), p(91,26), p(75,22), p(45,22), p(29,26)]
    d.polygon(head_top, fill=(245, 252, 255, 220))

    # Head side sheen
    d.arc([p(24,30), p(36,60)], start=200, end=310, fill=(255,255,255,80), width=r(2))

    # ── Visor (face screen) ────────────────────────────────────────────────────
    vtlx, vtly = p(31,38)
    vbrx, vbry = p(89,66)
    d.rounded_rectangle([vtlx, vtly, vbrx, vbry], radius=r(14), fill=(*BEBO_VISOR, 255))
    # Visor inner glow top
    d.rounded_rectangle([vtlx+r(2), vtly+r(2), vbrx-r(2), vtly+r(8)],
                        radius=r(5), fill=(30, 60, 100, 120))

    # ── Eyes ──────────────────────────────────────────────────────────────────
    for ex2, ey2 in [(48,52),(72,52)]:
        px4, py4 = p(ex2, ey2)
        # Outer glow
        for ri2, a2 in [(r(12),15),(r(10),30),(r(9),60)]:
            d.ellipse([px4-ri2, py4-ri2, px4+ri2, py4+ri2],
                      fill=(*BEBO_EYE_GLOW, a2))
        # Iris
        ri3 = r(8)
        d.ellipse([px4-ri3, py4-ri3, px4+ri3, py4+ri3], fill=(*BEBO_EYE_GLOW, 255))
        # Pupil
        ri4 = r(4)
        d.ellipse([px4-ri4, py4-ri4, px4+ri4, py4+ri4], fill=(*BEBO_EYE_DARK, 255))
        # Shine dot
        ri5 = r(2)
        d.ellipse([px4-ri4+ri5, py4-ri4, px4-ri4+ri5*3, py4-ri4+ri5*2],
                  fill=(255,255,255,230))

    # ── Smile ─────────────────────────────────────────────────────────────────
    d.arc([p(50,56), p(72,70)], start=15, end=165, fill=(*BEBO_EYE_GLOW, 200), width=r(2))

    # ── Blush cheeks ──────────────────────────────────────────────────────────
    cheek_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cheek_layer)
    for chx, chy in [(39,60),(81,60)]:
        px5, py5 = p(chx, chy)
        rc = r(6)
        cd.ellipse([px5-rc, py5-rc, px5+rc, py5+rc], fill=(255, 120, 150, 90))
    img = Image.alpha_composite(img, cheek_layer)
    d = ImageDraw.Draw(img)

    # ── Forehead status lights ────────────────────────────────────────────────
    for lx2, ly2, col in [(52,31,(80,255,140)), (60,30,BEBO_EYE_GLOW), (68,31,(255,170,70))]:
        px6, py6 = p(lx2, ly2)
        rl = r(2)
        # Glow
        d.ellipse([px6-rl*2, py6-rl*2, px6+rl*2, py6+rl*2], fill=(*col, 40))
        d.ellipse([px6-rl, py6-rl, px6+rl, py6+rl], fill=(*col, 255))

    # ── Antennas ──────────────────────────────────────────────────────────────
    for ax3, ay3, tx2, ty2 in [(39,26,33,6),(81,26,87,6)]:
        d.line([p(ax3,ay3), p(tx2,ty2)], fill=(*BEBO_ANT_COLOR, 255), width=r(2))
        px7, py7 = p(tx2, ty2)
        ra = r(5)
        # Antenna glow
        d.ellipse([px7-ra*2, py7-ra*2, px7+ra*2, py7+ra*2], fill=(*BEBO_ANT_COLOR, 40))
        d.ellipse([px7-ra, py7-ra, px7+ra, py7+ra], fill=(*BEBO_ANT_COLOR, 255))
        # Antenna shine
        d.ellipse([px7-r(2), py7-ra, px7, py7-r(2)], fill=(220,240,255,200))

    # ── "BEBO" label at bottom ────────────────────────────────────────────────
    label_y = 390

    # Pill background behind text
    f_big = font(88, bold=True)
    bbox = d.textbbox((0, 0), "BEBO", font=f_big)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pill_pad_x = 32
    pill_pad_y = 10
    pill_x0 = SIZE // 2 - tw // 2 - pill_pad_x
    pill_y0 = label_y - pill_pad_y
    pill_x1 = SIZE // 2 + tw // 2 + pill_pad_x
    pill_y1 = label_y + th + pill_pad_y

    # Pill glow
    pill_glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    pg = ImageDraw.Draw(pill_glow)
    for gi in range(12, 0, -1):
        ga = int(30 * (1 - gi / 12))
        pg.rounded_rectangle(
            [pill_x0 - gi*3, pill_y0 - gi*2, pill_x1 + gi*3, pill_y1 + gi*2],
            radius=50, fill=(*PURPLE, ga)
        )
    img = Image.alpha_composite(img, pill_glow)
    d = ImageDraw.Draw(img)

    # Pill fill
    d.rounded_rectangle([pill_x0, pill_y0, pill_x1, pill_y1],
                        radius=50, fill=(*PURPLE, 230))
    # Pill border
    d.rounded_rectangle([pill_x0, pill_y0, pill_x1, pill_y1],
                        radius=50, outline=(200, 180, 255, 180), width=3)
    # Pill inner shine
    d.rounded_rectangle([pill_x0+4, pill_y0+4, pill_x1-4, pill_y0+18],
                        radius=20, fill=(255, 255, 255, 40))

    # "BEBO" text — white bold
    d.text((SIZE // 2 - tw // 2, label_y), "BEBO", font=f_big, fill=(255, 255, 255, 255))

    # Subtle inner text glow
    glow2 = Image.new("RGBA", (SIZE, SIZE), (0,0,0,0))
    g2d = ImageDraw.Draw(glow2)
    f_big2 = font(92, bold=True)
    bbox2 = g2d.textbbox((0,0), "BEBO", font=f_big2)
    tw2 = bbox2[2] - bbox2[0]
    g2d.text((SIZE//2 - tw2//2, label_y - 2), "BEBO", font=f_big2, fill=(*PURPLE_L, 60))
    img = Image.alpha_composite(img, glow2)

    return img


sticker = draw_bebo_sticker()

# Save as PNG first for preview
png_path = os.path.join(OUT, "bebo-sticker.png")
sticker.save(png_path, "PNG")
print(f"PNG saved: {png_path}")

# Save as WebP (WhatsApp format)
webp_path = os.path.join(OUT, "bebo-sticker.webp")
sticker.save(webp_path, "WEBP", quality=90, lossless=False)
size_kb = os.path.getsize(webp_path) / 1024
print(f"WebP saved: {webp_path}  ({size_kb:.1f} KB)")

if size_kb > 100:
    # Re-save with lower quality to stay under 100KB
    sticker.save(webp_path, "WEBP", quality=75)
    size_kb = os.path.getsize(webp_path) / 1024
    print(f"Re-saved at q=75: {size_kb:.1f} KB")

print("Done!")
