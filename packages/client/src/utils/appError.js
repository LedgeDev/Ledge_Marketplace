// src/utils/AppError.js or src/errors/AppError.js

class AppError extends Error {
  constructor(message, type, statusCode = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;

    // This line is important for preserving the correct stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export default AppError;
