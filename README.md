# Digit Classifier Deep Learning

[![GitHub stars](https://img.shields.io/github/stars/Kedhareswer/Digit_Classifier_DeepLearning?style=social)](https://github.com/Kedhareswer/Digit_Classifier_DeepLearning/stargazers)

A modern web-based digit recognition application that uses Deep Learning to classify handwritten digits. Built with Next.js, FastAPI, and TensorFlow.

## Features

- Real-time digit recognition using a custom-trained neural network
- Support for both single digit and multiple digit recognition
- Visual feedback of model input (preprocessed image)
- Confidence scores and alternative interpretations
- Modern, responsive UI with dark theme
- Real-time drawing on canvas with touch support

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Backend**: FastAPI, Python
- **Machine Learning**: TensorFlow, Keras
- **UI Components**: Shadcn UI, Tailwind CSS
- **Image Processing**: OpenCV, Pillow

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Kedhareswer/Digit_Classifier_DeepLearning.git
cd Digit_Classifier_DeepLearning
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

### Running the Application

1. Start the backend server:
```bash
cd backend
python app.py
```

2. In a new terminal, start the frontend:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
digit-recognition/
├── backend/              # FastAPI backend server
│   ├── app.py           # Main FastAPI application
│   └── requirements.txt # Python dependencies
├── components/          # React components
│   └── digit-recognizer.tsx # Main digit recognition component
├── public/              # Static assets
└── package.json         # Project configuration
```

## Usage

1. Select the mode:
   - Single Digit: Draw a single digit in the center of the canvas
   - Multiple Digits: Draw multiple digits with some space between them

2. Draw your digit(s) on the canvas using mouse or touch
3. The prediction will appear automatically when you stop drawing
4. You can clear the canvas using the "Clear Canvas" button

## Model Details

- Custom-trained neural network based on the MNIST dataset
- Enhanced preprocessing pipeline for better accuracy
- Real-time predictions with confidence scores
- Support for alternative interpretations

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- TensorFlow and Keras for the machine learning framework
- FastAPI for the backend server
- Next.js and React for the frontend
- Shadcn UI for beautiful components
