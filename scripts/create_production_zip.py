import os
import zipfile

ZIP_NAME = "canyapi_cpanel_kurulum.zip"
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

INCLUDE_DIRS = ["api", "data", "uploads", "css", "js", "images"]
INCLUDE_EXTENSIONS = [".html", ".txt", ".xml", ".ico", ".htaccess"]
EXCLUDE_DIRS = [".git", ".vercel", "scripts", "farklı resimler", "resimler", "videolar", "__pycache__"]

def should_include_file(root, filename):
    rel_root = os.path.relpath(root, BASE_DIR)
    
    # Excluded directories
    for exc in EXCLUDE_DIRS:
        if rel_root == exc or rel_root.startswith(exc + os.sep) or rel_root.startswith(exc + "/"):
            return False

    # Root files
    if rel_root == ".":
        if filename.startswith(".") and filename != ".htaccess":
            return False
        if filename.endswith(".zip"):
            return False
        for ext in INCLUDE_EXTENSIONS:
            if filename.endswith(ext) or filename == ".htaccess":
                return True
        return False

    # Subdirectories
    top_dir = rel_root.split(os.sep)[0].split("/")[0]
    if top_dir in INCLUDE_DIRS:
        # In images directory: exclude heavy old JPG/PNG that now have a WebP version
        if top_dir == "images":
            ext = os.path.splitext(filename)[1].lower()
            if ext in ('.jpg', '.jpeg', '.png') and 'favicon' not in filename.lower():
                # Check if a .webp counterpart exists
                webp_counterpart = os.path.splitext(os.path.join(root, filename))[0] + '.webp'
                if os.path.exists(webp_counterpart):
                    return False  # Omit redundant old heavy JPG/PNG
        return True

    return False

def make_zip():
    zip_path = os.path.join(BASE_DIR, ZIP_NAME)
    if os.path.exists(zip_path):
        os.remove(zip_path)

    total_files = 0
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(BASE_DIR):
            for file in files:
                if should_include_file(root, file):
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, BASE_DIR)
                    zipf.write(full_path, rel_path)
                    total_files += 1

    size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    print(f"ZIP Başarıyla Oluşturuldu: {ZIP_NAME}")
    print(f"Toplam Dosya Sayısı: {total_files}")
    print(f"Yeni Paket Boyutu: {size_mb:.2f} MB")

if __name__ == "__main__":
    make_zip()
