const LoginAttempt = require('../models/LoginAttempt');

/**
 * Calculates the lockout duration in milliseconds based on the number of failed attempts.
 * @param {number} attempts 
 * @returns {number} duration in ms
 */
const getLockoutDuration = (attempts) => {
  if (attempts < 3) return 0;
  if (attempts === 3) return 30 * 1000;          // 3rd failure: 30 seconds
  if (attempts === 4) return 2 * 60 * 1000;       // 4th failure: 2 minutes
  if (attempts === 5) return 15 * 60 * 1000;      // 5th failure: 15 minutes
  if (attempts === 6) return 60 * 60 * 1000;      // 6th failure: 1 hour
  return 24 * 60 * 60 * 1000;                     // 7th+ failure: 24 hours
};

/**
 * Middleware to check if a login key is currently locked.
 */
const checkLockout = async (req, res, next) => {
  try {
    const baseKey = req.baseKey; 
    if (!baseKey) return next();

    // Include IP in the key to prevent easy bypass
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${baseKey}:${ip}`;
    req.key = key; // Attach for subsequent recordFailure/recordSuccess calls

    const attempt = await LoginAttempt.findOne({ key });
    
    if (attempt && attempt.lockoutUntil && attempt.lockoutUntil > new Date()) {
      const remainingSeconds = Math.ceil((attempt.lockoutUntil - new Date()) / 1000);
      
      let waitTime;
      if (remainingSeconds > 3600) {
        waitTime = `${Math.ceil(remainingSeconds / 3600)} hours`;
      } else if (remainingSeconds > 60) {
        waitTime = `${Math.ceil(remainingSeconds / 60)} minutes`;
      } else {
        waitTime = `${remainingSeconds} seconds`;
      }

      console.log(`[RateLimit] Blocked attempt for ${key}. Remaining: ${remainingSeconds}s`);

      return res.status(403).json({
        success: false,
        message: `Too many failed attempts. Please wait ${waitTime} before trying again.`,
        lockoutUntil: attempt.lockoutUntil,
        remainingSeconds
      });
    }
    next();
  } catch (error) {
    console.error('Rate limiter middleware error:', error);
    next();
  }
};

/**
 * Helper to record a failed login attempt.
 */
const recordFailure = async (key) => {
  try {
    let attempt = await LoginAttempt.findOne({ key });
    if (!attempt) {
      attempt = new LoginAttempt({ key, attempts: 1 });
    } else {
      attempt.attempts += 1;
      attempt.lastAttempt = new Date();
    }

    const duration = getLockoutDuration(attempt.attempts);
    if (duration > 0) {
      attempt.lockoutUntil = new Date(Date.now() + duration);
    }

    await attempt.save();
    return attempt;
  } catch (error) {
    console.error('Record failure error:', error);
  }
};

/**
 * Helper to record a successful login attempt (resets counter).
 */
const recordSuccess = async (key) => {
  try {
    await LoginAttempt.deleteOne({ key });
  } catch (error) {
    console.error('Record success error:', error);
  }
};

module.exports = {
  checkLockout,
  recordFailure,
  recordSuccess
};
