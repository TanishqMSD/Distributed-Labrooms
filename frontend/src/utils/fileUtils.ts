// Format file size to human readable format (e.g., 1.2 MB)
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Format date to a readable format (e.g., Jan 1, 2023)
export const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Get file extension from filename
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

// Get file type based on MIME type or extension
export const getFileType = (mimeType: string, filename: string): string => {
  const extension = getFileExtension(filename);
  
  // Check by MIME type first
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  
  // Check by extension if MIME type is generic
  const documentTypes = [
    'doc', 'docx', 'odt', 'rtf', 'txt', 'md', 'csv', 'xls', 'xlsx', 'ppt', 'pptx', 'odp'
  ];
  
  const textTypes = [
    'txt', 'js', 'jsx', 'ts', 'tsx', 'json', 'css', 'html', 'xml', 'yaml', 'yml'
  ];
  
  const archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz'];
  
  if (documentTypes.includes(extension)) return 'document';
  if (textTypes.includes(extension)) return 'text';
  if (archiveTypes.includes(extension)) return 'archive';
  
  return 'other';
};

// Get appropriate icon for file type
export const getFileIcon = (fileType: string): string => {
  switch (fileType) {
    case 'image':
      return '🖼️';
    case 'pdf':
      return '📄';
    case 'document':
      return '📝';
    case 'text':
      return '📋';
    case 'archive':
      return '🗜️';
    default:
      return '📁';
  }
};
