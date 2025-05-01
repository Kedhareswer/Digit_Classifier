import io
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from tensorflow import keras
from PIL import Image

app = FastAPI()

# Allow CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
import cv2
import scipy.ndimage
import os
import json
from PIL import ImageOps
import base64

app = FastAPI()

# Allow CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to the model file
MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../mnist_final_model.keras"))
# Load the Keras model once at startup
model = keras.models.load_model(MODEL_PATH)

def preprocess_digit(img_np):
    # 1. Adaptive histogram equalization for contrast
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    img_eq = clahe.apply(img_np)
    # 2. Binarize (invert so digit is white)
    _, img_bin = cv2.threshold(img_eq, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    # 3. Remove small specks/noise
    img_bin = cv2.medianBlur(img_bin, 3)
    # 4. Morphological dilation to thicken strokes
    kernel = np.ones((2,2), np.uint8)
    img_thick = cv2.dilate(img_bin, kernel, iterations=1)
    # 5. Find contours for tight cropping
    contours, _ = cv2.findContours(img_thick, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        arr = np.zeros((1, 28, 28, 1), dtype=np.float32)
        img_b64 = base64.b64encode(np.zeros((28, 28), dtype=np.uint8)).decode()
        return arr, img_b64
    x, y, w, h = cv2.boundingRect(np.vstack(contours))
    digit = img_thick[y:y+h, x:x+w]
    # 6. Pad to make square
    size = max(w, h)
    padded = np.zeros((size, size), dtype=np.uint8)
    dx = (size - w) // 2
    dy = (size - h) // 2
    padded[dy:dy+h, dx:dx+w] = digit
    # 7. Resize to 28x28
    digit_resized = cv2.resize(padded, (28, 28), interpolation=cv2.INTER_AREA)
    # 8. Normalize
    arr = digit_resized.astype(np.float32) / 255.0
    arr = arr.reshape(1, 28, 28, 1)
    # 9. Encode for frontend
    pil_img = Image.fromarray(digit_resized).convert("L")
    buffered = io.BytesIO()
    pil_img.save(buffered, format="PNG")
    img_b64 = base64.b64encode(buffered.getvalue()).decode()
    return arr, img_b64

def augment_and_predict(img_arr, model, n_aug=7):
    """Augment input (shift, rotate, thicken) and average model predictions."""
    from scipy.ndimage import shift, rotate
    preds = []
    img = img_arr.reshape(28,28)
    # Identity
    preds.append(model.predict(img_arr))
    # Shifts
    for dx, dy in [(-2,0), (2,0), (0,-2), (0,2)]:
        shifted = shift(img, shift=(dy,dx), mode='constant', cval=0)
        preds.append(model.predict(shifted.reshape(1,28,28,1)))
    # Rotations
    for angle in [-10, 10]:
        rotated = rotate(img, angle, reshape=False, mode='constant', cval=0)
        preds.append(model.predict(rotated.reshape(1,28,28,1)))
    # Thicken
    thick = cv2.dilate((img*255).astype(np.uint8), np.ones((2,2),np.uint8), iterations=1)
    preds.append(model.predict(thick.reshape(1,28,28,1)/255.0))
    # Average
    preds_arr = np.mean(np.array(preds), axis=0)
    return preds_arr


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Predict a single digit with improved preprocessing and smoothing."""
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("L")
    image.save("debug_input.png")  # For debugging
    img_np = np.array(image)
    arr, img_b64 = preprocess_digit(img_np)
    # Save preprocessed for debugging
    with open("debug_preprocessed.png", "wb") as f:
        f.write(base64.b64decode(img_b64))
    preds = augment_and_predict(arr, model)
    digit = int(np.argmax(preds))
    confidence = float(np.max(preds))
    # Optionally, return top-3 alternatives
    top_indices = preds[0].argsort()[-3:][::-1]
    alternatives = [
        {"digit": int(i), "confidence": float(preds[0][i])}
        for i in top_indices if i != digit
    ]
    return {
        "digit": digit,
        "confidence": confidence,
        "alternatives": alternatives,
        "preprocessed_image": img_b64
    }

@app.get("/model-info")
def model_info():
    """Return information about the current model."""
    info = {
        "model_file": os.path.basename(MODEL_PATH),
        "model_path": MODEL_PATH,
        "description": "Custom-trained MNIST digit classifier.",
    }
    # Optionally, add more info (file size, last modified)
    try:
        stat = os.stat(MODEL_PATH)
        info["file_size_bytes"] = stat.st_size
        info["last_modified"] = stat.st_mtime
    except Exception:
        pass
    return info

@app.post("/predict-multi")
async def predict_multi(file: UploadFile = File(...)):
    """
    Detect and predict multiple digits in a single image.
    Returns a list of predictions with bounding boxes.
    """
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("L")
    image.save("debug_multi_input.png")  # For debugging

    # Convert to numpy and binarize
    img_np = np.array(image)
    _, thresh = cv2.threshold(img_np, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Find contours (external only)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    results = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        # Ignore very small contours (noise)
        if w < 10 or h < 10:
            continue
        digit_img = img_np[y:y+h, x:x+w]
        arr, img_b64 = preprocess_digit(digit_img)
        # Save preprocessed for debugging
        with open(f"debug_multi_pre_{x}_{y}.png", "wb") as f:
            f.write(base64.b64decode(img_b64))
        preds = model.predict(arr)
        digit = int(np.argmax(preds))
        confidence = float(np.max(preds))
        # Optionally, return top-3 alternatives
        top_indices = preds[0].argsort()[-3:][::-1]
        alternatives = [
            {"digit": int(i), "confidence": float(preds[0][i])}
            for i in top_indices if i != digit
        ]
        results.append({
            "digit": digit,
            "confidence": confidence,
            "boundingBox": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
            "alternatives": alternatives,
            "preprocessed_image": img_b64
        })

    # Sort left-to-right for visual order
    results = sorted(results, key=lambda r: r["boundingBox"]["x"])
    return {"predictions": results}

