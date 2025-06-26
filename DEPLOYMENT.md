# 🚀 Deployment Guide

This guide will help you deploy the Digit Classifier Deep Learning application to Vercel/Netlify (frontend) and Render/Railway (backend).

## 📋 Prerequisites

- Node.js 18+ installed
- Python 3.8+ installed  
- Git repository
- Vercel/Netlify account
- Render/Railway account (for backend)

## 🎯 Quick Deployment

### Option 1: Frontend Only (Mock Backend)

Deploy just the frontend with a mock backend response:

1. **Deploy to Vercel:**
   ```bash
   npx vercel --prod
   ```

2. **Deploy to Netlify:**
   ```bash
   npm run build
   # Upload the .next folder to Netlify
   ```

### Option 2: Full Stack Deployment

#### Step 1: Deploy Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - **Build Command:** `cd backend && pip install -r requirements.txt`
   - **Start Command:** `cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Environment:** Python 3.8+

4. Set environment variables (if needed):
   ```
   PYTHON_VERSION=3.8.10
   ```

#### Step 2: Deploy Frontend (Vercel)

1. **Connect Repository:**
   ```bash
   npx vercel
   ```

2. **Set Environment Variables:**
   ```
   BACKEND_URL=https://your-backend-service.onrender.com
   NEXT_PUBLIC_BACKEND_URL=https://your-backend-service.onrender.com
   ```

3. **Deploy:**
   ```bash
   npx vercel --prod
   ```

## 🛠 Local Development

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:
```bash
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Production Environment Variables

For Vercel:
```bash
BACKEND_URL=https://your-backend.onrender.com
NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
```

## 📊 Performance Optimization

### Backend Optimization
- Use a model cache
- Implement request queuing
- Add rate limiting
- Use GPU instances for better performance

### Frontend Optimization
- Images are optimized automatically by Next.js
- Static generation for better performance
- CDN delivery through Vercel/Netlify

## 🐛 Troubleshooting

### Common Issues

1. **Backend Model Loading:**
   - First run may take longer (model training)
   - Subsequent runs use cached model

2. **CORS Issues:**
   - Ensure backend allows frontend domain
   - Check environment variables

3. **Build Failures:**
   - Check Node.js version (18+)
   - Verify dependencies are installed

### Backend Health Check

Visit: `https://your-backend.onrender.com/health`

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": 1234567890
}
```

## 📈 Scaling Considerations

- **Frontend:** Automatically scales with Vercel/Netlify
- **Backend:** Consider upgrading to paid plans for better performance
- **Model:** Consider using TensorFlow Serving for production

## 🔒 Security

- Configure CORS properly for production
- Use environment variables for sensitive data
- Consider rate limiting for API endpoints
- Validate all input data

## 📝 Monitoring

- Monitor backend health endpoints
- Set up logging for prediction errors
- Track response times and accuracy 