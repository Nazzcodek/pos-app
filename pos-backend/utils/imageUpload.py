from PIL import Image
import os
import uuid

UPLOAD_FOLDER = "uploads/"

def save_thumbnail(image_file, folder="products"):
    """Save uploaded image as a thumbnail locally and return file path."""
    if not os.path.exists(os.path.join(UPLOAD_FOLDER, folder)):
        os.makedirs(os.path.join(UPLOAD_FOLDER, folder))

    filename = f"{uuid.uuid4().hex}.png"  # Generate unique filename with .png extension
    filepath = os.path.join(UPLOAD_FOLDER, folder, filename)

    # Open image and resize to 200x200
    image = Image.open(image_file)
    image.thumbnail((200, 200))

    # Convert image to RGBA if it has an alpha channel, otherwise convert to RGB
    if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
        image = image.convert("RGBA")
    else:
        image = image.convert("RGB")

    image.save(filepath, "PNG")

    return filepath  # Return the image path for DB storage