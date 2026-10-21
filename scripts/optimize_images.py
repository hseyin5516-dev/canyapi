import os
import glob
from PIL import Image

def optimize_images():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    images_dir = os.path.join(base_dir, 'images')

    valid_extensions = ('.jpg', '.jpeg', '.png')
    converted_count = 0
    total_orig_size = 0
    total_webp_size = 0

    for root, dirs, files in os.walk(images_dir):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in valid_extensions and not f.endswith('.webp'):
                if 'favicon' in f.lower():
                    continue  # Keep favicon PNG/ICO as is
                
                src_path = os.path.join(root, f)
                webp_path = os.path.splitext(src_path)[0] + '.webp'

                orig_size = os.path.getsize(src_path)
                total_orig_size += orig_size

                try:
                    with Image.open(src_path) as im:
                        # Auto-orient if EXIF is present
                        try:
                            from PIL import ImageOps
                            im = ImageOps.exif_transpose(im)
                        except Exception:
                            pass

                        # Resize if excessively large (e.g. over 1920px wide)
                        max_w, max_h = 1920, 1920
                        if im.width > max_w or im.height > max_h:
                            im.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)

                        # Determine if RGBA or RGB
                        if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
                            im.save(webp_path, 'WEBP', quality=85, method=6)
                        else:
                            rgb_im = im.convert('RGB')
                            rgb_im.save(webp_path, 'WEBP', quality=82, method=6)

                    webp_size = os.path.getsize(webp_path)
                    total_webp_size += webp_size
                    converted_count += 1
                    rel_src = os.path.relpath(src_path, base_dir)
                    print(f"Converted: {rel_src} ({orig_size // 1024} KB -> {webp_size // 1024} KB)")
                except Exception as e:
                    print(f"Error converting {src_path}: {e}")

    orig_mb = total_orig_size / (1024 * 1024)
    webp_mb = total_webp_size / (1024 * 1024)
    savings = orig_mb - webp_mb
    percent = (savings / orig_mb * 100) if orig_mb > 0 else 0
    print("\n" + "=" * 50)
    print(f"Toplam Dönüştürülen: {converted_count} görsel")
    print(f"Orijinal Toplam Boyut: {orig_mb:.2f} MB")
    print(f"WebP Toplam Boyut: {webp_mb:.2f} MB")
    print(f"Kazanılan Tasarruf: {savings:.2f} MB (%{percent:.1f} Küçülme!)")
    print("=" * 50)

if __name__ == '__main__':
    optimize_images()
