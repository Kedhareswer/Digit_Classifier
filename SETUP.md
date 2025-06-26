# 🛠 Setup Guide

Follow this guide to set up the Digit Classifier Deep Learning project locally.

## 📋 Prerequisites

Make sure you have the following installed:

- **Node.js** 18.0 or higher
- **Python** 3.8 or higher
- **Git**
- **npm** or **yarn**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Digit_Classifier_DeepLearning
```

### 2. Install Frontend Dependencies

```bash
npm install
# or
yarn install
```

### 3. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
# or create a virtual environment first:
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Set Up Environment Variables

Copy the example environment file:
```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:
```bash
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 5. Start the Application

#### Terminal 1 - Backend (Python)
```bash
cd backend
python app.py
```

The backend will start on `http://localhost:8000`

#### Terminal 2 - Frontend (Next.js)
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## 📱 Usage

1. Open `http://localhost:3000` in your browser
2. Select recognition mode (Single or Multiple digits)
3. Draw a digit on the canvas
4. Click "Predict" to see the AI prediction
5. Use "Clear" to reset the canvas

## 🔧 Development Commands

### Frontend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Backend Commands
```bash
python app.py        # Start FastAPI server
```

## 🏗 Project Structure

```
├── app/                    # Next.js app directory
│   ├── components/         # React components
│   │   ├── Header.tsx
│   │   ├── DrawingCanvas.tsx
│   │   ├── PredictionResult.tsx
│   │   ├── Controls.tsx
│   │   └── ModeSelector.tsx
│   ├── lib/               # Utility functions and types
│   │   └── types.ts
│   ├── api/               # API routes
│   │   └── predict/
│   │       └── route.ts
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── backend/               # Python FastAPI backend
│   ├── app.py            # Main FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── model/            # ML model directory (created automatically)
├── package.json          # Node.js dependencies
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── vercel.json           # Vercel deployment configuration
```

## 🤖 Model Information

- **Architecture:** Convolutional Neural Network (CNN)
- **Dataset:** MNIST handwritten digits
- **Input:** 28x28 grayscale images
- **Output:** 10 classes (digits 0-9)
- **Training:** Automatic on first run (cached afterwards)

### Model Performance
- Training Accuracy: ~99%
- Validation Accuracy: ~98%
- Test Accuracy: ~98%

## 🎨 Customization

### Adding New Components
1. Create component in `app/components/`
2. Export from the component file
3. Import and use in your pages

### Styling
- Uses Tailwind CSS for styling
- Custom styles in `app/globals.css`
- Dark theme is default

### Backend Modifications
1. Modify `backend/app.py` for API changes
2. Update requirements.txt for new dependencies
3. Restart the backend server

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use:**
   ```bash
   # Kill process on port 3000 or 8000
   npx kill-port 3000
   npx kill-port 8000
   ```

2. **Module Not Found:**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Python Dependencies:**
   ```bash
   # Use virtual environment
   python -m venv venv
   source venv/bin/activate
   pip install -r backend/requirements.txt
   ```

4. **Model Training Takes Long:**
   - First run trains the model (5-10 minutes)
   - Subsequent runs use cached model
   - Model is saved in `backend/model/`

### Getting Help

1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure ports 3000 and 8000 are available
4. Check Python and Node.js versions

## 🔄 Development Workflow

1. Make changes to frontend or backend
2. Test locally with both servers running
3. Commit changes to git
4. Deploy to staging/production

## 📊 Performance Tips

- Use GPU for faster model training
- Enable TensorFlow optimizations
- Use development mode for faster iteration
- Production builds are optimized automatically 