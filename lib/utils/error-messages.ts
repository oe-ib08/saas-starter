/**
 * Enhanced error messages for better user experience
 */
export function getEnhancedErrorMessage(error: string): string {
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes('invalid email') || errorLower.includes('invalid password')) {
    return 'Invalid email or password. Check your credentials and try again.';
  }
  
  if (errorLower.includes('email not verified')) {
    return 'Please verify your email address. Check your inbox for a verification link or resend verification email.';
  }
  
  if (errorLower.includes('account locked') || errorLower.includes('too many attempts')) {
    return 'Account temporarily locked due to too many failed attempts. Please try again in a few minutes or reset your password.';
  }
  
  if (errorLower.includes('email already exists') || errorLower.includes('user already exists')) {
    return 'An account with this email already exists. Try signing in instead or use the "Forgot password" link.';
  }
  
  if (errorLower.includes('weak password') || errorLower.includes('password too short')) {
    return 'Password must be at least 8 characters long and include a mix of letters, numbers, and symbols.';
  }
  
  if (errorLower.includes('network') || errorLower.includes('connection')) {
    return 'Connection error. Please check your internet connection and try again.';
  }
  
  if (errorLower.includes('server') || errorLower.includes('internal')) {
    return 'Server temporarily unavailable. Please try again in a few moments.';
  }
  
  if (errorLower.includes('expired') || errorLower.includes('token')) {
    return 'Your session has expired. Please sign in again.';
  }
  
  // Return original error if no enhancement is available
  return error;
}