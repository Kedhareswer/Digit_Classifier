# Deployment Guide for Digit Classifier

This guide explains how to deploy the Digit Classifier application in different environments.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- The MNIST model file (`mnist_model.h5`) placed in the `backend/model/` directory

## Environment Variables

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_MODEL_PATH` | Path to the model file | `/app/model/mnist_model.h5` |
| `APP_MODEL_VERSION` | Version of the model | `1.0.0` |
| `APP_ALLOWED_ORIGINS` | Comma-separated list of allowed origins for CORS | `http://localhost:3000,http://127.0.0.1:3000` |
| `APP_ENABLE_AUGMENTATION` | Whether to use augmentation for predictions | `true` |
| `APP_DEBUG_MODE` | Enable debug mode to save intermediate images | `false` |
| `APP_MIN_CONTOUR_SIZE` | Minimum size for contours in multi-digit detection | `10` |
| `APP_MAX_REQUESTS_PER_MINUTE` | Rate limit for API requests per IP | `60` |
| `PROCESSING_CONCURRENCY` | Maximum number of concurrent prediction tasks | `5` |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | URL of the backend API | `http://localhost:8000` |

## Deployment Options

### 1. Docker Compose (Recommended for Production)

The easiest way to deploy both the frontend and backend together:

```bash
# Clone the repository
git clone <repository-url>
cd digit-classifier

# Place your model file in the backend/model directory
mkdir -p backend/model
# Copy your mnist_model.h5 file to backend/model/

# Build and start the containers
docker-compose up -d

# The application will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
```

### 2. Separate Docker Containers

If you want to deploy the frontend and backend separately:

#### Backend:

```bash
cd backend
docker build -t digit-classifier-backend .
docker run -p 8000:8000 -v $(pwd)/model:/app/model -e ALLOWED_ORIGINS=http://your-frontend-url digit-classifier-backend
```

#### Frontend:

```bash
docker build -t digit-classifier-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://your-backend-url:8000 digit-classifier-frontend
```

### 3. Manual Deployment

#### Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

#### Frontend:

```bash
npm install
npm run build
npm start
```

## Health Checks

The backend provides a health check endpoint at `/model-info` that returns information about the model status.

## Scaling Considerations

- The backend can be scaled horizontally behind a load balancer
- Consider using a production-ready database for storing model metadata in a real production environment
- For high traffic, consider implementing a caching layer

## Heroku Deployment

This application is ready for deployment on Heroku. Follow these steps:

### Backend Deployment on Heroku

```bash
# Login to Heroku
heroku login

# Create a new Heroku app
heroku create digit-classifier-api

# Add Heroku remote
git remote add heroku-backend https://git.heroku.com/digit-classifier-api.git

# Push the code (from the main branch)
git push heroku-backend main

# Configure environment variables
heroku config:set APP_MODEL_PATH=./model/mnist_model.h5 --app digit-classifier-api
heroku config:set APP_DEBUG_MODE=false --app digit-classifier-api
heroku config:set APP_ALLOWED_ORIGINS=https://your-frontend-url.com --app digit-classifier-api
heroku config:set APP_MAX_REQUESTS_PER_MINUTE=60 --app digit-classifier-api
heroku config:set PROCESSING_CONCURRENCY=5 --app digit-classifier-api
```

### Model File on Heroku

Since Heroku has an ephemeral filesystem, you'll need to either:

1. Include your model file in your Git repository (if it's small enough)
2. Use a solution like AWS S3 to store and retrieve the model
3. Use Heroku buildpacks to fetch the model during deployment

For larger models, we recommend option 2 or 3.

### Frontend Deployment on Heroku

```bash
# Create a new Heroku app for the frontend
heroku create digit-classifier-frontend

# Add Heroku remote
git remote add heroku-frontend https://git.heroku.com/digit-classifier-frontend.git

# Set the API URL to point to your backend
heroku config:set NEXT_PUBLIC_API_BASE_URL=https://digit-classifier-api.herokuapp.com --app digit-classifier-frontend

# Push the code
git push heroku-frontend main
```

## Troubleshooting

### Common Issues

1. **Model not found error**:
   - Ensure the model file exists at the specified `APP_MODEL_PATH`
   - Check that the volume mount is correct in Docker
   - For Heroku, ensure your model is accessible (included in repo or using S3)

2. **CORS errors**:
   - Verify that the frontend URL is included in the `APP_ALLOWED_ORIGINS` environment variable
   - For Heroku, make sure to use the full https:// URL of your frontend

3. **Container fails to start**:
   - Check the container logs: `docker logs <container_id>` or `heroku logs --tail`
   - Ensure all required environment variables are set

4. **Rate limiting issues**:
   - If users are getting 429 errors, adjust the `APP_MAX_REQUESTS_PER_MINUTE` setting

### Logs

- Backend logs can be viewed with: `docker logs <backend-container-id>` or `heroku logs --tail --app digit-classifier-api`
- Frontend logs can be viewed with: `docker logs <frontend-container-id>` or `heroku logs --tail --app digit-classifier-frontend`
