import { User } from './user.model';

export interface Album {
  id: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  photoCount: number;
  createdAt: Date;
  updatedAt: Date;
  members: User[];
}
