import React, { useEffect, useState } from 'react'
import axios from 'axios'

export interface RoomFile {
  _id: string
  filename: string
  url: string
  fileType: string
  mimeType: string
  size: number
  uploader: { id: string; name: string }
  createdAt: string
}

interface FileSidebarProps {
  open: boolean
  onClose: () => void
  roomCode: string
  themeClasses: {
    card: string
    border: string
    cardSecondary: string
    text: string
    textMuted: string
    buttonSecondary: string
  }
  onViewFile?: (file: RoomFile) => void // <-- Add this prop
}

const groupFilesByDate = (files: RoomFile[]) => {
  const groups: Record<string, RoomFile[]> = {}
  files.forEach(file => {
    const date = new Date(file.createdAt).toLocaleDateString()
    if (!groups[date]) groups[date] = []
    groups[date].push(file)
  })
  return groups
}

const isCodeFile = (mime: string) =>
  mime.startsWith('text/') ||
  mime.includes('javascript') ||
  mime.includes('json') ||
  mime.includes('xml') ||
  mime.includes('css') ||
  mime.includes('html')

const FileSidebar: React.FC<FileSidebarProps> = ({ open, onClose, roomCode, themeClasses, onViewFile }) => {
  const [files, setFiles] = useState<RoomFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/v1/files/${roomCode}`)
      .then(res => {
        setFiles(res.data.data || [])
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to fetch files')
        setLoading(false)
      })
  }, [open, roomCode])

  if (!open) return null

  // Categorize files
  const codeFiles = files.filter(f => isCodeFile(f.mimeType))
  const otherFiles = files.filter(f => !isCodeFile(f.mimeType))

  // Group by date
  const codeGroups = groupFilesByDate(codeFiles)
  const fileGroups = groupFilesByDate(otherFiles)

  return (
    <div className="w-[86vw] sm:w-[360px] lg:w-[380px] shrink-0 transition-all duration-300">
      <div className={`${themeClasses.card} rounded-2xl ${themeClasses.border} border shadow-lg h-full flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${themeClasses.text} flex items-center gap-2`}>
              <span className="text-xl">📁</span>
              Room Files
            </h3>
            <button onClick={onClose} className={`p-2 ${themeClasses.buttonSecondary} rounded-lg hover:scale-105 transition-transform`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <span className={`text-sm ${themeClasses.textMuted}`}>Loading files...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-32">
              <span className="text-red-500 text-sm">{error}</span>
            </div>
          )}
          {!loading && !error && (
            <>
              {/* Code Files Section */}
              <div>
                <h4 className={`text-md font-semibold mb-2 ${themeClasses.text}`}>Code Files</h4>
                {Object.keys(codeGroups).length === 0 && (
                  <div className={`text-sm ${themeClasses.textMuted} mb-4`}>No code files uploaded.</div>
                )}
                {Object.entries(codeGroups).map(([date, files]) => (
                  <div key={date} className="mb-4">
                    <div className={`text-xs font-semibold mb-1 ${themeClasses.textMuted}`}>{date}</div>
                    <div className="space-y-2">
                      {files.map(file => (
                        <FileItem key={file._id} file={file} themeClasses={themeClasses} onViewFile={onViewFile} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Other Files Section */}
              <div className="mt-6">
                <h4 className={`text-md font-semibold mb-2 ${themeClasses.text}`}>Other Files</h4>
                {Object.keys(fileGroups).length === 0 && (
                  <div className={`text-sm ${themeClasses.textMuted} mb-4`}>No files uploaded.</div>
                )}
                {Object.entries(fileGroups).map(([date, files]) => (
                  <div key={date} className="mb-4">
                    <div className={`text-xs font-semibold mb-1 ${themeClasses.textMuted}`}>{date}</div>
                    <div className="space-y-2">
                      {files.map(file => (
                        <FileItem key={file._id} file={file} themeClasses={themeClasses} onViewFile={onViewFile} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function FileItem({ file, themeClasses, onViewFile }: { file: RoomFile, themeClasses: FileSidebarProps['themeClasses'], onViewFile?: (file: RoomFile) => void }) {
  // Download handler
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const response = await fetch(file.url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`${themeClasses.cardSecondary} rounded-lg p-3 ${themeClasses.border} border flex items-center gap-3`}>
      <div className="flex-shrink-0">
        {/* Use a simple icon for now */}
        <span role="img" aria-label="file" className="text-xl">📄</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${themeClasses.text}`}>{file.filename}</div>
        <div className={`text-xs ${themeClasses.textMuted}`}>
          {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className={`text-xs ${themeClasses.textMuted}`}>By {file.uploader?.name || 'Unknown'}</div>
      </div>
      <button
        className="ml-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
        title="Download"
        onClick={handleDownload}
      >
        Download
      </button>
      <button
        className="ml-2 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
        title="View"
        onClick={e => {
          e.stopPropagation();
          onViewFile && onViewFile(file);
        }}
      >
        View
      </button>
    </div>
  )
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default FileSidebar
