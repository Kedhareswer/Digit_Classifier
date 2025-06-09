import io
import numpy as np
import os
import json
import base64
import logging
import cv2
import scipy.ndimage
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from tensorflow import keras
from PIL import Image, ImageOps
from typing import Dict, List, Optional, Union
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Digit Recognition API",
    description="API for handwritten digit recognition using deep learning",
    version="1.0.0"
)

# Standardized environment variable naming
API_ALLOWED_ORIGINS = os.getenv("API_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
API_MODEL_PATH = os.getenv("API_MODEL_PATH", os.path.join(os.path.dirname(__file__), "model", "mnist_model.keras"))
API_MODEL_VERSION = os.getenv("API_MODEL_VERSION", "1.0.0")
API_ENABLE_AUGMENTATION = os.getenv("API_ENABLE_AUGMENTATION", "true").lower() == "true"
API_DEBUG_MODE = os.getenv("API_DEBUG_MODE", "false").lower() == "true"
API_MIN_CONTOUR_SIZE = int(os.getenv("API_MIN_CONTOUR_SIZE", "10"))
API_MAX_CONCURRENT_PREDICTIONS = int(os.getenv("API_MAX_CONCURRENT_PREDICTIONS", "10"))

logger.info(f"Allowed origins for CORS: {API_ALLOWED_ORIGINS}")
logger.info(f"Model path: {API_MODEL_PATH}")
logger.info(f"Augmentation enabled: {API_ENABLE_AUGMENTATION}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=API_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Global variables
model = None

# Create a semaphore for limiting concurrent predictions
prediction_semaphore = asyncio.Semaphore(API_MAX_CONCURRENT_PREDICTIONS)

# Thread pool for CPU-bound operations
thread_pool = ThreadPoolExecutor(max_workers=API_MAX_CONCURRENT_PREDICTIONS)

def load_model():
    """Load the model with proper error handling"""
    global model
    try:
        logger.info(f"Loading model from {API_MODEL_PATH}")
        if not os.path.exists(API_MODEL_PATH):
            logger.error(f"Model file not found at {API_MODEL_PATH}")
            raise FileNotFoundError(f"Model file not found at {API_MODEL_PATH}")
        
        model = keras.models.load_model(API_MODEL_PATH)
        logger.info("Model loaded successfully")
        return model
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        raise e

# Try to load the model at startup
try:
    model = load_model()
except Exception as e:
    logger.error(f"Error loading model at startup: {str(e)}")
    # We'll continue running the app, but model-dependent endpoints will fail
    # until the model is successfully loaded

def preprocess_digit(img_np):
    """Preprocess a digit image for model input with error handling"""
    try:
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
        
        # Handle case with no contours
        if not contours:
            logger.warning("No contours found in the image")
            arr = np.zeros((1, 28, 28, 1), dtype=np.float32)
            img_b64 = base64.b64encode(np.zeros((28, 28), dtype=np.uint8)).decode()
            return arr, img_b64
            
        # Get bounding rectangle for all contours
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
        
    except Exception as e:
        logger.error(f"Error in preprocessing digit: {str(e)}")
        # Return a blank image in case of error
        arr = np.zeros((1, 28, 28, 1), dtype=np.float32)
        img_b64 = base64.b64encode(np.zeros((28, 28), dtype=np.uint8)).decode()
        return arr, img_b64

def augment_and_predict(img_arr, model, enable_augmentation=None):
    """
    Augment input (shift, rotate, thicken) and average model predictions.
    
    Args:
        img_arr: Input image array of shape (1, 28, 28, 1)
        model: Keras model for prediction
        enable_augmentation: Whether to use augmentation (overrides global setting)
        
    Returns:
        Averaged predictions array
    """
    try:
        # Use parameter if provided, otherwise use global setting
        use_augmentation = API_ENABLE_AUGMENTATION if enable_augmentation is None else enable_augmentation
        
        # Make prediction on original image
        preds = model.predict(img_arr)
        
        if not use_augmentation:
            return preds[0]
        
        # Create augmented versions
        augmented_images = [img_arr]  # Start with original
        
        # Shift left
        shift_left = np.roll(img_arr.copy(), -1, axis=2)
        shift_left[0, :, -1, 0] = 0
        augmented_images.append(shift_left)
        
        # Shift right
        shift_right = np.roll(img_arr.copy(), 1, axis=2)
        shift_right[0, :, 0, 0] = 0
        augmented_images.append(shift_right)
        
        # Shift up
        shift_up = np.roll(img_arr.copy(), -1, axis=1)
        shift_up[0, -1, :, 0] = 0
        augmented_images.append(shift_up)
        
        # Shift down
        shift_down = np.roll(img_arr.copy(), 1, axis=1)
        shift_down[0, 0, :, 0] = 0
        augmented_images.append(shift_down)
        
        # Rotate slightly
        rotated = scipy.ndimage.rotate(img_arr[0, :, :, 0], 10, reshape=False)
        rotated = np.expand_dims(np.expand_dims(rotated, axis=0), axis=-1)
        augmented_images.append(rotated)
        
        # Thicken
        kernel = np.ones((2, 2), np.uint8)
        thickened = cv2.dilate(img_arr[0, :, :, 0], kernel, iterations=1)
        thickened = np.expand_dims(np.expand_dims(thickened, axis=0), axis=-1)
        augmented_images.append(thickened)
        
        # Combine all augmented images into a batch
        batch = np.vstack(augmented_images)
        
        # Get predictions for all augmented images
        all_preds = model.predict(batch)
        
        # Average the predictions
        preds_arr = np.mean(all_preds, axis=0)
        
        return preds_arr
    except Exception as e:
        logger.error(f"Error in augment_and_predict: {str(e)}")
        # Return original prediction if augmentation fails
        return model.predict(img_arr)[0]

@app.post("/predict")
async def predict(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """Predict a single digit with improved preprocessing and smoothing.
    Uses a semaphore to limit concurrent predictions."""
    # Use semaphore to limit concurrent predictions
    async with prediction_semaphore:
        try:
            # Check if model is loaded
            if model is None:
                raise HTTPException(status_code=503, detail="Model not available. Please try again later.")
            
            # Read and process image
            image_bytes = await file.read()
            image = Image.open(io.BytesIO(image_bytes)).convert("L")
            
            # Save input for debugging (optional in production)
            if API_DEBUG_MODE:
                image.save("debug_input.png")
            
            # Preprocess the image
            img_np = np.array(image)
            arr, img_b64 = preprocess_digit(img_np)
            
            # Save preprocessed for debugging
            if API_DEBUG_MODE:
                with open("debug_preprocessed.png", "wb") as f:
                    f.write(base64.b64decode(img_b64))
            
            # Make prediction with augmentation
            preds = augment_and_predict(arr, model)
            digit = int(np.argmax(preds))
            confidence = float(np.max(preds))
            
            # Get top-3 alternatives
            top_indices = preds[0].argsort()[-3:][::-1]
            alternatives = [
                {"digit": int(i), "confidence": float(preds[0][i])}
                for i in top_indices if i != digit
            ]
            
            # Return standardized response
            return {
                "success": True,
                "digit": digit,
                "confidence": confidence,
                "alternatives": alternatives,
                "preprocessed_image": img_b64
            }
        except HTTPException:
            # Re-raise HTTP exceptions without modifying them
            raise
        except Exception as e:
            logger.error(f"Error in predict endpoint: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": model is not None
    }


@app.get("/model-info")
def model_info():
    """Return information about the current model."""
    try:
        info = {
            "success": True,
            "model_file": os.path.basename(API_MODEL_PATH),
            "model_path": API_MODEL_PATH,
            "model_version": API_MODEL_VERSION,
            "description": "Custom-trained MNIST digit classifier.",
            "model_loaded": model is not None,
            "augmentation_enabled": API_ENABLE_AUGMENTATION
        }
        
        # Add file information if model exists
        if os.path.exists(API_MODEL_PATH):
            try:
                stat = os.stat(API_MODEL_PATH)
                info["file_size_bytes"] = stat.st_size
                info["file_size_mb"] = round(stat.st_size / (1024 * 1024), 2)
                info["last_modified"] = stat.st_mtime
                # Format the last modified date for better readability
                from datetime import datetime
                info["last_modified_formatted"] = datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
            except Exception as e:
                logger.warning(f"Could not get file stats: {str(e)}")
        else:
            info["model_exists"] = False
            
        return info
    except Exception as e:
        logger.error(f"Error in model_info endpoint: {str(e)}")
        return {"success": False, "error": str(e)}

@app.post("/predict-multi")
async def predict_multi(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """
    Detect and predict multiple digits in a single image.
    Returns a list of predictions with bounding boxes.
    Uses a semaphore to limit concurrent predictions.
    """
    # Use semaphore to limit concurrent predictions
    async with prediction_semaphore:
        try:
            # Check if model is loaded
            if model is None:
                raise HTTPException(status_code=503, detail="Model not available. Please try again later.")
            
            # Read and process image
            image_bytes = await file.read()
            image = Image.open(io.BytesIO(image_bytes)).convert("L")
            
            # Save input for debugging (optional in production)
            if API_DEBUG_MODE:
                image.save("debug_multi_input.png")

            # Convert to numpy and binarize
            img_np = np.array(image)
            _, thresh = cv2.threshold(img_np, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

            # Find contours (external only)
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            results = []
            min_contour_size = API_MIN_CONTOUR_SIZE
        
            for cnt in contours:
                x, y, w, h = cv2.boundingRect(cnt)
                # Ignore very small contours (noise)
                if w < min_contour_size or h < min_contour_size:
                    continue
                    
                # Extract and preprocess the digit
                digit_img = img_np[y:y+h, x:x+w]
                arr, img_b64 = preprocess_digit(digit_img)
                
                # Save preprocessed for debugging
                if API_DEBUG_MODE:
                    with open(f"debug_multi_pre_{x}_{y}.png", "wb") as f:
                        f.write(base64.b64decode(img_b64))
            
                # Make prediction (without augmentation for speed in multi-digit mode)
                preds = model.predict(arr, verbose=0)
                digit = int(np.argmax(preds))
                confidence = float(np.max(preds))
                
                # Get top-3 alternatives
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
            
            # Return standardized response
            response = {
                "success": True,
                "predictions": results,
                "count": len(results)
            }
            
            # Add a warning if no digits were detected
            if len(results) == 0:
                response["warning"] = "No digits detected in the image"
                
            return response
            
        except HTTPException:
            # Re-raise HTTP exceptions without modifying them
            raise
        except Exception as e:
            logger.error(f"Error in predict-multi endpoint: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Multi-digit prediction failed: {str(e)}")

