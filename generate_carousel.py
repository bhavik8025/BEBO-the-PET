#!/usr/bin/env python3
"""BEBO the PET — LinkedIn Carousel Generator (9 slides, 1080x1080)"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, textwrap

# ── Constants ────────────────────────────────────────────────────
W, H   = 1080, 1080
BG     = (18,  19,  31)
CARD   = (26,  28,  46)
CARD2  = (20,  22,  40)
PURPLE = (124, 92,  252)
LPUR   = (167, 139, 250)
DPUR   = (45,  25,  110)
TEXT   = (238, 242, 255)
MUTED  = (130, 135, 160)
GREEN  = (16,  185, 129)
DGREEN = (5,   90,  60)
CYAN   = (34,  211, 238)
YELLOW = (250, 204, 21)
ORANGE = (251, 146, 60)
RED    = (239, 68,  68)

FD      = r"C:\Windows\Fonts\\"
PROJECT = r"C:\Users\admin\OneDrive - Lal Bahadur Shastri Institute of Management\Documents\BEBO the PET"
BEBO_PATH = os.path.join(PROJECT, "assets", "icon.png")
OUT_DIR   = os.path.join(PROJECT, "assets", "carousel")
os.makedirs(OUT_DIR, exist_ok=True)

BEBO_FULL = Image.open(BEBO_PATH).convert("RGBA")

# ── Font loader ──────────────────────────────────────────────────
def F(style, size):
    m = {
        'b':  'calibrib.ttf',
        'r':  'calibri.ttf',
        'ab': 'arialbd.ttf',
        'a':  'arial.ttf',
        'sb': 'segoeuib.ttf',
        's':  'segoeui.ttf',
    }
    try:
        return ImageFont.truetype(FD + m.get(style, 'calibri.ttf'), size)
    except:
        return ImageFont.load_default()

# ── Helpers ──────────────────────────────────────────────────────
def canvas():
    return Image.new('RGBA', (W, H), (*BG, 255))

def glow(img, cx, cy, radius, color, strength=50):
    g = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(g)
    steps = 6
    for i in range(steps):
        r  = int(radius * (steps-i) / steps)
        a  = int(strength * (i+1) / steps)
        d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(*color, a))
    g = g.filter(ImageFilter.GaussianBlur(radius // 5))
    return Image.alpha_composite(img.convert('RGBA'), g)

def bebo_paste(img, size=130, x=None, y=None, pos='br'):
    b = BEBO_FULL.resize((size, size), Image.LANCZOS)
    if x is None:
        coords = {
            'br': (W-size-28, H-size-28),
            'bl': (28, H-size-28),
            'tr': (W-size-28, 28),
            'cr': (W-size-55, (H-size)//2),
        }
        x, y = coords.get(pos, (W-size-28, H-size-28))
    img.paste(b, (int(x), int(y)), b)
    return img

def rr(d, x, y, w, h, r=16, fill=None, outline=None, lw=2):
    if fill:
        d.rounded_rectangle([x, y, x+w, y+h], radius=r, fill=fill)
    if outline:
        d.rounded_rectangle([x, y, x+w, y+h], radius=r, outline=outline, width=lw)

def wrap(d, text, x, y, max_w, font, color, gap=10):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        test = (cur + " " + w).strip()
        bx = d.textbbox((0,0), test, font=font)
        if bx[2]-bx[0] <= max_w:
            cur = test
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    cy = y
    for line in lines:
        d.text((x, cy), line, font=font, fill=color)
        bx = d.textbbox((0,0), line, font=font)
        cy += (bx[3]-bx[1]) + gap
    return cy

def pill_draw(d, text, x, y, font, bg, fg, pad_x=16, pad_y=8):
    bx = d.textbbox((0,0), text, font=font)
    pw = bx[2]-bx[0]+pad_x*2
    ph = bx[3]-bx[1]+pad_y*2
    d.rounded_rectangle([x, y, x+pw, y+ph], radius=ph//2, fill=bg)
    d.text((x+pad_x, y+pad_y), text, font=font, fill=fg)
    return x+pw+10

def slide_footer(d, n, total=9):
    d.rectangle([0, H-4, W, H], fill=PURPLE)
    d.text((60, H-44), f"BEBO the PET   {n} / {total}", font=F('r', 21), fill=(*MUTED, 170))

def brand(d):
    d.text((60, 46), "BEBO the PET", font=F('b', 26), fill=PURPLE)

# ════════════════════════════════════════════════════════════════
# SLIDE 1 — COVER
# ════════════════════════════════════════════════════════════════
def slide_1():
    img = canvas()
    img = glow(img, 820, 360, 400, PURPLE, 75)
    img = glow(img, 160, 820, 220, CYAN,   35)
    img = glow(img, 950, 900, 170, LPUR,   25)
    d   = ImageDraw.Draw(img)

    # First-launch badge
    pill_draw(d, "FIRST LAUNCH  2026", 60, 52, F('b',22), DPUR, TEXT)

    # Main title
    d.text((60, 130), "BEBO",      font=F('b',104), fill=TEXT)
    d.text((60, 242), "the PET",   font=F('b', 90), fill=PURPLE)

    # Tagline
    d.text((60, 372), "Your AI Desktop Companion",  font=F('r', 36), fill=(*LPUR,240))
    d.text((60, 420), "Always on. One click. Done.", font=F('r', 30), fill=(*TEXT,180))

    # Benefit pills
    y_p = 484
    xp  = 60
    items = [("Free",GREEN),("Windows",PURPLE),("No Subscription",CYAN),("Open Source",YELLOW)]
    for label, color in items:
        bx  = d.textbbox((0,0), label, font=F('b',21))
        pw  = bx[2]-bx[0]+22
        d.rounded_rectangle([xp, y_p, xp+pw, y_p+36], radius=18,
                             fill=DPUR, outline=color, width=2)
        d.text((xp+11, y_p+8), label, font=F('b',21), fill=color)
        xp += pw+10

    # Powered by
    d.text((60, 556), "Powered by  Groq  x  GPT-OSS 120B  x  Electron",
           font=F('r', 24), fill=(*MUTED,160))

    # Author strip — tall enough to clear footer text
    rr(d, 0, 950, W, 122, r=0, fill=(12,13,24))
    d.text((60, 964),  "Built by Bhavik Thakkar",  font=F('b',26), fill=TEXT)
    d.text((60, 1000), "Lal Bahadur Shastri Institute of Management",
           font=F('r',20), fill=(*MUTED,180))

    # BEBO large
    bebo_paste(img, size=430, x=616, y=148)
    slide_footer(d, 1)
    return img.convert('RGB')

# ════════════════════════════════════════════════════════════════
# SLIDE 2 — THE PROBLEM
# ════════════════════════════════════════════════════════════════
def slide_2():
    img = canvas()
    img = glow(img, 900, 180, 250, PURPLE, 40)
    d   = ImageDraw.Draw(img)
    brand(d)

    d.text((60,108), "AI is powerful.",             font=F('b',60), fill=TEXT)
    d.text((60,178), "Getting to it is painful.",   font=F('b',50), fill=PURPLE)
    d.rectangle([60, 252, 500, 256], fill=PURPLE)

    problems = [
        (RED,    "01", "30+ seconds lost",
         "Every time you open ChatGPT or\nGemini from scratch — that's time gone."),
        (ORANGE, "02", "Focus broken",
         "Leaving your work to open a browser\nkills deep focus and flow."),
        (YELLOW, "03", "Tab overload",
         "You end up with 12 open tabs\njust to ask one question."),
        (CYAN,   "04", "AI isn't there for you",
         "You always have to go to AI.\nAI never comes to you."),
    ]

    positions = [(60,278),(560,278),(60,634),(560,634)]
    f_n  = F('b', 52)
    f_h  = F('b', 30)
    f_b  = F('r', 26)

    for (color,num,head,body),(cx,cy) in zip(problems, positions):
        rr(d, cx, cy, 460, 312, r=18, fill=CARD, outline=(*color,70), lw=1)
        d.rounded_rectangle([cx, cy, cx+460, cy+5], radius=3, fill=color)
        d.text((cx+18, cy+18),  num,  font=f_n, fill=(*color,65))
        d.text((cx+18, cy+90),  head, font=f_h, fill=color)
        wrap(d, body, cx+18, cy+136, 424, f_b, (*TEXT,195), gap=10)

    bebo_paste(img, size=115, pos='br')
    slide_footer(d, 2)
    return img.convert('RGB')

# ════════════════════════════════════════════════════════════════
# SLIDE 3 — MEET BEBO
# ════════════════════════════════════════════════════════════════
def slide_3():
    img = canvas()
    img = glow(img, 760, 550, 330, PURPLE, 58)
    d   = ImageDraw.Draw(img)
    brand(d)

    d.text((60, 108), "Meet BEBO",                           font=F('b',72), fill=TEXT)
    d.text((60, 192), "A tiny AI robot that lives on your",  font=F('r',32), fill=(*LPUR,230))
    d.text((60, 236), "Windows desktop — always.",           font=F('r',32), fill=(*LPUR,230))
    d.rectangle([60, 290, 440, 294], fill=PURPLE)

    points = [
        (GREEN,  "Always visible — sits in desktop corner"),
        (CYAN,   "Click once → AI panel opens instantly"),
        (LPUR,   "6 AI features, no browser needed"),
        (YELLOW, "AI result in under 2 seconds"),
        (ORANGE, "Zero context switching, ever"),
    ]
    f_pt = F('b', 30)
    y = 316
    for color, text in points:
        d.ellipse([60, y+8, 84, y+32], fill=color)
        d.text((104, y), text, font=f_pt, fill=TEXT)
        y += 66

    # Stat card
    rr(d, 60, 660, 480, 155, r=18, fill=(5,46,32), outline=(*GREEN,180), lw=2)
    d.text((82, 672), "1,000",                  font=F('b',78), fill=GREEN)
    d.text((82, 776), "free AI requests / day",  font=F('r',26), fill=(*TEXT,210))

    # ── Keyboard shortcuts strip (bottom-left, below stat card) ──
    rr(d, 60, 828, 548, 152, r=14, fill=(20,21,38), outline=(*PURPLE,55), lw=1)
    d.text((80, 842), "Global Shortcuts", font=F('b', 20), fill=(*LPUR, 210))

    sh_data = [
        ("Ctrl+Shift+W", "Wake BEBO",          PURPLE),
        ("Ctrl+Shift+B", "Hide BEBO",           YELLOW),
        ("Ctrl+Shift+P", "Show / Hide Panel",   GREEN),
    ]
    sy_ = 876
    for keys_, desc_, col_ in sh_data:
        kbx = d.textbbox((0, 0), keys_, font=F('b', 16))
        kw_ = kbx[2] - kbx[0] + 14
        rr(d, 80, sy_, kw_, 26, r=5, fill=DPUR, outline=(*col_, 160), lw=1)
        d.text((80 + 7, sy_ + 5), keys_,  font=F('b', 16), fill=col_)
        d.text((80 + kw_ + 12, sy_ + 5), desc_, font=F('r', 17), fill=(*TEXT, 185))
        sy_ += 36

    # ── Real BEBO panel screenshot (right column, below robot) ──
    panel_path = os.path.join(PROJECT, 'assets', 'panel-screenshot.png')
    if os.path.exists(panel_path):
        panel_img = Image.open(panel_path).convert('RGB')
        # Thumbnail to fit right column below BEBO robot (max 375 wide × 395 tall)
        panel_img.thumbnail((375, 395), Image.LANCZOS)
        pw_, ph_ = panel_img.size
        # Centre in right column (x = 640 … 1020, y starts at 558)
        px_ = 640 + (380 - pw_) // 2
        py_ = 560
        # Purple border frame
        rr(d, px_ - 4, py_ - 4, pw_ + 8, ph_ + 8,
           r=12, fill=(20, 21, 38), outline=(*PURPLE, 180), lw=2)
        img.paste(panel_img, (px_, py_))
        d.text((px_, py_ - 26), "Real Panel UI  (Ctrl+Shift+P)",
               font=F('r', 19), fill=(*MUTED, 165))

    bebo_paste(img, size=390, x=640, y=155)
    slide_footer(d, 3)
    return img.convert('RGB')

# ════════════════════════════════════════════════════════════════
# SLIDE 4 — 6 FEATURES
# ════════════════════════════════════════════════════════════════
def slide_4():
    img = canvas()
    img = glow(img, 540, 180, 290, PURPLE, 42)
    d   = ImageDraw.Draw(img)
    brand(d)

    d.text((60, 108), "6 AI Features Built In",  font=F('b',64), fill=TEXT)
    d.text((60, 182), "All free. All instant.",    font=F('r',32), fill=(*LPUR,225))
    d.rectangle([60, 234, 540, 238], fill=PURPLE)

    features = [
        (PURPLE, "SUMMARIZE",   "Condense any article, email\nor report into key points"),
        (CYAN,   "HUMANIZE",    "Transform AI text into\ngenuine human writing"),
        (GREEN,  "SIMPLIFY",    "Complex jargon made\ninstantly clear to anyone"),
        (ORANGE, "DRAFT EMAIL", "Professional emails from\nrough notes in seconds"),
        (YELLOW, "FIX GRAMMAR", "Corrects errors silently,\nkeeps your voice intact"),
        (RED,    "ASK AI",      "Free-form — ask anything,\nget expert-level answers"),
    ]

    f_h  = F('b', 27)
    f_b  = F('r', 22)
    cw, ch = 320, 234
    gx, gy = 18, 16
    sx = (W-(3*cw+2*gx))//2
    sy = 258

    for i,(color,name,desc) in enumerate(features):
        row = i//3; col = i%3
        cx = sx + col*(cw+gx)
        cy = sy + row*(ch+gy)
        rr(d, cx, cy, cw, ch, r=16, fill=CARD)
        d.rounded_rectangle([cx, cy, cx+cw, cy+5], radius=3, fill=color)
        d.ellipse([cx+16, cy+20, cx+46, cy+50], fill=(*color,55))
        d.ellipse([cx+22, cy+26, cx+40, cy+44], fill=color)
        d.text((cx+16, cy+62), name, font=f_h, fill=color)
        wrap(d, desc, cx+16, cy+102, cw-32, f_b, (*TEXT,195), gap=8)

    bebo_paste(img, size=112, pos='br')
    slide_footer(d, 4)
    return img.convert('RGB')

# ════════════════════════════════════════════════════════════════
# SLIDE 5 — WHY BEBO WINS
# ════════════════════════════════════════════════════════════════
def slide_5():
    img = canvas()
    img = glow(img, 180, 500, 260, PURPLE, 40)
    img = glow(img, 920, 300, 200, GREEN,  32)
    d   = ImageDraw.Draw(img)
    brand(d)

    d.text((60, 108), "BEBO vs Browser AI",           font=F('b',60), fill=TEXT)
    d.text((60, 180), "Full workflow — click to result", font=F('r',30), fill=(*MUTED,225))
    d.rectangle([60, 232, 560, 236], fill=PURPLE)

    # Big stat boxes
    rr(d, 60,  258, 450, 218, r=20, fill=(5,46,32), outline=(*GREEN,180), lw=2)
    d.text((82, 276), "BEBO",          font=F('b',36), fill=(*TEXT,220))
    d.text((82, 320), "~4 sec",        font=F('b',88), fill=GREEN)
    d.text((82, 430), "total workflow", font=F('r',28), fill=(*TEXT,180))

    d.text((527, 336), "VS",           font=F('b',40), fill=(*MUTED,180))

    rr(d, 590, 258, 430, 218, r=20, fill=(60,8,8), outline=(*RED,120), lw=2)
    d.text((612, 276), "Browser AI",   font=F('b',36), fill=(*TEXT,220))
    d.text((612, 320), "~14 sec",      font=F('b',88), fill=RED)
    d.text((612, 430), "total workflow",font=F('r',28), fill=(*TEXT,180))

    # Point-by-point
    comparisons = [
        ("No browser needed",      "Open browser first"),
        ("Always visible on screen","Navigate to website"),
        ("One click = AI ready",   "Wait for page to load"),
        ("Zero context switching", "Leave your current work"),
    ]
    f_c = F('r', 26)
    y   = 508
    d.line([535, 502, 535, 730], fill=(*MUTED,55), width=1)

    for gt, rt in comparisons:
        d.ellipse([68, y+6, 90, y+28],  fill=GREEN)
        d.text((106, y), gt, font=f_c, fill=TEXT)
        d.ellipse([600, y+6, 622, y+28], fill=(*RED,100))
        d.text((638, y), rt, font=f_c, fill=(*MUTED,200))
        y += 54

    # Bottom callout
    rr(d, 60, 856, 960, 100, r=16, fill=CARD)
    d.text((82, 878), "4x faster workflow  —  every single time.",
           font=F('b',36), fill=PURPLE)
    d.text((82, 926), "Multiply that by every task in your day.",
           font=F('r',26), fill=(*TEXT,175))

    bebo_paste(img, size=112, pos='br')
    slide_footer(d, 5)
    return img.convert('RGB')

# ════════════════════════════════════════════════════════════════
# SLIDE 6 — SPEED COMPARISON
# ════════════════════════════════════════════════════════════════
def slide_6():
    img = canvas()
    img = glow(img, 900, 280, 280, PURPLE, 45)
    d   = ImageDraw.Draw(img)
    brand(d)

    d.text((60, 108), "Powered by the World's",    font=F('b',56), fill=TEXT)
    d.text((60, 172), "Fastest AI Inference",       font=F('b',56), fill=PURPLE)
    d.rectangle([60, 244, 580, 248], fill=PURPLE)

    # Table
    col_x = [60, 530, 760]
    RH    = 98
    ty    = 268
    f_th  = F('b', 23)
    f_td  = F('r', 25)
    f_tdb = F('b', 25)

    headers = ["Model  (Free Tier)", "Speed", "200-tok Task"]
    rr(d, 58, ty, 964, RH-6, r=12, fill=(28,18,58))
    for j,h in enumerate(headers):
        d.text((col_x[j]+14, ty+28), h, font=f_th, fill=(*LPUR,225))
    ty += RH

    rows = [
        ("BEBO  (Groq + GPT-OSS 120B)", "~500 tok/s", "~0.4-0.6s", True),
        ("Gemini 2.0 Flash (free)",       "200-300 tok/s",  "~0.8-1.2s", False),
        ("GPT-4o mini (free)",            "100-150 tok/s",  "~1.5-2.5s", False),
        ("Claude 3.5 Haiku (free)",       "100-150 tok/s",  "~1.5-2.5s", False),
        ("GPT-4o (limited free)",         "80-100 tok/s",   "~2.0-3.0s", False),
    ]

    for model, speed, task, is_bebo in rows:
        if is_bebo:
            rr(d, 58, ty, 964, RH-6, r=12, fill=(38,22,100), outline=(*GREEN,100), lw=2)
            d.text((col_x[0]+14, ty+26), model,      font=f_tdb, fill=LPUR)
            d.text((col_x[1]+14, ty+26), speed,      font=f_tdb, fill=GREEN)
            d.text((col_x[2]+14, ty+26), task+" [BEST]", font=f_tdb, fill=GREEN)
        else:
            rr(d, 58, ty, 964, RH-6, r=12, fill=CARD)
            d.text((col_x[0]+14, ty+28), model, font=f_td, fill=(*TEXT,175))
            d.text((col_x[1]+14, ty+28), speed, font=f_td, fill=(*MUTED,200))
            d.text((col_x[2]+14, ty+28), task,  font=f_td, fill=(*MUTED,200))
        ty += RH

    d.text((62, ty+8),
           "Source: Groq published benchmarks  |  Tested with latest free-tier models  (2026)",
           font=F('r',19), fill=(*MUTED,140))

    # Note
    rr(d, 58, 954, 964, 80, r=14, fill=(*PURPLE,18), outline=(*PURPLE,75), lw=1)
    d.text((78, 972),
           "Groq uses custom LPUs — Language Processing Units — built for AI speed.",
           font=F('b',24), fill=(*LPUR,220))
    d.text((78,1010), "This is BEBO's hardware advantage.",
           font=F('r',22), fill=(*TEXT,170))

    bebo_paste(img, size=112, pos='br')
    slide_footer(d, 6)
    return img.convert('RGB')

# ════════════════════════════════════════════════════════════════
# SLIDE 7 — PRICING & LIMITS
# ════════════════════════════════════════════════════════════════
def slide_7():
    img = canvas()
    img = glow(img, 200, 380, 260, GREEN,  38)
    img = glow(img, 920, 700, 200, PURPLE, 32)
    d   = ImageDraw.Draw(img)
    brand(d)

    d.text((60, 108), "100% Free.  No Credit Card.", font=F('b',60), fill=TEXT)
    d.rectangle([60, 185, 700, 189], fill=GREEN)

    # Big stat
    rr(d, 60, 208, 540, 178, r=20, fill=(5,46,32), outline=(*GREEN,180), lw=2)
    d.text((82, 222), "1,000",                font=F('b',82), fill=GREEN)
    d.text((82, 324), "free AI requests / day", font=F('r',26), fill=(*TEXT,210))

    rr(d, 622, 208, 398, 178, r=20, fill=CARD)
    d.text((644, 232), "That's",              font=F('r',27), fill=(*MUTED,195))
    d.text((644, 272), "10 tasks/min",        font=F('b',46), fill=PURPLE)
    d.text((644, 338), "all day, every day.", font=F('r',26), fill=(*TEXT,175))

    # Table
    col_x  = [60, 296, 564, 790]
    RH     = 88
    ty     = 416
    f_th   = F('b', 21)
    f_td   = F('r', 24)
    f_tdb  = F('b', 24)

    headers = ["Platform", "Free Model", "Daily Limit", "Card?"]
    rr(d, 58, ty, 964, RH-6, r=10, fill=(28,18,58))
    for j,h in enumerate(headers):
        d.text((col_x[j]+12, ty+26), h, font=f_th, fill=(*LPUR,220))
    ty += RH

    rows = [
        ("BEBO",     "GPT-OSS 120B",   "1,000 / day", "Never",  True),
        ("ChatGPT",  "GPT-4o mini",     "~50 msgs/3hr", "No",     False),
        ("Gemini",   "Gemini 2.0 Flash","~500 req/day", "No",     False),
        ("Claude",   "Claude 3.5 Haiku","~25 msgs/day", "No",     False),
    ]

    for name,model,limit,cc,is_bebo in rows:
        if is_bebo:
            rr(d, 58, ty, 964, RH-6, r=10, fill=(36,22,90), outline=(*GREEN,95), lw=2)
            d.text((col_x[0]+12, ty+22), name,  font=f_tdb, fill=LPUR)
            d.text((col_x[1]+12, ty+22), model, font=f_tdb, fill=(*TEXT,215))
            d.text((col_x[2]+12, ty+22), limit, font=f_tdb, fill=GREEN)
            d.text((col_x[3]+12, ty+22), cc,    font=f_tdb, fill=GREEN)
        else:
            rr(d, 58, ty, 964, RH-6, r=10, fill=CARD)
            d.text((col_x[0]+12, ty+24), name,  font=f_td, fill=(*TEXT,175))
            d.text((col_x[1]+12, ty+24), model, font=f_td, fill=(*MUTED,200))
            d.text((col_x[2]+12, ty+24), limit, font=f_td, fill=(*MUTED,200))
            d.text((col_x[3]+12, ty+24), cc,    font=f_td, fill=(*MUTED,200))
        ty += RH

    d.text((62, ty+8), "* Estimates based on publicly available free-tier limits (2026).",
           font=F('r',19), fill=(*MUTED,140))

    bebo_paste(img, size=112, pos='br')
    slide_footer(d, 7)
    return img.convert('RGB')

# ════════════════════════════════════════════════════════════════
# SLIDE 8 — SETUP STEPS
# ════════════════════════════════════════════════════════════════
def slide_8():
    img = canvas()
    img = glow(img, 820, 600, 280, PURPLE, 42)
    d   = ImageDraw.Draw(img)
    brand(d)

    d.text((60, 108), "Get Started in 4 Steps",  font=F('b',66), fill=TEXT)
    d.text((60, 185), "Less than 2 minutes.",     font=F('r',32), fill=(*LPUR,220))
    d.rectangle([60, 240, 490, 244], fill=PURPLE)

    steps = [
        (PURPLE, "01", "Download BEBO",
         "Get the installer or portable EXE."),
        (CYAN,   "02", "Get Free Groq API Key",
         "Visit groq.com — free account.\nNo credit card. Takes 30 seconds."),
        (GREEN,  "03", "Paste Key & Launch",
         "Run BEBO. Paste your key.\nClick Verify & Launch. Done!"),
        (YELLOW, "04", "Pin to Windows Startup",
         "Win+R  ->  shell:startup  ->  Enter\nCreate shortcut. BEBO starts with Windows."),
    ]

    sx = [60, 560]
    sy = [268, 656]
    sw, sh = 460, 342
    f_num = F('b', 54)
    f_sh  = F('b', 32)
    f_sb  = F('r', 26)

    for i,(color,num,title,body) in enumerate(steps):
        cx = sx[i%2]
        cy = sy[i//2]
        rr(d, cx, cy, sw, sh, r=20, fill=CARD, outline=(*color,80), lw=2)
        d.rounded_rectangle([cx, cy, cx+sw, cy+5], radius=3, fill=color)
        d.text((cx+18, cy+14),  num,   font=f_num, fill=(*color,62))
        d.text((cx+18, cy+90),  title, font=f_sh,  fill=color)
        if i == 0:
            # Show releases URL in smaller font so it fits the card width
            d.text((cx+18, cy+142), "Direct download:", font=F('r',21), fill=(*MUTED,185))
            url_line1 = "github.com/bhavik8025/BEBO-the-PET/"
            url_line2 = "releases/latest"
            d.text((cx+18, cy+172), url_line1, font=F('b',19), fill=(*LPUR,230))
            d.text((cx+18, cy+198), url_line2, font=F('b',19), fill=(*LPUR,230))
            # Underline both lines to look like a link
            ub1 = d.textbbox((0,0), url_line1, font=F('b',19))
            ub2 = d.textbbox((0,0), url_line2, font=F('b',19))
            d.line([cx+18, cy+196, cx+18+ub1[2]-ub1[0], cy+196], fill=(*LPUR,140), width=1)
            d.line([cx+18, cy+222, cx+18+ub2[2]-ub2[0], cy+222], fill=(*LPUR,140), width=1)
            # Filename chip below the link
            _exe = "BEBO.the.PET.Setup.exe"
            _ef  = F('b', 18)
            _ebx = d.textbbox((0,0), _exe, font=_ef)
            _ew  = _ebx[2]-_ebx[0]
            rr(d, cx+18, cy+238, _ew+24, 30, r=8, fill=(5,46,32), outline=(*GREEN,120), lw=1)
            d.text((cx+30, cy+243), _exe, font=_ef, fill=(*GREEN,240))
        else:
            wrap(d, body, cx+18, cy+140, sw-36, f_sb, (*TEXT,195), gap=12)

    # Arrow between cols
    d.text((506, 410), u"→", font=F('b',36), fill=(*PURPLE,110))
    d.text((506, 798), u"→", font=F('b',36), fill=(*PURPLE,110))

    bebo_paste(img, size=112, pos='br')
    slide_footer(d, 8)
    return img.convert('RGB')

# ════════════════════════════════════════════════════════════════
# SLIDE 9 — TECH + ROADMAP + CTA
# ════════════════════════════════════════════════════════════════
def slide_9():
    img = canvas()
    img = glow(img, 280, 540, 340, PURPLE, 62)
    img = glow(img, 920, 180, 200, CYAN,   30)
    d   = ImageDraw.Draw(img)

    d.text((60, 52), "Download BEBO — Free Forever", font=F('b',52), fill=TEXT)

    # Prominent single-line download link pill — looks like a real hyperlink
    _url = "github.com/bhavik8025/BEBO-the-PET/releases/latest"
    _uf  = F('b', 19)
    _ubx = d.textbbox((0, 0), _url, font=_uf)
    _uw  = _ubx[2] - _ubx[0]
    rr(d, 60, 118, 660, 56, r=28, fill=(24, 12, 70), outline=LPUR, lw=2)
    _tx, _ty = 82, 132
    d.text((_tx, _ty), _url, font=_uf, fill=(*LPUR, 245))
    # Underline to simulate hyperlink style
    d.line([_tx, _ty+22, _tx+_uw, _ty+22], fill=(*LPUR, 180), width=1)

    # Built with
    rr(d, 60, 210, 660, 116, r=16, fill=CARD)
    d.text((82, 228), "Built with", font=F('r',24), fill=(*MUTED,180))
    xp, yp = 82, 268
    for name,color in [("Electron",PURPLE),("Groq",CYAN),("GPT-OSS 120B",GREEN),("Claude AI",LPUR)]:
        bx = d.textbbox((0,0), name, font=F('b',24))
        pw = bx[2]-bx[0]+20
        d.rounded_rectangle([xp, yp, xp+pw, yp+36], radius=18,
                             fill=DPUR, outline=color, width=2)
        d.text((xp+10, yp+8), name, font=F('b',24), fill=color)
        xp += pw+10

    # Roadmap
    rr(d, 60, 354, 660, 370, r=16, fill=CARD)
    d.text((82, 376), "Roadmap — What's Coming", font=F('b',30), fill=LPUR)
    d.rectangle([82, 420, 480, 424], fill=(*PURPLE,90))
    roadmap = [
        (CYAN,   "Voice input — speak your prompt"),
        (GREEN,  "Conversation history panel"),
        (ORANGE, "Custom AI personas & personalities"),
        (YELLOW, "Plugin system — add your own tools"),
        (PURPLE, "macOS port"),
    ]
    ry = 438
    for color, item in roadmap:
        d.ellipse([82, ry+7, 102, ry+27], fill=(*color,180))
        d.text((118, ry), item, font=F('r',26), fill=(*TEXT,195))
        ry += 52

    # Author card
    rr(d, 60, 750, 660, 116, r=16, fill=(*PURPLE,16), outline=(*PURPLE,60), lw=1)
    d.text((82, 770), "Bhavik Thakkar",
           font=F('b',32), fill=TEXT)
    d.text((82, 814), "Lal Bahadur Shastri Institute of Management",
           font=F('r',22), fill=(*MUTED,195))

    d.text((60, 898), "My first ever app launch.",
           font=F('b',28), fill=(*LPUR,180))
    d.text((60, 938), "BEBO the PET  |  Free  |  Open Source  |  Windows",
           font=F('r',21), fill=(*MUTED,155))

    # BEBO large right
    bebo_paste(img, size=410, x=648, y=148)

    slide_footer(d, 9)
    return img.convert('RGB')

# ════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════
def main():
    fns = [slide_1,slide_2,slide_3,slide_4,slide_5,
           slide_6,slide_7,slide_8,slide_9]
    slides = []
    print("Generating BEBO LinkedIn Carousel...")
    for i, fn in enumerate(fns, 1):
        print(f"  [{i}/9] {fn.__name__}...", end=' ', flush=True)
        s = fn()
        path = os.path.join(OUT_DIR, f"slide-{i:02d}.png")
        s.save(path, "PNG")
        slides.append(s)
        print("done")

    # PDF for LinkedIn
    pdf_path = os.path.join(OUT_DIR, "BEBO-LinkedIn-Carousel.pdf")
    slides[0].save(pdf_path, save_all=True, append_images=slides[1:])
    print(f"\nAll done!")
    print(f"PNGs  ->  {OUT_DIR}")
    print(f"PDF   ->  {pdf_path}")
    print("\nUpload BEBO-LinkedIn-Carousel.pdf as a LinkedIn document post.")

if __name__ == "__main__":
    main()
