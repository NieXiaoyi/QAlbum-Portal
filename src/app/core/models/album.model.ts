export interface Album {
  id: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  photoCount: number;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
}
