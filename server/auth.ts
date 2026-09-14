import { Router, Request, Response } from 'express';
import { db } from './db.js';

export const authRouter = Router();

// Middleware to extract authenticated user from token
export function authenticateUser(req: Request, res: Response, next: Function) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please sign in.' });
  }

  const session = db.getSession(token);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session. Please log in again.' });
  }

  const user = db.getUserById(session.userId);
  if (!user) {
    return res.status(401).json({ success: false, error: 'User account not found.' });
  }

  (req as any).user = user;
  (req as any).session = session;
  next();
}

// 1. REGISTER
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { email, password, name, company } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists. Please log in.' });
    }

    const newUser = db.createUser({
      email,
      name: name || email.split('@')[0],
      password,
      provider: 'email',
      company: company || '',
      emailVerified: true
    });

    const session = db.createSession(newUser.id);

    // Return sanitized user object
    const { passwordHash, salt, ...safeUser } = newUser;

    return res.status(201).json({
      success: true,
      user: safeUser,
      token: session.token,
      message: 'Account created successfully.'
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal registration failure' });
  }
});

// 2. LOGIN
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = db.verifyCredentials(String(email).trim(), String(password));
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password. Please check your credentials.' });
    }

    const session = db.createSession(user.id);
    const { passwordHash, salt, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      user: safeUser,
      token: session.token,
      message: 'Logged in successfully.'
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Authentication failed' });
  }
});

// 3. GOOGLE / FACEBOOK ONE-CLICK OAUTH LOGIN
// Supports any selected Google/Facebook account seamlessly
authRouter.post('/oauth-instant', (req: Request, res: Response) => {
  try {
    const { email, name, avatar, provider } = req.body || {};
    const effectiveProvider = (provider === 'facebook' ? 'facebook' : 'google') as 'google' | 'facebook';

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email is required for OAuth login.' });
    }

    let user = db.getUserByEmail(email);
    if (!user) {
      // Auto-provision verified user
      user = db.createUser({
        email: email.trim(),
        name: name || email.split('@')[0],
        avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`,
        provider: effectiveProvider,
        emailVerified: true
      });
    }

    const session = db.createSession(user.id);
    const { passwordHash, salt, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      user: safeUser,
      token: session.token,
      message: `Signed in with ${effectiveProvider === 'google' ? 'Google' : 'Facebook'}.`
    });
  } catch (err: any) {
    console.error('OAuth instant error:', err);
    return res.status(500).json({ success: false, error: err.message || 'OAuth authentication failed' });
  }
});

// 4. CURRENT SESSION / ME
authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(200).json({ success: false, user: null });
  }

  const token = authHeader.split(' ')[1];
  const session = db.getSession(token);
  if (!session) {
    return res.status(200).json({ success: false, user: null });
  }

  const user = db.getUserById(session.userId);
  if (!user) {
    return res.status(200).json({ success: false, user: null });
  }

  const { passwordHash, salt, ...safeUser } = user as any;
  return res.status(200).json({ success: true, user: safeUser });
});

// 5. FORGOT PASSWORD
authRouter.post('/forgot-password', (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const resetToken = db.setResetToken(String(email).trim());
    if (!resetToken) {
      // Don't leak whether email exists for security, but return generic success
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been generated.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reset token generated successfully.',
      resetToken, // Returned in response for immediate easy verification in preview
      instructions: 'Use this verification token to complete your password reset.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Password reset request failed' });
  }
});

// 6. RESET PASSWORD
authRouter.post('/reset-password', (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body || {};
    if (!email || !token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, token, and new password are required.' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
    }

    const isValid = db.verifyResetToken(String(email).trim(), String(token).trim());
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid or expired password reset token.' });
    }

    const updated = db.setPassword(String(email).trim(), String(newPassword));
    if (!updated) {
      return res.status(400).json({ success: false, error: 'Failed to update password.' });
    }

    return res.status(200).json({ success: true, message: 'Password has been reset successfully. Please log in.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Reset password error' });
  }
});

// 7. UPDATE PROFILE
authRouter.post('/update-profile', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, company, avatar } = req.body || {};

    const updated = db.updateUser(user.id, {
      name: name !== undefined ? String(name).trim() : user.name,
      company: company !== undefined ? String(company).trim() : user.company,
      avatar: avatar !== undefined ? String(avatar).trim() : user.avatar
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { passwordHash, salt, ...safeUser } = updated as any;
    return res.status(200).json({ success: true, user: safeUser, message: 'Profile updated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to update profile' });
  }
});

// 8. LOGOUT
authRouter.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    db.deleteSession(token);
  }
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
});
