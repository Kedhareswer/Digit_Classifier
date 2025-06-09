FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV MODEL_PATH=/app/model/mnist_model.h5
ENV MODEL_VERSION=1.0.0
ENV ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ENV ENABLE_AUGMENTATION=true
ENV DEBUG=false

# Create model directory
RUN mkdir -p /app/model

# Expose the port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
