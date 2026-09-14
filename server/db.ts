import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { User, AuthSession, AuditProject } from '../src/types.js';

interface DatabaseSchema {
  users: Array<User & { passwordHash?: string; salt?: string; resetToken?: string }>;
  sessions: AuthSession[];
  audits: AuditProject[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const finalSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, finalSalt, 64).toString('hex');
  return { hash, salt: finalSalt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
}

class Database {
  private data: DatabaseSchema = {
    users: [],
    sessions: [],
    audits: []
  };
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.seedInitialData();
        this.save();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Failed to initialize database, resetting to memory defaults:', err);
      this.seedInitialData();
    }
  }

  private seedInitialData() {
    // Seed primary user requested in prompt: muhammadanasmughal428@gmail.com
    const { hash: hash1, salt: salt1 } = hashPassword('password123');
    const user1: User & { passwordHash: string; salt: string } = {
      id: 'user_anas_428',
      email: 'muhammadanasmughal428@gmail.com',
      name: 'Muhammad Anas Mughal',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      provider: 'google',
      emailVerified: true,
      role: 'admin',
      company: 'Enterprise Growth Labs',
      createdAt: new Date().toISOString(),
      passwordHash: hash1,
      salt: salt1
    };

    const { hash: hash2, salt: salt2 } = hashPassword('demo1234');
    const user2: User & { passwordHash: string; salt: string } = {
      id: 'user_demo_001',
      email: 'demo@auditor.ai',
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      provider: 'email',
      emailVerified: true,
      role: 'user',
      company: 'Digital Nexus Inc.',
      createdAt: new Date().toISOString(),
      passwordHash: hash2,
      salt: salt2
    };

    this.data.users = [user1, user2];
    this.data.sessions = [];
    this.data.audits = [];
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to file:', err);
    }
  }

  // Users
  getUserByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    return this.data.users.find(u => u.email.toLowerCase() === normalized);
  }

  getUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  createUser(params: {
    email: string;
    name: string;
    password?: string;
    provider: 'email' | 'google' | 'facebook';
    avatar?: string;
    company?: string;
    emailVerified?: boolean;
  }) {
    const existing = this.getUserByEmail(params.email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    let passwordHash: string | undefined;
    let salt: string | undefined;

    if (params.password) {
      const hashed = hashPassword(params.password);
      passwordHash = hashed.hash;
      salt = hashed.salt;
    }

    const newUser = {
      id: `usr_${crypto.randomUUID()}`,
      email: params.email.trim().toLowerCase(),
      name: params.name.trim() || params.email.split('@')[0],
      avatar: params.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(params.name || params.email)}`,
      provider: params.provider,
      emailVerified: params.emailVerified !== undefined ? params.emailVerified : (params.provider !== 'email'),
      role: 'user' as const,
      company: params.company || '',
      createdAt: new Date().toISOString(),
      passwordHash,
      salt
    };

    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>) {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    const current = this.data.users[index];
    this.data.users[index] = { ...current, ...updates };
    this.save();
    return this.data.users[index];
  }

  verifyCredentials(email: string, password: string) {
    const user = this.getUserByEmail(email);
    if (!user) return null;
    if (!user.passwordHash || !user.salt) {
      // User registered via OAuth, allow setting password or using oauth sign in
      return null;
    }
    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) return null;
    return user;
  }

  setPassword(email: string, newPassword: string) {
    const user = this.getUserByEmail(email);
    if (!user) return false;
    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    user.resetToken = undefined;
    this.save();
    return true;
  }

  setResetToken(email: string): string | null {
    const user = this.getUserByEmail(email);
    if (!user) return null;
    const token = crypto.randomBytes(24).toString('hex');
    user.resetToken = token;
    this.save();
    return token;
  }

  verifyResetToken(email: string, token: string): boolean {
    const user = this.getUserByEmail(email);
    if (!user || !user.resetToken) return false;
    return user.resetToken === token;
  }

  // Sessions
  createSession(userId: string): AuthSession {
    const token = `sess_${crypto.randomBytes(32).toString('hex')}`;
    const session: AuthSession = {
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };
    this.data.sessions.push(session);
    this.save();
    return session;
  }

  getSession(token: string): AuthSession | undefined {
    const session = this.data.sessions.find(s => s.token === token);
    if (!session) return undefined;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.deleteSession(token);
      return undefined;
    }
    return session;
  }

  deleteSession(token: string) {
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    this.save();
  }

  // Audits
  saveAudit(audit: AuditProject): AuditProject {
    const existingIndex = this.data.audits.findIndex(a => a.id === audit.id);
    if (existingIndex >= 0) {
      this.data.audits[existingIndex] = audit;
    } else {
      this.data.audits.unshift(audit);
    }
    this.save();
    return audit;
  }

  getAuditsByUserId(userId: string): AuditProject[] {
    return this.data.audits.filter(a => a.userId === userId);
  }

  getAuditById(id: string): AuditProject | undefined {
    return this.data.audits.find(a => a.id === id);
  }

  deleteAudit(id: string, userId: string): boolean {
    const initialLen = this.data.audits.length;
    this.data.audits = this.data.audits.filter(a => !(a.id === id && a.userId === userId));
    const deleted = this.data.audits.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }
}

export const db = new Database();
