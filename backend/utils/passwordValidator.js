// Common passwords list (top 100 most common passwords)
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

// Import password configuration
const passwordConfig = require('../config/passwordConfig');

// Configuration with defaults from config file
const DEFAULT_CONFIG = {
  minLength: passwordConfig.MIN_PASSWORD_LENGTH,
  requireUppercase: passwordConfig.REQUIRE_UPPERCASE,
  requireLowercase: passwordConfig.REQUIRE_LOWERCASE,
  requireNumbers: passwordConfig.REQUIRE_NUMBERS,
  requireSpecialChars: passwordConfig.REQUIRE_SPECIAL_CHARS,
  checkCommonPasswords: passwordConfig.CHECK_COMMON_PASSWORDS,
};

function validatePasswordStrength(password, config = {}) {
  const errors = [];
  const settings = { ...DEFAULT_CONFIG, ...config };

  // Check if password is provided
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      errors: ['Password is required']
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
    errors.push('Password must contain at least one special character');
  }

  // Check against common passwords
  if (settings.checkCommonPasswords) {
    const isCommon = checkCommonPasswords(password);
    if (isCommon) {
      errors.push('Password is too common and easily guessable');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function checkCommonPasswords(password) {
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
      // Check if it's just the common password with 1-3 digits appended
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

async function checkPasswordHistory(password, user) {
  if (!password || !user) {
    return false;
  }

  // Use the user model's checkPasswordHistory method
  if (typeof user.checkPasswordHistory === 'function') {
    return await user.checkPasswordHistory(password);
  }

  // Fallback: manual check if method doesn't exist
  const bcrypt = require('bcrypt');
  
  // Check current password
  const isCurrentPassword = await bcrypt.compare(password, user.password);
  if (isCurrentPassword) {
    return true;
  }

  // Check password history
  if (user.passwordHistory && Array.isArray(user.passwordHistory)) {
    for (const historyEntry of user.passwordHistory) {
      if (historyEntry.password) {
        const isMatch = await bcrypt.compare(password, historyEntry.password);
        if (isMatch) {
          return true;
        }
      }
    }
  }

  return false;
}

async function validatePassword(password, user = null, config = {}) {
  const errors = [];
  const settings = { ...DEFAULT_CONFIG, ...config };

  // Check password strength
  const strengthCheck = validatePasswordStrength(password, settings);
  if (!strengthCheck.valid) {
    errors.push(...strengthCheck.errors);
  }

  // Check password history (if user provided)
  if (user) {
    const wasUsed = await checkPasswordHistory(password, user);
    if (wasUsed) {
      errors.push('Password was used before. Please choose a different password.');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validatePasswordStrength,
  checkCommonPasswords,
  checkPasswordHistory,
  validatePassword,
  DEFAULT_CONFIG,
  COMMON_PASSWORDS
};

