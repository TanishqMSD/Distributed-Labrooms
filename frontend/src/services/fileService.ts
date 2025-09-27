import axios from 'axios';
import type { FileType } from '../types/file';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Get all files for a room
export const getRoomFiles = async (roomCode: string): Promise<FileType[]> => {
  const response = await axios.get(`${API_URL}/rooms/${roomCode}/files`, {
    withCredentials: true,
  });
  return response.data.data;
};

// Upload a file to a room
import type { AxiosProgressEvent } from 'axios';

export const uploadFile = async (
  file: File,
  roomCode: string,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
): Promise<FileType> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    `${API_URL}/rooms/${roomCode}/files`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
      onUploadProgress,
    }
  );

  return response.data.data;
};

// Delete a file
export const deleteFile = async (
  fileId: string,
  roomCode: string
): Promise<void> => {
  await axios.delete(`${API_URL}/files/${fileId}`, {
    withCredentials: true,
    data: { roomCode }, // Send roomCode in the request body
  });
};

// Upload file to Cloudinary (client-side upload)
export const uploadToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; public_id: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'labrooms_uploads');

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
    formData,
    {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    }
  );

  return {
    url: response.data.secure_url,
    public_id: response.data.public_id,
  };
};
