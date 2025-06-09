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
  NEXT_PUBLIC_API_BASE_URL: 'http://localhost:8000',
  APP_MODEL_PATH: './model/mnist_model.h5',
  APP_MODEL_VERSION: '1.0.0',
  APP_ALLOWED_ORIGINS: 'http://localhost:3000,http://127.0.0.1:3000',
  APP_ENABLE_AUGMENTATION: 'true',
  APP_DEBUG_MODE: 'false',
  APP_MIN_CONTOUR_SIZE: '10',
  APP_MAX_REQUESTS_PER_MINUTE: '60',
  PROCESSING_CONCURRENCY: '5'
};

// Environment templates
const frontendEnvTemplate = `# Frontend Environment Variables
NEXT_PUBLIC_API_BASE_URL={NEXT_PUBLIC_API_BASE_URL}
`;

const backendEnvTemplate = `# Backend Environment Variables
APP_MODEL_PATH={APP_MODEL_PATH}
APP_MODEL_VERSION={APP_MODEL_VERSION}
APP_ALLOWED_ORIGINS={APP_ALLOWED_ORIGINS}
APP_ENABLE_AUGMENTATION={APP_ENABLE_AUGMENTATION}
APP_DEBUG_MODE={APP_DEBUG_MODE}
APP_MIN_CONTOUR_SIZE={APP_MIN_CONTOUR_SIZE}
APP_MAX_REQUESTS_PER_MINUTE={APP_MAX_REQUESTS_PER_MINUTE}
PROCESSING_CONCURRENCY={PROCESSING_CONCURRENCY}
`;

// Questions to ask
const questions = [
  {
    name: 'environment',
    message: 'Which environment are you setting up?',
    choices: ['development', 'production', 'heroku'],
    default: 'development'
  },
  {
    name: 'NEXT_PUBLIC_API_BASE_URL',
    message: 'Frontend: Backend API URL:',
    default: defaults.NEXT_PUBLIC_API_BASE_URL
  },
  {
    name: 'APP_MODEL_PATH',
    message: 'Backend: Path to model file:',
    default: defaults.APP_MODEL_PATH
  },
  {
    name: 'APP_MODEL_VERSION',
    message: 'Backend: Model version:',
    default: defaults.APP_MODEL_VERSION
  },
  {
    name: 'APP_ALLOWED_ORIGINS',
    message: 'Backend: Allowed CORS origins (comma-separated):',
    default: defaults.APP_ALLOWED_ORIGINS
  },
  {
    name: 'APP_ENABLE_AUGMENTATION',
    message: 'Backend: Enable augmentation (true/false):',
    default: defaults.APP_ENABLE_AUGMENTATION
  },
  {
    name: 'APP_DEBUG_MODE',
    message: 'Backend: Enable debug mode (true/false):',
    default: defaults.APP_DEBUG_MODE
  },
  {
    name: 'APP_MAX_REQUESTS_PER_MINUTE',
    message: 'Backend: Max requests per minute:',
    default: defaults.APP_MAX_REQUESTS_PER_MINUTE
  },
  {
    name: 'PROCESSING_CONCURRENCY',
    message: 'Backend: Max concurrent prediction tasks:',
    default: defaults.PROCESSING_CONCURRENCY
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
  
  // Set environment-specific defaults
  if (answers.environment === 'heroku') {
    console.log('\n📱 Heroku deployment setup selected');
    console.log('⚠️  Remember to set these environment variables in your Heroku app settings!');
    console.log('⚠️  Heroku has an ephemeral filesystem, model files will need special handling.');
    
    // Generate Heroku config vars list
    console.log('\n🔧 Copy these commands to set up your Heroku environment:');
    console.log(`heroku config:set APP_MODEL_PATH=${answers.APP_MODEL_PATH} --app your-app-name`);
    console.log(`heroku config:set APP_MODEL_VERSION=${answers.APP_MODEL_VERSION} --app your-app-name`);
    console.log(`heroku config:set APP_ALLOWED_ORIGINS=${answers.APP_ALLOWED_ORIGINS} --app your-app-name`);
    console.log(`heroku config:set APP_ENABLE_AUGMENTATION=${answers.APP_ENABLE_AUGMENTATION} --app your-app-name`);
    console.log(`heroku config:set APP_DEBUG_MODE=${answers.APP_DEBUG_MODE} --app your-app-name`);
    console.log(`heroku config:set APP_MIN_CONTOUR_SIZE=${answers.APP_MIN_CONTOUR_SIZE} --app your-app-name`);
    console.log(`heroku config:set APP_MAX_REQUESTS_PER_MINUTE=${answers.APP_MAX_REQUESTS_PER_MINUTE} --app your-app-name`);
    console.log(`heroku config:set PROCESSING_CONCURRENCY=${answers.PROCESSING_CONCURRENCY} --app your-app-name`);
    
    console.log('\nFrontend:');
    console.log(`heroku config:set NEXT_PUBLIC_API_BASE_URL=${answers.NEXT_PUBLIC_API_BASE_URL} --app your-frontend-app-name`);
  }
  
  // Create frontend .env.local file
  let frontendEnv = frontendEnvTemplate.replace('{NEXT_PUBLIC_API_BASE_URL}', answers.NEXT_PUBLIC_API_BASE_URL);
  
  // Create backend .env file
  let backendEnv = backendEnvTemplate
    .replace('{APP_MODEL_PATH}', answers.APP_MODEL_PATH)
    .replace('{APP_MODEL_VERSION}', answers.APP_MODEL_VERSION)
    .replace('{APP_ALLOWED_ORIGINS}', answers.APP_ALLOWED_ORIGINS)
    .replace('{APP_ENABLE_AUGMENTATION}', answers.APP_ENABLE_AUGMENTATION)
    .replace('{APP_DEBUG_MODE}', answers.APP_DEBUG_MODE)
    .replace('{APP_MIN_CONTOUR_SIZE}', defaults.APP_MIN_CONTOUR_SIZE)
    .replace('{APP_MAX_REQUESTS_PER_MINUTE}', answers.APP_MAX_REQUESTS_PER_MINUTE);

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
