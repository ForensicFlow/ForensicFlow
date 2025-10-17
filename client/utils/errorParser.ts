/**
 * Utility functions for parsing and formatting API error messages
 */

export interface ParsedError {
  message: string;
  type: 'error' | 'warning' | 'info' | 'pending_approval';
  field?: string;
}

/**
 * Parse error response from API and extract user-friendly message
 */
export function parseAuthError(error: any): ParsedError {
  // Default error
  const defaultError: ParsedError = {
    message: 'An unexpected error occurred. Please try again.',
    type: 'error',
  };

  if (!error) return defaultError;

  // If error is already a string, check if it's JSON
  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error);
      // If it's a JSON object, extract field errors
      const fieldErrors = extractFieldErrors(parsed);
      if (fieldErrors.length > 0) {
        const message = fieldErrors[0]; // Take the first error
        return categorizeError(message);
      }
    } catch {
      // Not JSON, treat as regular string
      return categorizeError(error);
    }
  }

  // If error has a message property
  if (error.message) {
    // Check if message is a JSON string
    if (typeof error.message === 'string' && error.message.startsWith('{')) {
      try {
        const parsed = JSON.parse(error.message);
        const fieldErrors = extractFieldErrors(parsed);
        if (fieldErrors.length > 0) {
          const message = fieldErrors[0];
          return categorizeError(message);
        }
      } catch {
        // Failed to parse, use as-is
        return categorizeError(error.message);
      }
    }
    return categorizeError(error.message);
  }

  // If error is an Error object with response data
  if (error.response?.data) {
    const data = error.response.data;
    
    // Check for non_field_errors
    if (data.non_field_errors) {
      const message = Array.isArray(data.non_field_errors) 
        ? data.non_field_errors[0] 
        : data.non_field_errors;
      return categorizeError(message);
    }

    // Check for detail field
    if (data.detail) {
      return categorizeError(data.detail);
    }

    // Check for error field
    if (data.error) {
      return categorizeError(data.error);
    }

    // Check for field-specific errors
    const fieldErrors = extractFieldErrors(data);
    if (fieldErrors.length > 0) {
      const message = fieldErrors[0]; // Take the first error for cleaner display
      return categorizeError(message);
    }
  }

  return defaultError;
}

/**
 * Categorize error message and determine type
 */
function categorizeError(message: string): ParsedError {
  const lowerMessage = message.toLowerCase();

  // Check for pending approval
  if (lowerMessage.includes('pending approval') || 
      lowerMessage.includes('not approved') ||
      lowerMessage.includes('awaiting approval')) {
    return {
      message: 'Your account is pending approval by an administrator.',
      type: 'pending_approval',
    };
  }

  // Check for invalid credentials
  if (lowerMessage.includes('invalid credentials') ||
      lowerMessage.includes('unable to log in') ||
      lowerMessage.includes('incorrect password') ||
      lowerMessage.includes('incorrect username')) {
    return {
      message: 'Invalid username or password. Please check your credentials and try again.',
      type: 'error',
    };
  }

  // Check for disabled account
  if (lowerMessage.includes('disabled') || 
      lowerMessage.includes('deactivated') ||
      lowerMessage.includes('inactive')) {
    return {
      message: 'Your account has been disabled. Please contact your administrator.',
      type: 'error',
    };
  }

  // Check for duplicate/already exists errors
  if (lowerMessage.includes('already registered') ||
      lowerMessage.includes('already exists') ||
      lowerMessage.includes('already taken')) {
    return {
      message: cleanErrorMessage(message),
      type: 'warning',
    };
  }

  // Check for network errors
  if (lowerMessage.includes('network') || 
      lowerMessage.includes('connection') ||
      lowerMessage.includes('timeout')) {
    return {
      message: 'Network error. Please check your connection and try again.',
      type: 'warning',
    };
  }

  // Return original message
  return {
    message: cleanErrorMessage(message),
    type: 'error',
  };
}

/**
 * Extract field-specific errors from error object
 */
function extractFieldErrors(data: any): string[] {
  const errors: string[] = [];
  const fieldMap: Record<string, string> = {
    username: 'Username',
    password: 'Password',
    email: 'Email',
    first_name: 'First name',
    last_name: 'Last name',
    employee_id: 'Employee ID',
    department: 'Department',
    phone_number: 'Phone number',
    password_confirm: 'Password confirmation',
  };

  // Custom error messages for better UX
  const errorMessageMap: Record<string, string> = {
    'Email already registered.': 'This email is already registered. Please use a different email or try logging in.',
    'Email already registered': 'This email is already registered. Please use a different email or try logging in.',
    'Username already exists': 'This username is already taken. Please choose a different username.',
    'Employee ID already registered': 'This employee ID is already registered in the system.',
    'This field must be unique.': 'This value is already in use. Please choose a different one.',
  };

  for (const [field, value] of Object.entries(data)) {
    if (field === 'non_field_errors' || field === 'detail' || field === 'error') {
      continue;
    }

    const fieldName = fieldMap[field] || field.replace(/_/g, ' ');
    let errorMessage = Array.isArray(value) ? value[0] : value;
    
    if (typeof errorMessage === 'string') {
      // Check if we have a custom message for this error
      const customMessage = errorMessageMap[errorMessage];
      if (customMessage) {
        errors.push(customMessage);
      } else {
        errors.push(`${fieldName}: ${errorMessage}`);
      }
    }
  }

  return errors;
}

/**
 * Clean error message by removing technical prefixes
 */
function cleanErrorMessage(message: string): string {
  // Remove common prefixes
  const prefixes = [
    'non_field_errors:',
    'error:',
    'detail:',
  ];

  let cleaned = message;
  for (const prefix of prefixes) {
    if (cleaned.toLowerCase().startsWith(prefix)) {
      cleaned = cleaned.substring(prefix.length).trim();
    }
  }

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  const messages: string[] = [];

  for (const [field, fieldErrors] of Object.entries(errors)) {
    const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    fieldErrors.forEach(error => {
      messages.push(`${fieldName}: ${error}`);
    });
  }

  return messages.join('\n');
}
