/**
 * Application constants and configuration
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const API_ENDPOINTS = {
  PREDICT: `${API_BASE_URL}/predict`,
  PREDICT_MULTI: `${API_BASE_URL}/predict-multi`,
  MODEL_INFO: `${API_BASE_URL}/model-info`,
};

export const APP_CONFIG = {
  APP_NAME: 'Digit Classifier',
  APP_VERSION: '1.1.0',
  DEFAULT_BRUSH_SIZE: 15,
};
