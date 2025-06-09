import io
import numpy as np
import os
import json
import base64
import logging
import cv2
import scipy.ndimage
import time
import asyncio
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool
from tensorflow import keras
from PIL import Image, ImageOps
from typing import Dict, List, Optional, Union, Callable
from fastapi.middleware import Middleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Create a semaphore to limit concurrent requests
PROCESSING_SEMAPHORE_SIZE = int(os.getenv("PROCESSING_CONCURRENCY", "5"))
processing_semaphore = asyncio.Semaphore(PROCESSING_SEMAPHORE_SIZE)

# Rate limiting configuration
MAX_REQUESTS_PER_MINUTE = int(os.getenv("MAX_REQUESTS_PER_MINUTE", "60"))
request_counts = {}

# Standardized environment variable names
MODEL_PATH = os.getenv("MODEL_PATH", "./model/mnist_model.h5")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
MODEL_VERSION = os.getenv("MODEL_VERSION", "1.0.0")
ENABLE_AUGMENTATION = os.getenv("ENABLE_AUGMENTATION", "true").lower() == "true"
MIN_CONTOUR_SIZE = int(os.getenv("MIN_CONTOUR_SIZE", "10"))

# Detect if running on Heroku
ON_HEROKU = "DYNO" in os.environ
PORT = int(os.environ.get("PORT", 8000)) if ON_HEROKU else 8000

# Rate limiting middleware
class RateLimitMiddleware:
    async def __call__(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host
        current_time = time.time()
        minute_ago = current_time - 60
        
        # Clean up old requests
        for ip in list(request_counts.keys()):
            request_counts[ip] = [timestamp for timestamp in request_counts[ip] if timestamp > minute_ago]
            if not request_counts[ip]:
                del request_counts[ip]
        
        # Check rate limit
        if client_ip in request_counts and len(request_counts[client_ip]) >= MAX_REQUESTS_PER_MINUTE:
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": "Rate limit exceeded. Please try again later."
                }
            )
        
        # Add request timestamp
        if client_ip not in request_counts:
            request_counts[client_ip] = []
        request_counts[client_ip].append(current_time)
        
        # Process the request
        return await call_next(request)

# Initialize FastAPI with middleware
app = FastAPI(
    title="Digit Recognition API",
    description="API for handwritten digit recognition using deep learning",
    version="1.0.0",
    middleware=[Middleware(RateLimitMiddleware)]
)

