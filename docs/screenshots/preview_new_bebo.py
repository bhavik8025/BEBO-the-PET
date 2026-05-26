"""
Preview render of the NEW BEBO design:
  - White sphere head / dome
  - Dark visor face screen
  - Big circular glowing cyan-blue eyes
  - White/light-grey rounded body
  - Dark arm joints
  - Compact cute proportions
"""
from PIL import Image, ImageDraw, ImageFont
import os, math

OUT = os.path.dirname(os.path.abspath(__file__))

# Colors matching the new CSS/SVG
HEAD_GRAD_T   = (255, 255, 255)
HEAD_GRAD_B   = (176, 200, 224)
BODY_GRAD_T   = (238, 244, 255)
BODY_GRAD_B   = (184, 204, 226)
VISOR_COL     = (10, 18, 36)
EYE_IRIS      = (0, 232, 255)
EYE_PUPIL     = (0, 48, 128)
EYE_SHINE     = (255, 255, 255)
JOINT_COL     = (26, 37, 64)
BAND_COL      = (26, 37, 64)
CORE_COL      = (13, 26, 48)
CORE_GLOW     = (0, 212, 255)
EAR_COL       = (224, 235, 252)
EAR_RING      = (208, 223, 242)
EAR_DOT       = (0, 212, 255)
BLUSH         = (0, 200, 255, 35)
MOUTH_COL     = (96, 232, 255)
STROKE_HEAD   = (200, 216, 238)
STROKE_BODY   = (184, 204, 224)
STATUS_GREEN  = (80, 255, 140)
STATUS_CYAN   = (0, 212, 255)
STATUS_ORANGE = (255, 165, 60)

SIZE = 512

def fnt(size, bold=False):
    for p in (
        ["C:/Windows/Fonts/segoeuib.ttf","C:/Windows/Fonts/calibrib.ttf","C:/Windows/Fonts/arialbd.ttf"] if bold
        else ["C:/Windows/Fonts/segoeui.ttf","C:/Windows/Fonts/calibri.ttf","C:/Windows/Fonts/arial.ttf"]
    ):
        try: return ImageFont.truetype(p, size)
        except: pass
    return ImageFont.load_default()

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i]-c1[i])*t) for i in range(3))

