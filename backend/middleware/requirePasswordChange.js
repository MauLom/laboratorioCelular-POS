/**
 * Middleware to enforce password change requirement
 * Blocks access to all routes except /auth/set-new-password if user must change password
 */

const requirePasswordChange = (req, res, next) => {
  // Check if user is authenticated (should be set by authenticate middleware)
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Check if user must change password
  if (req.user.mustChangePassword) {
    // Allow access to set-new-password endpoint
    // Check both path and originalUrl to handle different route mounting scenarios
    const path = req.path || '';
    const originalUrl = req.originalUrl || '';
    const isSetPasswordRoute = 
      path === '/set-new-password' || 
      path.endsWith('/set-new-password') ||
      originalUrl.includes('/set-new-password') ||
      originalUrl.includes('/auth/set-new-password');
    
    if (isSetPasswordRoute && req.method === 'POST') {
      return next(); // Allow access to set new password
    }

    // Block all other routes
    return res.status(403).json({
      error: 'Password change required. Please set a new password before accessing this resource.',
      requiresPasswordChange: true,
      allowedEndpoint: '/auth/set-new-password'
    });
  }

  // User doesn't need to change password, proceed
  next();
};

module.exports = requirePasswordChange;

