<div align="center">

# 🔢 Digit Classifier Deep Learning

<img src="https://raw.githubusercontent.com/PaddyOakTree/Digit_Classifier_DeepLearning/main/docs/assets/demo.gif" alt="Demo GIF" width="600"/>

[![GitHub stars](https://img.shields.io/github/stars/PaddyOakTree/Digit_Classifier_DeepLearning?style=for-the-badge)](https://github.com/PaddyOakTree/Digit_Classifier_DeepLearning/stargazers)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/gpl-3.0)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Heroku](https://img.shields.io/badge/heroku-%23430098.svg?style=for-the-badge&logo=heroku&logoColor=white)](https://heroku.com)

*A sophisticated deep learning-powered web application for real-time handwritten digit recognition*

[Demo](https://digit-classifier-demo.herokuapp.com) • [Documentation](docs/) • [Report Bug](issues/new?template=bug_report.md) • [Request Feature](issues/new?template=feature_request.md)

</div>

<details>
<summary>📑 Table of Contents</summary>

- [🌟 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🏗 Architecture](#-architecture)
- [🛠 Technology Stack](#-technology-stack)
- [🚀 Getting Started](#-getting-started)
- [📱 Usage Guide](#-usage-guide)
- [🌐 Deployment](#-deployment)
- [🧠 Model Architecture](#-model-architecture)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👥 Contributors](#-contributors)

</details>

## 🌟 Overview

The Digit Classifier is an advanced web application that leverages deep learning to recognize handwritten digits in real-time. Built with modern technologies and best practices, it supports both single and multiple digit recognition with high accuracy.

<div align="center">
<table>
<tr>
<td align="center">
<b>Single Digit Mode</b><br>
<img src="docs/assets/single-digit.png" width="200"/>
</td>
<td align="center">
<b>Multiple Digits Mode</b><br>
<img src="docs/assets/multiple-digits.png" width="200"/>
</td>
</tr>
</table>
</div>

## ✨ Key Features

<table>
<tr>
<th>Category</th>
<th>Features</th>
<th>Benefits</th>
</tr>
<tr>
<td><b>Recognition</b></td>
<td>
• Single & Multiple digit recognition<br>
• Real-time predictions<br>
• Confidence scoring
</td>
<td>
• High accuracy recognition<br>
• Instant feedback<br>
• Reliable predictions
</td>
</tr>
<tr>
<td><b>User Experience</b></td>
<td>
• Modern UI with dark theme<br>
• Touch-enabled canvas<br>
• Adjustable brush size
</td>
<td>
• Intuitive interface<br>
• Multi-device support<br>
• Customizable input
</td>
</tr>
<tr>
<td><b>Performance</b></td>
<td>
• Request queuing<br>
• Rate limiting<br>
• Concurrency control
</td>
<td>
• Optimal resource usage<br>
• DDoS protection<br>
• Consistent performance
</td>
</tr>
</table>

## 🏗 Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Web Interface] --> B[Next.js Server]
        B --> C[State Management]
    end
    
    subgraph "Backend Layer"
        D[FastAPI Server] --> E[Request Queue]
        E --> F[Rate Limiter]
        F --> G[Model Service]
    end
    
    subgraph "ML Layer"
        G --> H[TensorFlow Model]
        H --> I[Preprocessing]
        I --> J[Inference Engine]
    end
    
    C -.-> D
    J -.-> C
```

## 🛠 Technology Stack

<div align="center">

| Layer | Technologies | Version | Purpose |
|-------|--------------|---------|----------|
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js)<br>![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)<br>![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | 15.x<br>18.x<br>5.x | Application Framework<br>UI Components<br>Type Safety |
| **Backend** | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi)<br>![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) | 0.95.x<br>3.8+ | API Server<br>Backend Logic |
| **ML** | ![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)<br>![Keras](https://img.shields.io/badge/Keras-D00000?style=flat-square&logo=keras&logoColor=white) | 2.x<br>2.x | Model Training<br>Inference |
| **DevOps** | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)<br>![Heroku](https://img.shields.io/badge/Heroku-430098?style=flat-square&logo=heroku&logoColor=white) | 20.x<br>Latest | Containerization<br>Cloud Deployment |

</div>

## 🚀 Getting Started

### Prerequisites

```bash
# Check versions
node --version    # Must be ≥ 18.0
python --version  # Must be ≥ 3.8
git --version     # Any version
```

### Quick Start

1️⃣ **Clone & Setup**
```bash
git clone https://github.com/PaddyOakTree/Digit_Classifier_DeepLearning.git
cd Digit_Classifier_DeepLearning
```

2️⃣ **Install Dependencies**
```bash
# Frontend
npm install

# Backend
cd backend
pip install -r requirements.txt
```

3️⃣ **Start Development Servers**
```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn app:app --reload

# Terminal 2 - Frontend
npm run dev
```

4️⃣ **Access Application**
- Open [http://localhost:3000](http://localhost:3000)

## 📱 Usage Guide

<div align="center">

### Application Workflow

```mermaid
sequenceDiagram
    participant User
    participant Canvas
    participant Frontend
    participant Backend
    participant Model

    User->>Canvas: Draw Digit(s)
    Canvas->>Frontend: Capture Input
    Frontend->>Backend: Send Image
    Backend->>Model: Process Image
    Model->>Backend: Return Prediction
    Backend->>Frontend: Send Results
    Frontend->>Canvas: Display Prediction
```

</div>

### Mode Selection

| Mode | Description | Best For |
|------|-------------|----------|
| **Single Digit** | Recognizes one digit at a time | • Clear, individual digits<br>• Highest accuracy |
| **Multiple Digits** | Processes multiple digits together | • Number sequences<br>• Quick batch processing |

### Drawing Tips

- Keep digits centered in the canvas
- Use clear, well-defined strokes
- Adjust brush size for better control
- Allow space between multiple digits

## 🌐 Deployment

<div align="center">

### Deployment Options

| Method | Command | Use Case | Scaling |
|--------|---------|----------|----------|
| **Docker Compose** | `docker-compose up -d` | Production | Manual |
| **Separate Containers** | See [deployment guide](DEPLOYMENT.md) | Custom Setup | Independent |
| **Heroku** | `git push heroku main` | Cloud | Automatic |
| **Manual** | `npm start` & `uvicorn app:app` | Development | Manual |

</div>

## 🧠 Model Architecture

```mermaid
graph LR
    A[Input Layer 28x28x1] --> B[Conv2D 32]
    B --> C[MaxPool2D]
    C --> D[Conv2D 64]
    D --> E[MaxPool2D]
    E --> F[Dropout 0.25]
    F --> G[Dense 128]
    G --> H[Dropout 0.5]
    H --> I[Dense 10]
    I --> J[Softmax]
```

### Model Performance

| Metric | Score |
|--------|-------|
| Training Accuracy | 99.2% |
| Validation Accuracy | 98.7% |
| Test Accuracy | 98.5% |

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

<div align="center">

```mermaid
graph LR
    A[Fork] --> B[Branch]
    B --> C[Commit]
    C --> D[Push]
    D --> E[Pull Request]
```

</div>

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 👥 Contributors

<div align="center">

[![Contributors](https://contrib.rocks/image?repo=PaddyOakTree/Digit_Classifier_DeepLearning)](https://github.com/PaddyOakTree/Digit_Classifier_DeepLearning/graphs/contributors)

</div>

---

<div align="center">

📝 *Last updated: 2025-06-09 13:12:03 UTC by [@PaddyOakTree](https://github.com/PaddyOakTree)*

</div>
