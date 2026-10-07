export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
  company?: string;
  website?: string;
  authProvider: 'email' | 'google' | 'facebook';
  joinedDate: string;
  eeatTrustScore: number;
  auditsCompleted: number;
}

export const DEFAULT_DEMO_USER: UserProfile = {
  id: 'usr_2026_demo',
  name: 'Muhammad Anas Mughal',
  email: 'muhammadanasmughal428@gmail.com',
  avatarUrl: '', // Will fallback to beautifully styled initials or SVG avatar
  role: 'E-E-A-T Enterprise Auditor & SEO Architect',
  company: 'Global Digital Authority',
  website: '',
  authProvider: 'google',
  joinedDate: 'May 2026',
  eeatTrustScore: 99,
  auditsCompleted: 48,
};