def make_new_bebo(size=512):
    img = Image.new("RGBA", (size, size), (0,0,0,0))
    d   = ImageDraw.Draw(img)

    s  = size / 160        # scale factor  (160 is the "design unit" width)
    cx = size // 2
    # Map from SVG viewBox(0 0 120 140) coords to canvas
    def p(x, y): return (int(cx + (x-60)*s), int(size*0.08 + y*s))
    def r(v):    return max(1, int(v*s))

    # ── Outer glow ────────────────────────────────────────
    gl = Image.new("RGBA", (size, size), (0,0,0,0))
    gd = ImageDraw.Draw(gl)
    for i in range(50,0,-1):
        a = int(14*(1-i/50))
        gr = int(s*50 + i*2)
        cx2,cy2 = p(60,60)
        gd.ellipse([cx2-gr, cy2-gr, cx2+gr, cy2+gr], fill=(0,200,255,a))
    img = Image.alpha_composite(img, gl); d = ImageDraw.Draw(img)

    # ── Shadow ────────────────────────────────────────────
    for i in range(18,0,-1):
        a = int(50*(1-i/18))
        sw = r(26)+i*3; sh = r(4)+i
        sx,sy = p(60,134)
        d.ellipse([sx-sw//2, sy-sh//2, sx+sw//2, sy+sh//2], fill=(30,50,100,a))

    # ── Feet ──────────────────────────────────────────────
    for fx,fy in [(43,134),(77,134)]:
        px,py = p(fx,fy)
        rx2,ry2 = r(17),r(8)
        for i in range(3,0,-1):
            d.ellipse([px-rx2-i,py-ry2-i,px+rx2+i,py+ry2+i], fill=(*STROKE_BODY, 60//i))
        d.ellipse([px-rx2, py-ry2, px+rx2, py+ry2], fill=(*BODY_GRAD_B,255))
        d.ellipse([px-rx2, py-ry2, px+rx2, py+ry2], outline=(*STROKE_BODY,200), width=r(1))

    # ── Legs ──────────────────────────────────────────────
    for lx,ly,lw,lh in [(31,118,22,17),(67,118,22,17)]:
        x0,y0 = p(lx,ly); x1,y1 = p(lx+lw,ly+lh)
        d.rounded_rectangle([x0,y0,x1,y1], radius=r(9), fill=(*BODY_GRAD_B,255), outline=(*STROKE_BODY,200), width=r(1))

    # ── Torso ─────────────────────────────────────────────
    tx0,ty0 = p(27,72); tx1,ty1 = p(93,122)
    # gradient-like: draw from bottom to top
    for row in range(ty0, ty1):
        t = (row - ty0)/(ty1-ty0)
        col = lerp_color(BODY_GRAD_T, BODY_GRAD_B, t)
        d.line([(tx0,row),(tx1,row)], fill=(*col,255))
    # re-apply rounded mask
    mask = Image.new("RGBA",(size,size),(0,0,0,0))
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([tx0,ty0,tx1,ty1], radius=r(22), fill=(255,255,255,255))
    img.paste(img, mask=mask); d = ImageDraw.Draw(img)
    d.rounded_rectangle([tx0,ty0,tx1,ty1], radius=r(22), outline=(*STROKE_BODY,200), width=r(1))

    # Dark band
    bx0,by0 = p(27,84); bx1,by1 = p(93,93)
    band = Image.new("RGBA",(size,size),(0,0,0,0))
    bd2 = ImageDraw.Draw(band)
    bd2.rectangle([bx0,by0,bx1,by1], fill=(*BAND_COL,200))
    img = Image.alpha_composite(img, band); d = ImageDraw.Draw(img)

    # Core panel
    cx0,cy0 = p(43,90); cx1,cy1 = p(77,112)
    d.rounded_rectangle([cx0,cy0,cx1,cy1], radius=r(9), fill=(*CORE_COL,255), outline=(*CORE_GLOW,100), width=r(1))
    # Core glow pulse
    cpx,cpy = p(60,101)
    for ri,a in [(r(10),25),(r(7),50),(r(6),200)]:
        d.ellipse([cpx-ri,cpy-ri,cpx+ri,cpy+ri], fill=(*CORE_GLOW,a))

    # ── Arms ──────────────────────────────────────────────
    for ax,ay,aw,ah in [(9,75,20,38),(91,75,20,38)]:
        ax0,ay0 = p(ax,ay); ax1,ay1 = p(ax+aw,ay+ah)
        # gradient
        for row in range(ay0,ay1):
            t = (row-ay0)/(ay1-ay0)
            col = lerp_color(BODY_GRAD_T, BODY_GRAD_B, t)
            d.line([(ax0+r(2),row),(ax1-r(2),row)], fill=(*col,255))
        d.rounded_rectangle([ax0,ay0,ax1,ay1], radius=r(10), outline=(*STROKE_BODY,180), width=r(1))

    # Arm joints (dark discs)
    for jx,jy in [(23,78),(97,78)]:
        jpx,jpy = p(jx,jy); jr = r(10)
        d.ellipse([jpx-jr,jpy-jr,jpx+jr,jpy+jr], fill=(*JOINT_COL,255), outline=(13,19,38,255), width=r(1))
        # joint shine
        d.ellipse([jpx-r(4),jpy-r(5),jpx,jpy-r(2)], fill=(255,255,255,40))

    # Hands
    for hx,hy in [(19,114),(101,114)]:
        hpx,hpy = p(hx,hy); hr = r(10)
        d.ellipse([hpx-hr,hpy-hr,hpx+hr,hpy+hr], fill=(*BODY_GRAD_T,255), outline=(*STROKE_BODY,200), width=r(1))
        d.ellipse([hpx-r(4),hpy-r(5),hpx,hpy-r(2)], fill=(255,255,255,80))

    # ── Ears ──────────────────────────────────────────────
    for ex,ey in [(14,50),(106,50)]:
        epx,epy = p(ex,ey)
        er  = r(13)
        er2 = r(8)
        er3 = r(4)
        d.ellipse([epx-er,epy-er,epx+er,epy+er],   fill=(*EAR_COL,255), outline=(*STROKE_HEAD,200), width=r(1))
        d.ellipse([epx-er2,epy-er2,epx+er2,epy+er2], fill=(*EAR_RING,255), outline=(150,172,200,180), width=r(1))
        # ear dot glow
        for ri2,a2 in [(r(7),25),(r(6),50),(r(4),255)]:
            d.ellipse([epx-ri2,epy-ri2,epx+ri2,epy+ri2], fill=(*EAR_DOT,a2))

    # ── Head dome ─────────────────────────────────────────
    hcx,hcy = p(60,46); hrad = r(40)
    # gradient sphere
    head_layer = Image.new("RGBA",(size,size),(0,0,0,0))
    hl = ImageDraw.Draw(head_layer)
    for i in range(hrad,0,-1):
        t = 1 - i/hrad
        col = lerp_color(HEAD_GRAD_T, HEAD_GRAD_B, t**0.6)
        hl.ellipse([hcx-i,hcy-i,hcx+i,hcy+i], fill=(*col,255))
    img = Image.alpha_composite(img, head_layer); d = ImageDraw.Draw(img)
    d.ellipse([hcx-hrad,hcy-hrad,hcx+hrad,hcy+hrad], outline=(*STROKE_HEAD,200), width=r(1))

    # Head top shine
    sx0,sy0 = p(34,14); sx1,sy1 = p(60,30)
    shine = Image.new("RGBA",(size,size),(0,0,0,0))
    shd = ImageDraw.Draw(shine)
    shd.ellipse([sx0,sy0,sx1,sy1], fill=(255,255,255,130))
    img = Image.alpha_composite(img, shine); d = ImageDraw.Draw(img)

    # ── Visor (dark face screen) ───────────────────────────
    vcx,vcy = p(60,53)
    vrx,vry = r(32),r(27)
    d.ellipse([vcx-vrx,vcy-vry,vcx+vrx,vcy+vry], fill=(*VISOR_COL,255), outline=(30,58,90,200), width=r(1))
    # visor top gloss
    vgl = Image.new("RGBA",(size,size),(0,0,0,0))
    vgd = ImageDraw.Draw(vgl)
    vgd.ellipse([vcx-r(20),vcy-vry+r(2),vcx+r(20),vcy-vry+r(14)], fill=(255,255,255,18))
    img = Image.alpha_composite(img, vgl); d = ImageDraw.Draw(img)

    # ── Forehead status lights ─────────────────────────────
    for lx,ly,lc in [(50,27,STATUS_GREEN),(60,26,STATUS_CYAN),(70,27,STATUS_ORANGE)]:
        lpx,lpy = p(lx,ly)
        for ri3,la in [(r(4),30),(r(2),255)]:
            d.ellipse([lpx-ri3,lpy-ri3,lpx+ri3,lpy+ri3], fill=(*lc,la))

    # ── Eyes ──────────────────────────────────────────────
    for ex2,ey2 in [(46,49),(74,49)]:
        epx2,epy2 = p(ex2,ey2)
        # socket
        d.ellipse([epx2-r(12),epy2-r(12),epx2+r(12),epy2+r(12)], fill=(6,12,22,255))
        # glow rings
        for ri4,a4 in [(r(13),20),(r(11),40),(r(10),255)]:
            # interpolate eye color
            frac = 1 - ri4/(r(13))
            eyecol = lerp_color((0,230,255),(0,80,220), max(0,min(1,frac)))
            d.ellipse([epx2-ri4,epy2-ri4,epx2+ri4,epy2+ri4], fill=(*eyecol,a4))
        # white ring at edge
        d.ellipse([epx2-r(10),epy2-r(10),epx2+r(10),epy2+r(10)], fill=(0,230,255,255))
        d.ellipse([epx2-r(9),epy2-r(9),epx2+r(9),epy2+r(9)], fill=(0,180,255,255))
        # pupil
        d.ellipse([epx2-r(4),epy2-r(4),epx2+r(4),epy2+r(4)], fill=(*EYE_PUPIL,255))
        # shine dot
        shx,shy = epx2-r(3), epy2-r(5)
        d.ellipse([shx,shy,shx+r(3),shy+r(3)], fill=(255,255,255,220))

    # ── Smile ─────────────────────────────────────────────
    d.arc([p(47,60),p(73,76)], start=15, end=165, fill=(*MOUTH_COL,220), width=r(2))

    # ── Blush ─────────────────────────────────────────────
    bl = Image.new("RGBA",(size,size),(0,0,0,0))
    bld = ImageDraw.Draw(bl)
    for bx2,by2 in [(35,62),(85,62)]:
        bpx,bpy = p(bx2,by2); br2 = r(7)
        bld.ellipse([bpx-br2,bpy-br2,bpx+br2,bpy+br2], fill=(0,200,255,45))
    img = Image.alpha_composite(img, bl); d = ImageDraw.Draw(img)

    return img


# ── Render on dark background for preview ────────────────
bg = Image.new("RGB",(SIZE,SIZE),(18,19,31))
bebo = make_new_bebo(SIZE)
result = bg.copy().convert("RGBA")
result = Image.alpha_composite(result, bebo)

result.convert("RGB").save(os.path.join(OUT,"new-bebo-preview.png"))
print("Saved: new-bebo-preview.png")

# Also save transparent version for sticker
bebo.save(os.path.join(OUT,"new-bebo-transparent.png"))
print("Saved: new-bebo-transparent.png")
