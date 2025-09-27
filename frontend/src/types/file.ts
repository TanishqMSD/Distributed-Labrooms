export interface FileUploader {
  id: string;
  name: string;
}

export interface FileType {
  _id: string;
  filename: string;
  url: string;
  fileType: 'image' | 'document' | 'pdf' | 'text' | 'archive' | 'other';
  mimeType: string;
  size: number;
  uploader: FileUploader;
  roomCode: string;
  publicId: string;
  createdAt: string;
  updatedAt: string;
}
