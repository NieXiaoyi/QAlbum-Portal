export type UserRole = 'admin' | 'member';

export type MemberStatus = 'active' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: MemberStatus;
  joinedAt: Date;
}
