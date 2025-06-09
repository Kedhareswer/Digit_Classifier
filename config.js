/**
 * Configuration file for the Digit Classifier application
 * Contains environment-specific settings
 */

const config = {
  // API configuration
  api: {
    // Base URL for the backend API
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
  },
  
  // Application settings
  app: {
    // Name of the application
    name: 'Digit Classifier',
    // Version of the application
    version: '1.0.0',
  },
  
  // Model settings
  model: {
    // Version of the model
    version: '1.0.0',
    // Path to the model file (relative to the backend directory)
    path: process.env.MODEL_PATH || '../mnist_final_model.keras',
  },
};

export default config;