# CORS configuration - more secure than allowing all origins
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
logger.info(f"Allowed origins for CORS: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Model configuration
MODEL_PATH = os.getenv("MODEL_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "../mnist_final_model.keras")))
MODEL_VERSION = os.getenv("MODEL_VERSION", "1.0.0")

# Global variable to store the model
model = None

# Flag to control augmentation (can be set via environment variable)
ENABLE_AUGMENTATION = os.getenv("ENABLE_AUGMENTATION", "true").lower() == "true"

def load_model():
    """Load the model with proper error handling"""
    global model
    try:
        logger.info(f"Loading model from {MODEL_PATH}")
        if not os.path.exists(MODEL_PATH):
            logger.error(f"Model file not found at {MODEL_PATH}")
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
        
        model = keras.models.load_model(MODEL_PATH)
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
    """Augment input (shift, rotate, thicken) and average model predictions.
    
    Args:
        img_arr: Input image array of shape (1, 28, 28, 1)
        model: Keras model for prediction
        enable_augmentation: Whether to use augmentation (overrides global setting)
        
    Returns:
        Averaged predictions array
    """
    if model is None:
        logger.error("Model not loaded, cannot make predictions")
        raise HTTPException(status_code=503, detail="Model not available")
        
    # Use parameter if provided, otherwise use global setting
    use_augmentation = ENABLE_AUGMENTATION if enable_augmentation is None else enable_augmentation
    
    try:
        # Always include the original image prediction
        preds = [model.predict(img_arr, verbose=0)]  # Suppress verbose output
        
        # Skip augmentation if disabled
        if not use_augmentation:
            return preds[0]
            
        # Reshape for augmentation
        img = img_arr.reshape(28, 28)
        
        # Shifts - more efficient with fewer shifts
        from scipy.ndimage import shift, rotate
        for dx, dy in [(-2,0), (2,0)]:
            shifted = shift(img, shift=(dy,dx), mode='constant', cval=0)
            preds.append(model.predict(shifted.reshape(1,28,28,1), verbose=0))
        
        # Rotations - just one rotation is often sufficient
        rotated = rotate(img, 10, reshape=False, mode='constant', cval=0)
        preds.append(model.predict(rotated.reshape(1,28,28,1), verbose=0))
        
        # Thicken
        thick = cv2.dilate((img*255).astype(np.uint8), np.ones((2,2),np.uint8), iterations=1)
        preds.append(model.predict(thick.reshape(1,28,28,1)/255.0, verbose=0))
        
        # Average predictions
        preds_arr = np.mean(np.array(preds), axis=0)
        return preds_arr
        
    except Exception as e:
        logger.error(f"Error in augment_and_predict: {str(e)}")
        # Return the original prediction if augmentation fails
        return model.predict(img_arr, verbose=0)


async def save_debug_image(img_b64):
    """Save debug image in background task"""
    try:
        with open("debug_preprocessed.png", "wb") as f:
            f.write(base64.b64decode(img_b64))
    except Exception as e:
        logger.error(f"Error saving debug image: {str(e)}")


async def save_debug_multi_result(img_np, results):
    """Save debug visualization for multi-digit prediction"""
    try:
        # Create a color version of the image for visualization
        debug_img = cv2.cvtColor(img_np, cv2.COLOR_GRAY2BGR)
        
        # Draw bounding boxes and predictions on the image
        for res in results:
            bbox = res["bounding_box"]
            x, y = bbox["x"], bbox["y"]
            w, h = bbox["width"], bbox["height"]
            digit, conf = res["digit"], res["confidence"]
            
            # Draw bounding box
            cv2.rectangle(debug_img, (x, y), (x+w, y+h), (0, 255, 0), 2)
            
            # Put text (digit and confidence)
            cv2.putText(debug_img, f"{digit} ({conf:.2f})", (x, y-5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        # Save the visualization
        cv2.imwrite("debug_multi_result.png", debug_img)
        
        logger.debug(f"Saved debug visualization with {len(results)} digits")
    except Exception as e:
        logger.error(f"Error saving debug multi result: {str(e)}")


@app.post("/predict")
async def predict(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """Predict a single digit with improved preprocessing and smoothing.
    Uses a semaphore to queue requests and prevent overloading the server.
    """
    # Use semaphore to limit concurrent processing
    async with processing_semaphore:
        start_time = time.time()
        try:
            # Check if model is loaded
            if model is None:
                raise HTTPException(status_code=503, detail="Model not available. Please try again later.")
            
            # Read and process image
            image_bytes = await file.read()
            image = Image.open(io.BytesIO(image_bytes)).convert("L")
            
            # Save input for debugging (optional in production)
            if DEBUG:
                image.save("debug_input.png")
            
            # Preprocess the image using threadpool to not block event loop
            img_np = np.array(image)
            arr, img_b64 = await run_in_threadpool(preprocess_digit, img_np)
            
            # Save preprocessed for debugging
            if DEBUG:
                background_tasks = background_tasks or BackgroundTasks()
                background_tasks.add_task(save_debug_image, img_b64)
            
            # Make prediction with augmentation in threadpool
            preds = await run_in_threadpool(augment_and_predict, arr, model)
            digit = int(np.argmax(preds))
            confidence = float(np.max(preds))
            
            # Get top-3 alternatives
            top_indices = preds[0].argsort()[-3:][::-1]
            alternatives = [
                {"digit": int(i), "confidence": float(preds[0][i])}
                for i in top_indices if i != digit
            ]
            
            # Log processing time
            processing_time = time.time() - start_time
            logger.info(f"Single digit prediction completed in {processing_time:.2f}s")
            
            # Return standardized response
            return {
                "success": True,
                "digit": digit,
                "confidence": confidence,
                "alternatives": alternatives,
                "preprocessed_image": img_b64,
                "processing_time_ms": int(processing_time * 1000)
            }
        except HTTPException as e:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            logger.error(f"Error in predict endpoint: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/model-info")
def model_info():
    """Return information about the current model."""
    try:
        info = {
            "success": True,
            "model_file": os.path.basename(MODEL_PATH),
            "model_path": MODEL_PATH,
            "model_version": MODEL_VERSION,
            "description": "Custom-trained MNIST digit classifier.",
            "model_loaded": model is not None,
            "augmentation_enabled": ENABLE_AUGMENTATION
        }
        
        # Add file information if model exists
        if os.path.exists(MODEL_PATH):
            try:
                stat = os.stat(MODEL_PATH)
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
    Uses a semaphore to queue requests and prevent overloading the server.
    """
    # Use semaphore to limit concurrent processing
    async with processing_semaphore:
        start_time = time.time()
        try:
            # Check if model is loaded
            if model is None:
                raise HTTPException(status_code=503, detail="Model not available. Please try again later.")
            
            # Read and process image
            image_bytes = await file.read()
            image = Image.open(io.BytesIO(image_bytes)).convert("L")
            
            # Save input for debugging (optional in production)
            if DEBUG:
                image.save("debug_multi_input.png")

            # Convert to numpy and binarize - use threadpool for CPU-intensive operations
            img_np = np.array(image)
            # This threshold operation can be CPU intensive for large images
            thresh_result = await run_in_threadpool(
                lambda: cv2.threshold(img_np, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            )
            _, thresh = thresh_result

            # Find contours (external only) - another CPU-intensive operation
            contour_result = await run_in_threadpool(
                lambda: cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            )
            contours, _ = contour_result

            results = []
            
            # Process each contour in threadpool to avoid blocking
            async def process_contour(cnt):
                x, y, w, h = cv2.boundingRect(cnt)
                
                # Skip very small boxes (noise)
                if w < MIN_CONTOUR_SIZE or h < MIN_CONTOUR_SIZE:
                    return None
                
                # Extract the digit
                roi = thresh[y:y+h, x:x+w]
                
                # Add padding (margin) - helps with model accuracy
                margin = int(max(w, h) * 0.2)  # 20% padding
                padded_roi = np.pad(roi, ((margin, margin), (margin, margin)), 'constant')
                
                # Preprocess the digit
                digit_arr, digit_b64 = await run_in_threadpool(preprocess_digit, padded_roi)
                
                # Make prediction with augmentation
                preds = await run_in_threadpool(augment_and_predict, digit_arr, model)
                digit = int(np.argmax(preds))
                confidence = float(np.max(preds))
                
                # Return result
                return {
                    "digit": digit,
                    "confidence": confidence,
                    "bounding_box": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)}
                }
            
            # Process all contours sequentially to avoid excessive parallelism
            contour_results = []
            for cnt in contours:
                result = await process_contour(cnt)
                if result:
                    contour_results.append(result)
            
            # Sort by x coordinate (left to right reading order)
            results = sorted(contour_results, key=lambda x: x["bounding_box"]["x"])
            
            # Save debug visualization
            if DEBUG:
                background_tasks = background_tasks or BackgroundTasks()
                background_tasks.add_task(save_debug_multi_result, img_np, results)
            
            # Log processing time
            processing_time = time.time() - start_time
            logger.info(f"Multi-digit prediction completed in {processing_time:.2f}s with {len(results)} digits")
            
            # Prepare final response
            final_output = {
                "success": True,
                "count": len(results),
                "predictions": results,
                "processing_time_ms": int(processing_time * 1000)
            }
            
            # Add the combined digits as a string if any found
            if results:
                final_output["number"] = "".join(str(r["digit"]) for r in results)
                
            return final_output
            
        except HTTPException as e:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            logger.error(f"Error in predict_multi endpoint: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Multi-digit prediction failed: {str(e)}")
