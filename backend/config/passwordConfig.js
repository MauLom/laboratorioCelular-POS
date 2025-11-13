/**
 * Password Configuration
 * Configurable values for password management system
 * Can be overridden via environment variables
 */

module.exports = {
  // Number of previous passwords to check (default: 5)
  PASSWORD_HISTORY_COUNT: parseInt(process.env.PASSWORD_HISTORY_COUNT) || 5,

  // Days until temporary password expires (default: 7)
  TEMP_PASSWORD_EXPIRY_DAYS: parseInt(process.env.TEMP_PASSWORD_EXPIRY_DAYS) || 7,

  // Minimum password length (default: 8)
  MIN_PASSWORD_LENGTH: parseInt(process.env.MIN_PASSWORD_LENGTH) || 8,

  // Require uppercase letters (default: true)
  REQUIRE_UPPERCASE: process.env.REQUIRE_UPPERCASE !== 'false',

  // Require lowercase letters (default: true)
  REQUIRE_LOWERCASE: process.env.REQUIRE_LOWERCASE !== 'false',

  // Require numbers (default: true)
  REQUIRE_NUMBERS: process.env.REQUIRE_NUMBERS !== 'false',

  // Require special characters (default: true)
  REQUIRE_SPECIAL_CHARS: process.env.REQUIRE_SPECIAL_CHARS !== 'false',

  // Check against common passwords (default: true)
  CHECK_COMMON_PASSWORDS: process.env.CHECK_COMMON_PASSWORDS !== 'false'
};

