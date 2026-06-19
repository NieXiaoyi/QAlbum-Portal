export interface Photo {
  id: string;
  albumId: string;
  ownerId: string;
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  width?: number;
  height?: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface TrashItem {
  id: string;
  originalAlbumId: string;
  originalAlbumName: string;
  photo: Photo;
  deletedAt: Date;
  expiresAt: Date;
}
