/**
 * Client-side Password Validation Utility
 * Matches backend validation rules for real-time feedback
 */

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  strengthPercentage: number;
}

export interface PasswordConfig {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  checkCommonPasswords?: boolean;
}

// Common passwords list (matches backend)
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', '12345678', '12345', '1234567',
  '1234567890', 'qwerty', 'abc123', '111111', '123123', 'admin',
  'letmein', 'welcome', 'monkey', '1234567890', '1234', 'sunshine',
  'princess', 'dragon', 'passw0rd', 'master', 'hello', 'freedom',
  'whatever', 'qazwsx', 'trustno1', 'jordan23', 'harley', 'shadow',
  'melissa', 'superman', 'michael', '654321', 'jennifer', 'hunter',
  'buster', 'soccer', 'tigger', 'batman', 'test', 'thomas',
  'hockey', 'ranger', 'daniel', 'hannah', 'maggie', 'jessica',
  'charlie', 'michelle', '1qaz2wsx', 'liverpool', 'jordan', 'london',
  'computer', 'joshua', 'qwerty123', 'qwertyuiop', 'zxcvbnm', 'asdfgh',
  'password1', 'password123', 'admin123', 'root', 'toor', 'pass',
  'iloveyou', 'princess1', 'rockyou', '123qwe', 'welcome123',
  'football', 'baseball', 'starwars', 'ninja', 'pokemon', 'qwerty1',
  'dragon1', 'master1', 'sunshine1', 'welcome1', 'monkey1', 'letmein1',
  'password12', 'password2', 'qwerty12', 'admin1', 'root123', 'test123',
  'guest', 'user', 'demo', 'sample', 'default', 'changeme'
];

// Default configuration (matches backend)
const DEFAULT_CONFIG: Required<PasswordConfig> = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  checkCommonPasswords: true
};

/**
 * Calculate password strength
 */
export function calculatePasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  percentage: number;
} {
  if (!password) {
    return { strength: 'weak', percentage: 0 };
  }

  let strength = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    long: password.length >= 12
  };

  if (checks.length) strength += 20;
  if (checks.uppercase) strength += 20;
  if (checks.lowercase) strength += 20;
  if (checks.number) strength += 20;
  if (checks.special) strength += 20;
  if (checks.long) strength += 10; // Bonus for longer passwords

  if (strength <= 40) {
    return { strength: 'weak', percentage: strength };
  } else if (strength <= 60) {
    return { strength: 'medium', percentage: strength };
  } else if (strength <= 80) {
    return { strength: 'strong', percentage: strength };
  } else {
    return { strength: 'very-strong', percentage: Math.min(strength, 100) };
  }
}

/**
 * Check if password is in common passwords list
 */
export function checkCommonPasswords(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }

  const passwordLower = password.toLowerCase().trim();
  
  // Check exact match
  if (COMMON_PASSWORDS.includes(passwordLower)) {
    return true;
  }

  // Check if password is just a common password with numbers appended
  for (const common of COMMON_PASSWORDS) {
    if (passwordLower.startsWith(common) && passwordLower.length <= common.length + 3) {
      const suffix = passwordLower.substring(common.length);
      if (/^\d{1,3}$/.test(suffix)) {
        return true;
      }
    }
  }

  // Check if password is a common password with "1" or "123" appended
  const commonWithSuffix = COMMON_PASSWORDS.some(common => {
    return passwordLower === common + '1' || 
           passwordLower === common + '123' ||
           passwordLower === '1' + common ||
           passwordLower === '123' + common;
  });

  return commonWithSuffix;
}

/**
 * Validate password strength
 * Returns validation result with errors and strength information
 */
export function validatePasswordStrength(
  password: string,
  config: PasswordConfig = {}
): PasswordValidationResult {
  const errors: string[] = [];
  const settings = { ...DEFAULT_CONFIG, ...config };

  // Check if password is provided
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      errors: ['Password is required'],
      strength: 'weak',
      strengthPercentage: 0
    };
  }

  // Check minimum length
  if (password.length < settings.minLength) {
    errors.push(`Password must be at least ${settings.minLength} characters long`);
  }

  // Check for uppercase letters
  if (settings.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (settings.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (settings.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special characters
  if (settings.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }

  // Check against common passwords
  if (settings.checkCommonPasswords) {
    const isCommon = checkCommonPasswords(password);
    if (isCommon) {
      errors.push('Password is too common and easily guessable');
    }
  }

  // Calculate strength
  const strengthInfo = calculatePasswordStrength(password);

  return {
    valid: errors.length === 0,
    errors,
    strength: strengthInfo.strength,
    strengthPercentage: strengthInfo.percentage
  };
}

/**
 * Validate password with confirm password
 */
export function validatePasswordWithConfirm(
  password: string,
  confirmPassword: string,
  config: PasswordConfig = {}
): PasswordValidationResult & { passwordsMatch: boolean } {
  const validation = validatePasswordStrength(password, config);
  const passwordsMatch = password === confirmPassword;

  if (!passwordsMatch && confirmPassword) {
    validation.errors.push('Passwords do not match');
  }

  return {
    ...validation,
    valid: validation.valid && passwordsMatch,
    passwordsMatch
  };
}

