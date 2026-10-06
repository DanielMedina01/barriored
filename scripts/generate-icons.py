"""Rasterize BarrioRed's geometric brand for native launchers. Requires Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent

def brand(size, foreground=False):
    scale = 4
    image = Image.new('RGBA', (size * scale, size * scale), (0, 0, 0, 0) if foreground else '#185b4b')
    draw = ImageDraw.Draw(image)
    factor = size * scale / 64
    inset = 0.63 if foreground else 1
    def point(x, y):
        return ((32 + (x - 32) * inset) * factor, (32 + (y - 32) * inset) * factor)
    color = '#d9f28c'
    draw.line([point(15, 31), point(32, 16), point(49, 31), point(49, 50), point(15, 50), point(15, 31)], fill=color, width=max(1, int(4 * factor * inset)), joint='curve')
    draw.line([point(27, 49), point(27, 34), point(37, 34), point(37, 49)], fill=color, width=max(1, int(4 * factor * inset)), joint='curve')
    return image.resize((size, size), Image.Resampling.LANCZOS)

for density, size, fg in [('mdpi', 48, 108), ('hdpi', 72, 162), ('xhdpi', 96, 216), ('xxhdpi', 144, 324), ('xxxhdpi', 192, 432)]:
    folder = ROOT / 'android/app/src/main/res' / ('mipmap-' + density)
    brand(size).save(folder / 'ic_launcher.png')
    brand(size).save(folder / 'ic_launcher_round.png')
    brand(fg, foreground=True).save(folder / 'ic_launcher_foreground.png')
brand(1024).convert('RGB').save(ROOT / 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')
