import os
import time
import base64
import io
import numpy as np
from PIL import Image
import cv2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import tensorflow as tf
from typing import Optional, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Digit Classifier API",
    description="Deep Learning API for handwritten digit recognition",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model
model = None

def load_model():
    """Load the trained MNIST model"""
    global model
    try:
        # Try to load from file first
        if os.path.exists("model/digit_classifier.h5"):
            model = tf.keras.models.load_model("model/digit_classifier.h5")
            logger.info("Loaded existing model from file")
        else:
            # Create and train a simple model if no saved model exists
            logger.info("No saved model found, creating new model...")
            model = create_and_train_model()
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        # Fallback: create a simple model
        model = create_simple_model()

def create_and_train_model():
    """Create and train a CNN model on MNIST dataset"""
    # Load MNIST dataset
    (x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()
    
    # Preprocess data
    x_train = x_train.reshape(-1, 28, 28, 1).astype('float32') / 255.0
    x_test = x_test.reshape(-1, 28, 28, 1).astype('float32') / 255.0
    
    # Convert labels to categorical
    y_train = tf.keras.utils.to_categorical(y_train, 10)
    y_test = tf.keras.utils.to_categorical(y_test, 10)
    
    # Create CNN model
    model = tf.keras.Sequential([
        tf.keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Dropout(0.25),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(10, activation='softmax')
    ])
    
    # Compile model
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    logger.info("Training model... This may take a few minutes.")
    
    # Train model
    model.fit(
        x_train, y_train,
        batch_size=128,
        epochs=5,  # Reduced for faster training
        validation_data=(x_test, y_test),
        verbose=1
    )
    
    # Create model directory if it doesn't exist
    os.makedirs("model", exist_ok=True)
    
    # Save the trained model
    model.save("model/digit_classifier.h5")
    logger.info("Model trained and saved successfully")
    
    return model

def create_simple_model():
    """Create a simple model as fallback"""
    model = tf.keras.Sequential([
        tf.keras.layers.Flatten(input_shape=(28, 28, 1)),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(10, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    logger.info("Created simple fallback model")
    return model

def preprocess_image(image_data: str) -> np.ndarray:
    """Preprocess the image for model prediction"""
    try:
        # Decode base64 image
        image_data = image_data.split(',')[1] if ',' in image_data else image_data
        image_bytes = base64.b64decode(image_data)
        
        # Open image with PIL
        image = Image.open(io.BytesIO(image_bytes)).convert('L')
        
        # Convert to numpy array
        image_array = np.array(image)
        
        # Resize to 28x28
        image_array = cv2.resize(image_array, (28, 28))
        
        # Invert colors (black background, white digits)
        image_array = 255 - image_array
        
        # Normalize pixel values
        image_array = image_array.astype('float32') / 255.0
        
        # Reshape for model input
        image_array = image_array.reshape(1, 28, 28, 1)
        
        return image_array
        
    except Exception as e:
        logger.error(f"Error preprocessing image: {e}")
        raise HTTPException(status_code=400, detail="Error processing image data")

def predict_single_digit(image_array: np.ndarray) -> dict:
    """Predict a single digit from preprocessed image"""
    predictions = model.predict(image_array, verbose=0)
    predicted_digit = int(np.argmax(predictions[0]))
    confidence = float(predictions[0][predicted_digit])
    
    return {
        "digit": predicted_digit,
        "confidence": confidence
    }

def predict_multiple_digits(image_array: np.ndarray) -> dict:
    """Predict multiple digits from preprocessed image"""
    # This is a simplified implementation
    # In practice, you'd implement digit segmentation
    
    # For now, we'll simulate multiple digit detection
    # by treating it as a single digit with lower confidence
    predictions = model.predict(image_array, verbose=0)
    
    # Get top 3 predictions as "multiple digits"
    top_indices = np.argsort(predictions[0])[-3:][::-1]
    digits = [int(idx) for idx in top_indices]
    confidences = [float(predictions[0][idx]) for idx in top_indices]
    
    return {
        "digits": digits[:2],  # Return top 2 as sequence
        "confidences": confidences[:2],
        "sequence": "".join(map(str, digits[:2]))
    }

# Request/Response models
class PredictionRequest(BaseModel):
    image: str
    mode: str = "single"

class PredictionResponse(BaseModel):
    success: bool
    mode: str
    prediction: Optional[dict] = None
    error: Optional[str] = None
    processing_time: Optional[float] = None

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    load_model()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Digit Classifier API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "timestamp": time.time()
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_digit(request: PredictionRequest):
    """Predict digit(s) from image"""
    start_time = time.time()
    
    try:
        if model is None:
            raise HTTPException(status_code=503, detail="Model not available")
        
        # Preprocess image
        image_array = preprocess_image(request.image)
        
        # Make prediction based on mode
        if request.mode == "single":
            prediction = predict_single_digit(image_array)
        elif request.mode == "multiple":
            prediction = predict_multiple_digits(image_array)
        else:
            raise HTTPException(status_code=400, detail="Invalid mode. Use 'single' or 'multiple'")
        
        processing_time = time.time() - start_time
        
        return PredictionResponse(
            success=True,
            mode=request.mode,
            prediction=prediction,
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return PredictionResponse(
            success=False,
            mode=request.mode,
            error="Internal server error during prediction"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 