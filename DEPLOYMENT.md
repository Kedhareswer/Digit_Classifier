# Deployment Guide for Digit Classifier

This guide explains how to deploy the Digit Classifier application on Render.

## Prerequisites

- [Render](https://render.com/) account
- The MNIST model file (`mnist_model.keras`) placed in the `backend/model/` directory
- Git repository with your code

## Environment Variables

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `API_MODEL_PATH` | Path to the model file | `model/mnist_model.keras` |
| `API_MODEL_VERSION` | Version of the model | `1.0` |
| `API_ALLOWED_ORIGINS` | Comma-separated list of allowed origins for CORS | `https://digit-classifier-app.onrender.com` |
| `API_ENABLE_AUGMENTATION` | Whether to use augmentation for predictions | `true` |
| `API_DEBUG_MODE` | Enable debug mode to save intermediate images | `false` |
| `API_MIN_CONTOUR_SIZE` | Minimum size for contours in multi-digit detection | `10` |
| `API_MAX_CONCURRENT_PREDICTIONS` | Maximum number of concurrent prediction requests | `10` |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL of the backend API | `https://digit-classifier-api.onrender.com` |

## Deployment on Render

Render provides an easy way to deploy both the frontend and backend services with automatic CI/CD from your Git repository.

### Using render.yaml (Recommended)

The easiest way to deploy both the frontend and backend together:

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Log in to your Render account
3. Click on "New" and select "Blueprint"
4. Connect your Git repository
5. Render will automatically detect the `render.yaml` file and set up both services

The deployment will automatically:  
- Build and deploy the backend FastAPI service
- Build and deploy the frontend Next.js application
- Configure environment variables
- Set up the connection between frontend and backend

### 2. Manual Service Deployment

If you want to deploy the frontend and backend separately on Render:

#### Backend:

1. Log in to your Render account
2. Click on "New" and select "Web Service"
3. Connect your Git repository
4. Configure the service:
   - Name: `digit-classifier-api`
   - Environment: `Python`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT`
   - Add the environment variables listed in the table above

#### Frontend:

1. Log in to your Render account
2. Click on "New" and select "Web Service"
3. Connect your Git repository
4. Configure the service:
   - Name: `digit-classifier-app`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Add the environment variable `NEXT_PUBLIC_API_URL` with the URL of your backend service

## Health Checks

The backend provides a health check endpoint at `/health` for Render's health monitoring and a `/model-info` endpoint that returns information about the model status.

## Scaling Considerations

- Render automatically scales your web services based on your plan
- For high traffic, consider upgrading to a paid plan for better performance
- The backend's semaphore-based concurrency control helps manage load even on the free tier

## Troubleshooting

### Common Issues

1. **Model not found error**:
   - Ensure the model file exists at the specified `API_MODEL_PATH`
   - Check that the model file was properly uploaded to Render

2. **CORS errors**:
   - Verify that the frontend URL is included in the `API_ALLOWED_ORIGINS` environment variable
   - Make sure the URL format is correct (including https://)

3. **Service fails to start**:
   - Check the service logs in the Render dashboard
   - Ensure all required environment variables are set correctly

4. **Slow initial response**:
   - Free tier services on Render spin down after inactivity
   - The first request after inactivity may take longer due to cold start

### Logs

- Backend logs can be viewed with: `docker logs <backend-container-id>`
- Frontend logs can be viewed with: `docker logs <frontend-container-id>`
