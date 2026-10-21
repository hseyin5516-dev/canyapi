import os
from PIL import Image

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
images_dir = os.path.join(base_dir, 'images')

total_before = 0
total_after = 0
count = 0

for root, dirs, files in os.walk(images_dir):
    for f in files:
        if f.lower().endswith('.webp'):
            fpath = os.path.join(root, f)
            size_before = os.path.getsize(fpath)
            total_before += size_before

            try:
                with Image.open(fpath) as im:
                    # Decide max dimensions
                    if 'hero-bg' in f:
                        max_w = 1600
                        quality = 80
                    elif 'logo' in f:
                        max_w = 400
                        quality = 85
                    else:
                        # Card / service / real project images
                        max_w = 800
                        quality = 78

                    if im.width > max_w:
                        ratio = max_w / float(im.width)
                        new_h = int(im.height * ratio)
                        im = im.resize((max_w, new_h), Image.Resampling.LANCZOS)

                    # Save optimized WebP
                    if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
                        im.save(fpath, 'WEBP', quality=quality, method=6)
                    else:
                        rgb_im = im.convert('RGB')
                        rgb_im.save(fpath, 'WEBP', quality=quality, method=6)

                size_after = os.path.getsize(fpath)
                total_after += size_after
                count += 1
                if size_before > size_after:
                    print(f"Optimized: {f} ({size_before // 1024} KB -> {size_after // 1024} KB)")
            except Exception as e:
                print(f"Error optimizing {f}: {e}")

saved_mb = (total_before - total_after) / (1024 * 1024)
print("\n" + "=" * 50)
print(f"İşlenen WebP Görsel: {count}")
print(f"Önceki Toplam: {total_before / (1024*1024):.2f} MB")
print(f"Sonraki Toplam: {total_after / (1024*1024):.2f} MB")
print(f"Ek Tasarruf: {saved_mb:.2f} MB!")
print("=" * 50)
