// backend/src/utils/messages.ts
/**
 * Standardized user-facing messages
 * Ensures consistent, toast-safe messages across the application
 */

export const ErrorMessages = {
  // Authentication
  UNAUTHORIZED: 'Unauthorized - Please login',
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Session expired - Please login again',
  FORBIDDEN: 'You do not have permission to perform this action',
  
  // Validation
  REQUIRED_FIELDS: 'Please fill in all required fields',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_FORMAT: 'Invalid data format',
  
  // Resources
  NOT_FOUND: 'Resource not found',
  USER_NOT_FOUND: 'User not found',
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  ADMIN_NOT_FOUND: 'Admin not found',
  
  // Conflicts
  DUPLICATE_EMAIL: 'Email already exists',
  DUPLICATE_PHONE: 'Phone number already exists',
  DUPLICATE_USERNAME: 'Username already exists',
  
  // Operations
  OPERATION_FAILED: 'Operation failed - Please try again',
  UPDATE_FAILED: 'Failed to update - Please try again',
  DELETE_FAILED: 'Failed to delete - Please try again',
  CREATE_FAILED: 'Failed to create - Please try again',
  
  // Specific Actions
  REASON_REQUIRED: 'Reason is required for this action',
  PASSWORD_REQUIRED: 'Password verification required',
  INVALID_PASSWORD: 'Incorrect password',
  INVALID_STATE_TRANSITION: 'Invalid status transition',
  
  // File Upload
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  UPLOAD_FAILED: 'File upload failed',
  
  // Rate Limiting
  TOO_MANY_REQUESTS: 'Too many requests - Please try again later',
  
  // Server
  INTERNAL_ERROR: 'Internal server error - Please contact support'
};

export const SuccessMessages = {
  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  
  // CRUD Operations
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  
  // Specific Actions
  APPROVED: 'Approved successfully',
  REJECTED: 'Rejected successfully',
  SUSPENDED: 'Suspended successfully',
  ACTIVATED: 'Activated successfully',
  ASSIGNED: 'Assigned successfully',
  
  // Transactions
  TRANSACTION_APPROVED: 'Transaction approved successfully',
  TRANSACTION_REJECTED: 'Transaction rejected successfully',
  TRANSACTION_COMPLETED: 'Transaction completed successfully',
  
  // KYC
  KYC_APPROVED: 'KYC approved successfully',
  KYC_REJECTED: 'KYC rejected successfully',
  
  // Email
  EMAIL_SENT: 'Email sent successfully',
  TEST_EMAIL_SENT: 'Test email sent successfully',
  
  // Settings
  SETTINGS_UPDATED: 'Settings updated successfully',
  RATE_UPDATED: 'Exchange rate updated successfully'
};
