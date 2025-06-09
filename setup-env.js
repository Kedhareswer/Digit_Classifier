/**
 * Environment Setup Helper
 * 
 * This script helps set up the environment variables for the application.
 * Run with: node setup-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default values
const defaults = {
  NEXT_PUBLIC_API_URL: 'http://localhost:8000',
  MODEL_PATH: './model/mnist_model.h5',
  MODEL_VERSION: '1.0.0',
  ALLOWED_ORIGINS: 'http://localhost:3000,http://127.0.0.1:3000',
  ENABLE_AUGMENTATION: 'true',
  DEBUG: 'false',
  MIN_CONTOUR_SIZE: '10'
};

// Environment templates
const frontendEnvTemplate = `# Frontend Environment Variables
NEXT_PUBLIC_API_URL={NEXT_PUBLIC_API_URL}
`;

const backendEnvTemplate = `# Backend Environment Variables
MODEL_PATH={MODEL_PATH}
MODEL_VERSION={MODEL_VERSION}
ALLOWED_ORIGINS={ALLOWED_ORIGINS}
ENABLE_AUGMENTATION={ENABLE_AUGMENTATION}
DEBUG={DEBUG}
MIN_CONTOUR_SIZE={MIN_CONTOUR_SIZE}
`;

// Questions to ask
const questions = [
  {
    name: 'environment',
    message: 'Which environment are you setting up?',
    choices: ['development', 'production'],
    default: 'development'
  },
  {
    name: 'NEXT_PUBLIC_API_URL',
    message: 'Frontend: Backend API URL:',
    default: defaults.NEXT_PUBLIC_API_URL
  },
  {
    name: 'MODEL_PATH',
    message: 'Backend: Path to model file:',
    default: defaults.MODEL_PATH
  },
  {
    name: 'MODEL_VERSION',
    message: 'Backend: Model version:',
    default: defaults.MODEL_VERSION
  },
  {
    name: 'ALLOWED_ORIGINS',
    message: 'Backend: Allowed CORS origins (comma-separated):',
    default: defaults.ALLOWED_ORIGINS
  },
  {
    name: 'ENABLE_AUGMENTATION',
    message: 'Backend: Enable augmentation (true/false):',
    default: defaults.ENABLE_AUGMENTATION
  },
  {
    name: 'DEBUG',
    message: 'Backend: Enable debug mode (true/false):',
    default: defaults.DEBUG
  }
];

// Store answers
const answers = {};

// Ask questions sequentially
function askQuestion(index) {
  if (index >= questions.length) {
    generateFiles();
    return;
  }

  const question = questions[index];
  
  if (question.name === 'environment') {
    rl.question(`${question.message} (${question.choices.join('/')}): [${question.default}] `, (answer) => {
      answers[question.name] = answer || question.default;
      askQuestion(index + 1);
    });
  } else {
    rl.question(`${question.message} [${question.default}] `, (answer) => {
      answers[question.name] = answer || question.default;
      askQuestion(index + 1);
    });
  }
}

// Generate environment files
function generateFiles() {
  console.log('\nGenerating environment files...');
  
  // Create frontend .env.local file
  let frontendEnv = frontendEnvTemplate.replace('{NEXT_PUBLIC_API_URL}', answers.NEXT_PUBLIC_API_URL);
  
  // Create backend .env file
  let backendEnv = backendEnvTemplate
    .replace('{MODEL_PATH}', answers.MODEL_PATH)
    .replace('{MODEL_VERSION}', answers.MODEL_VERSION)
    .replace('{ALLOWED_ORIGINS}', answers.ALLOWED_ORIGINS)
    .replace('{ENABLE_AUGMENTATION}', answers.ENABLE_AUGMENTATION)
    .replace('{DEBUG}', answers.DEBUG)
    .replace('{MIN_CONTOUR_SIZE}', defaults.MIN_CONTOUR_SIZE);

  // Write files
  try {
    // Frontend .env.local
    fs.writeFileSync(path.join(__dirname, '.env.local'), frontendEnv);
    console.log('✅ Created frontend .env.local file');
    
    // Backend .env
    fs.writeFileSync(path.join(__dirname, 'backend', '.env'), backendEnv);
    console.log('✅ Created backend .env file');
    
    console.log('\n🎉 Environment setup complete!');
    console.log('\nNext steps:');
    
    if (answers.environment === 'development') {
      console.log('1. Start the backend: cd backend && python -m uvicorn app:app --reload');
      console.log('2. Start the frontend: npm run dev');
    } else {
      console.log('1. Build and start with Docker: docker-compose up -d');
    }
    
    console.log('\nSee DEPLOYMENT.md for more deployment options.');
  } catch (error) {
    console.error('❌ Error creating environment files:', error.message);
  }
  
  rl.close();
}

// Start the process
console.log('🔧 Digit Classifier Environment Setup\n');
askQuestion(0);
