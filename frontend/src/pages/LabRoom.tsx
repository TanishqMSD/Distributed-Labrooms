import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import Code_editor from "../components/ui/Code_editor";
import Whiteboard from "../components/ui/whiteboard";
import axios from "axios";
import { FiFile, FiImage, FiMusic, FiVideo, FiCode } from 'react-icons/fi';
import { BsFileEarmarkPdf, BsFileEarmarkWord, BsFileEarmarkExcel, BsFileEarmarkPpt, BsFileZip } from 'react-icons/bs';
import ChatSidebar from "../components/RoomPanels/ChatSidebar";
import TeamSidebar from "../components/RoomPanels/TeamSidebar";
import FileSidebar from "../components/RoomPanels/FileSidebar";
const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");

interface TeamMember {
  id: string;
  name: string;
  isOnline: boolean;
  joinedAt: Date;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  type: "message" | "system";
}

const LabRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoaded, setIsLoaded] = useState(false);
  const [roomCode, setRoomCode] = useState(roomId || "WDL1233");
  const [showRoomCode, setShowRoomCode] = useState(false);
  const [roomExists, setRoomExists] = useState(true);
  const [isValidating, setIsValidating] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showFilePanel, setShowFilePanel] = useState(false); // <-- Add state for FileSidebar
  const [activeSection, setActiveSection] = useState("code-sharing");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // State for file sharing
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string, url: string }>>([]);
  const [roomFiles, setRoomFiles] = useState<Array<{
    _id: string;
    filename: string;
    url: string;
    fileType: string;
    mimeType: string;
    size: number;
    uploader: { id: string; name: string };
    createdAt: string;
  }>>([]);
  const [editorLoadFile, setEditorLoadFile] = useState<{ code: string; filename: string; language?: string } | null>(null);

  const SUPPORTED_LANGUAGES = [
    { value: 'javascript', label: 'JavaScript', extensions: ['.js', '.jsx'] },
    { value: 'typescript', label: 'TypeScript', extensions: ['.ts', '.tsx'] },
    { value: 'python', label: 'Python', extensions: ['.py'] },
    { value: 'java', label: 'Java', extensions: ['.java'] },
    { value: 'cpp', label: 'C++', extensions: ['.cpp', '.cc', '.cxx', '.hpp'] },
    { value: 'c', label: 'C', extensions: ['.c', '.h'] },
    { value: 'html', label: 'HTML', extensions: ['.html', '.htm'] },
    { value: 'css', label: 'CSS', extensions: ['.css'] },
    { value: 'php', label: 'PHP', extensions: ['.php'] },
    { value: 'shell', label: 'Shell Script', extensions: ['.sh', '.bash'] },
  ];

  // Fetch files for the room
  const fetchRoomFiles = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/files/${roomId}`);
      // Type assertion to fix 'unknown' type error
      const data = (response.data as { data: typeof roomFiles });
      setRoomFiles(data.data);
    } catch (error) {
      console.error('Error fetching room files:', error);
    }
  };

  // Call fetchRoomFiles when component mounts
  useEffect(() => {
    if (roomId) {
      fetchRoomFiles();
    }
  }, [roomId]);

  // Handle file uploads to Cloudinary
  const uploadFiles = async () => {
    if (selectedFiles.length === 0 || isUploading) return;
    setIsUploading(true);
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'labrooms_uploads';
    if (!cloudName || !apiKey) {
      console.error('Cloudinary configuration is missing');
      setIsUploading(false);
      return;
    }
    // Add a small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 200));
    const uploadPromises = selectedFiles.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('api_key', apiKey);

      // Initial progress
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: 5
      }));

      console.log('Starting upload for:', file.name);

      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload failed:', errorText);
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Upload successful:', {
          name: file.name,
          url: data.secure_url,
          size: file.size,
          type: file.type
        });

        // Update progress to 100%
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 100
        }));

        // Send file details to backend to store in MongoDB
        try {
          await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/files/${roomId}/upload`, {
            filename: file.name,
            url: data.secure_url,
            fileType: file.type.split('/')[0],
            mimeType: file.type,
            size: file.size,
            uploader: { id: 'frontend', name: memberName },
            publicId: data.public_id
          });
        } catch (err) {
          console.error('Failed to store file in MongoDB:', err);
        }

        return {
          name: file.name,
          url: data.secure_url
        };

      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        // Update progress to show error state
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: -1 // Use -1 to indicate error state
        }));
        throw error;
      }
    });

    try {
      const results = await Promise.allSettled(uploadPromises);

      // Process successful uploads
      const successfulUploads = results
        .filter((result): result is PromiseFulfilledResult<{ name: string, url: string }> =>
          result.status === 'fulfilled' && result.value !== undefined
        )
        .map(result => result.value);

      // Add to uploaded files list
      if (successfulUploads.length > 0) {
        setUploadedFiles(prev => [...prev, ...successfulUploads]);
      }

      // Log any failed uploads
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to upload ${selectedFiles[index]?.name}:`, result.reason);
        }
      });

      // Clear selected files if everything was successful and refresh file list
      if (successfulUploads.length > 0) {
        setSelectedFiles([]);
        await fetchRoomFiles();
      }

    } catch (error) {
      console.error('Error during file uploads:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState(2 * 60 * 60); // 2 hours in seconds

  // Get room name and host name from URL parameters
  const roomName = searchParams.get("roomName") || "Untitled Room";
  const hostName = searchParams.get("hostName") || "Anonymous Host";
  const memberName = searchParams.get("memberName") || hostName;

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  // const [loading, setLoading] = useState(true);

  
useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/rooms/${roomCode}/members`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch members");
        }

        const data = await res.json();
        console.log("Fetched members data:", data);

        // Map MongoDB objects to your TeamMember type
        setTeamMembers(
          data.map((m: any) => ({
            id: m.id,
            name: m.name,
            isOnline: m.isOnline,
            joinedAt: new Date(m.joinedAt),
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        // setLoading(false);
      }
    };

    fetchMembers();
  }, [roomCode]);

// ... (rest of your component code)

  // Chat functionality state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "System",
      content: "Welcome to the room! ",
      timestamp: new Date(Date.now() - 10000),
      type: "system",
    },
  ]);

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Socket setup
  // Initialize messages state
  // const [messages, setMessages] = useState<Message[]>([]);

  // Fetch initial room messages from backend
  useEffect(() => {
    const fetchRoomMessages = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/rooms/code/${roomCode}`
        );
        if (!res.ok) throw new Error("Failed to fetch room");

        const room = await res.json();

        const formattedMessages: Message[] = room.messages.map((msg: any) => ({
          id: msg.id,
          sender: msg.sender || "System",
          content: msg.content || "",
          type: msg.type,
          timestamp: new Date(msg.timestamp.$date || msg.timestamp),
        }));

        setMessages(formattedMessages);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRoomMessages();
  }, [roomCode]);

  // Socket setup
  useEffect(() => {
    socket.emit("join-room", { roomCode, user: { name: memberName } });

    socket.on("receive-message", (message: Message) => {
      setMessages((prev) => [
        ...prev,
        { ...message, timestamp: new Date(message.timestamp) },
      ]);
    });

    return () => {
      socket.off("receive-message");
    };
  }, [roomCode, memberName]);

  // Sending a message
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: memberName,
      content: newMessage.trim(),
      timestamp: new Date(),
      type: "message",
    };

    // Emit to server
    socket.emit("send-message", { roomCode, message });

    // Optimistic update
    // setMessages((prev) => [...prev, message]);

    setNewMessage("");
  };

  // Scroll to bottom on message update
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // const handleSendMessage = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!newMessage.trim()) return;

  //   const message: Message = {
  //     id: Date.now().toString(),
  //     sender: memberName,
  //     content: newMessage.trim(),
  //     timestamp: new Date(),
  //     type: "message",
  //   };

  //   setMessages((prev) => [...prev, message]);
  //   setNewMessage("");
  // };

  useEffect(() => {
    const validateRoom = async () => {
      if (!roomId) {
        setRoomExists(false);
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/rooms/code/${roomId}`
        );
        if (!response.ok) {
          setRoomExists(false);
        } else {
          const room = await response.json();
          setRoomCode(room.code);
          setRoomExists(true);

          // if (memberName && memberName !== "Anonymous") {
          //   setTeamMembers((prev) => {
          //     const existingMember = prev.find(
          //       (member) => member.name === memberName
          //     );
          //     if (!existingMember) {
          //       setMessages((prevMessages) => [
          //         ...prevMessages,
          //         {
          //           id: `join-${Date.now()}`,
          //           sender: "System",
          //           content: `${memberName} joined the room `,
          //           timestamp: new Date(),
          //           type: "system",
          //         },
          //       ]);

          //       return [
          //         ...prev,
          //         {
          //           id: Date.now().toString(),
          //           name: memberName,
          //           isOnline: true,
          //           joinedAt: new Date(),
          //         },
          //       ];
          //     }
          //     return prev;
          //   });
          // }
        }
      } catch (error) {
        setRoomExists(false);
      } finally {
        setIsLoaded(true);
        setIsValidating(false);
      }
    };

    validateRoom();

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [roomId]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopyStatus("copied");
    setTimeout(() => setCopyStatus("idle"), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const themeClasses = {
    bg: isDarkTheme ? "bg-gray-950" : "bg-gray-100",
    text: isDarkTheme ? "text-gray-100" : "text-gray-900",
    textSecondary: isDarkTheme ? "text-gray-400" : "text-gray-600",
    textMuted: isDarkTheme ? "text-gray-500" : "text-gray-400",
    border: isDarkTheme ? "border-gray-800" : "border-gray-300",
    card: isDarkTheme
      ? "bg-gray-900/50 backdrop-blur-lg"
      : "bg-white/50 backdrop-blur-lg",
    cardSecondary: isDarkTheme ? "bg-gray-800" : "bg-gray-200",
    input: isDarkTheme
      ? "bg-gray-800 border-gray-700"
      : "bg-white border-gray-300",
    button: isDarkTheme
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-blue-500 hover:bg-blue-600",
    buttonSecondary: isDarkTheme
      ? "bg-gray-700 hover:bg-gray-600"
      : "bg-gray-300 hover:bg-gray-400",
  };

  // Helper to fetch file content from backend (for code files)
  const fetchFileContent = async (file: any) => {
    try {
      const res = await fetch(file.url);
      const code = await res.text();
      setEditorLoadFile({
        code,
        filename: file.filename,
        language: (() => {
          const ext = file.filename.split('.').pop();
          const lang = SUPPORTED_LANGUAGES.find(l => l.extensions.includes('.' + ext))?.value;
          return lang || 'javascript';
        })(),
      });
      setActiveSection("code-sharing");
    } catch (err) {
      alert('Failed to load file content');
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${themeClasses.bg}`}
    >
      <div className="min-h-screen p-4 md:p-6">
        <div className="w-full">
          {isValidating && (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-center">
                <div
                  className={`w-8 h-8 border-2 ${isDarkTheme ? "border-blue-400" : "border-blue-500"
                    } border-t-transparent rounded-full animate-spin mx-auto mb-4`}
                ></div>
                <p className={`text-lg ${themeClasses.text}`}>
                  Validating room...
                </p>
              </div>
            </div>
          )}

          {!isValidating && !roomExists && (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4"></div>
                <h1 className={`text-2xl font-bold text-red-500 mb-2`}>
                  Room Not Found
                </h1>
                <p className={`${themeClasses.textMuted} mb-6`}>
                  The room code you entered doesn't exist or has expired.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate("/join-room")}
                    className={`px-6 py-3 ${themeClasses.button} text-white font-semibold rounded-lg transition-colors`}
                  >
                    Try Another Code
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className={`px-6 py-3 ${themeClasses.border} ${themeClasses.textSecondary} hover:${themeClasses.buttonSecondary} font-semibold rounded-lg transition-colors border`}
                  >
                    Go Home
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isValidating && roomExists && (
            <>
              {/* Navigation Bar - Modern Glass Effect */}
              <div
                className={`${themeClasses.card} border-b ${themeClasses.border
                  } shadow-lg rounded-2xl p-4 mb-6 transition-all duration-1000 ${isLoaded
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                  }`}
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Left: Room Title and Code */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <h1
                      className={`text-2xl md:text-3xl font-bold ${themeClasses.text}`}
                    >
                      {roomName} 
                    </h1>
                    <div
                      className={`flex items-center gap-2 ${themeClasses.cardSecondary} rounded-full py-1 px-3`}
                    >
                      <span className={`text-sm ${themeClasses.textMuted}`}>
                        Room Code:
                      </span>
                      <span
                        className={`text-lg font-mono font-bold ${themeClasses.text} tracking-wider`}
                      >
                        {showRoomCode ? roomCode : "•".repeat(roomCode.length)}
                      </span>
                      <button
                        onClick={() => setShowRoomCode(!showRoomCode)}
                        className={`p-1 rounded-full ${themeClasses.buttonSecondary} transition-colors hover:scale-110`}
                        title={showRoomCode ? "Hide code" : "Show code"}
                      >
                        {showRoomCode ? (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0110.586 10.586z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={copyRoomCode}
                        className={`p-1 rounded-full transition-all duration-200 ${copyStatus === "copied"
                          ? "bg-green-500 text-white"
                          : `${themeClasses.button} text-white`
                          }`}
                        title="Copy Room Code"
                      >
                        {copyStatus === "copied" ? (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Center: Navigation Sections */}
                  <div
                    className={`flex items-center gap-1 ${themeClasses.cardSecondary} rounded-full p-1`}
                  >
                    <button
                      onClick={() => setActiveSection("code-sharing")}
                      className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 flex items-center gap-2 ${activeSection === "code-sharing"
                        ? `${themeClasses.button} text-white shadow-sm`
                        : `${themeClasses.textSecondary} hover:${themeClasses.buttonSecondary}`
                        }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                      Code Sharing
                    </button>
                    <button
                      onClick={() => setActiveSection("whiteboard")}
                      className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 flex items-center gap-2 ${activeSection === "whiteboard"
                        ? `${themeClasses.button} text-white shadow-sm`
                        : `${themeClasses.textSecondary} hover:${themeClasses.buttonSecondary}`
                        }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      Whiteboard
                    </button>
                    <button
                      onClick={() => setActiveSection("file-sharing")}
                      className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 flex items-center gap-2 ${activeSection === "file-sharing"
                        ? `${themeClasses.button} text-white shadow-sm`
                        : `${themeClasses.textSecondary} hover:${themeClasses.buttonSecondary}`
                        }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                        />
                      </svg>
                      File Sharing
                    </button>
                  </div>

                  {/* Right: Leave Room & Theme Toggle */}
                  <div className="flex items-center gap-3">
                    {/* Expiry Timer */}
                    <div
                      className={`${themeClasses.cardSecondary} rounded-lg px-3 py-2 ${themeClasses.border} border flex items-center gap-2`}
                    >
                      <span className="text-yellow-500 text-lg"></span>
                      <p
                        className={`text-sm font-bold ${themeClasses.text} font-mono`}
                      >
                        Expires In: {formatTime(timeLeft)}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsDarkTheme(!isDarkTheme)}
                      className={`p-2 rounded-full ${themeClasses.card} ${themeClasses.border} border transition-colors hover:scale-105`}
                      title={
                        isDarkTheme
                          ? "Switch to light theme"
                          : "Switch to dark theme"
                      }
                    >
                      {isDarkTheme ? (
                        <svg
                          className="w-5 h-5 text-yellow-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => navigate("/")}
                      className={`px-4 py-2 text-sm font-semibold ${themeClasses.textSecondary} ${themeClasses.border} border rounded-full hover:${themeClasses.buttonSecondary} transition-colors`}
                    >
                      Leave Room
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content Area: Code Editor, Whiteboard, or File Sharing */}
              <div
                className={`transition-all duration-1000 delay-200 ${isLoaded
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
                  }`}
              >
                <div className="flex gap-4 overflow-hidden" style={{ minHeight: "calc(100vh - 150px)", height: "calc(100vh - 150px)" }}>
                  {/* Left/Main Column */}
                  <div className={`flex-1 min-w-0 transition-[margin,width] duration-300`}>
                    <div className={`${themeClasses.card} rounded-2xl ${themeClasses.border} border shadow-lg h-full flex flex-col`}>
                      <div className="flex flex-col flex-1 min-w-0">
                        {/* DYNAMIC HEADER */}
                        <div className="flex items-center justify-between mb-4">
                          <h3
                            className={`text-lg font-semibold ${themeClasses.text} flex items-center gap-2`}
                          >
                            {activeSection === "code-sharing" && (
                              <>
                                <span className="text-xl"></span> Share Code
                              </>
                            )}
                            {activeSection === "whiteboard" && (
                              <div
                                className={`flex-1 ${themeClasses.cardSecondary} rounded-xl ${themeClasses.border} border flex items-center justify-center`}
                              >
                                {/* <div className="text-center">
                                  <p className={`text-2xl ${themeClasses.text}`}>🎨</p>
                                  <p className={`${themeClasses.textSecondary} mt-2`}>
                                    Whiteboard feature coming soon!
                                  </p>
                                </div>*/}
                              </div>
                            )}
                            {activeSection === "file-sharing" && (
                              <>
                                <span className="text-xl">📂</span> File Sharing
                              </>
                            )}
                          </h3>
                          {activeSection === "code-sharing" && (
                            <div className="flex gap-2">
                              {/* <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors">
                                Save
                              </button>
                              <button
                                className={`px-4 py-2 ${themeClasses.buttonSecondary} ${themeClasses.textSecondary} text-sm font-semibold rounded-lg transition-colors`}
                              >
                                Share
                              </button> */}
                            </div>
                          )}
                        </div>

                        {/* DYNAMIC CONTENT */}
                        {activeSection === "code-sharing" && (
                          <div className="flex-1 w-full min-h-0 min-w-0">
                            <Code_editor
                              roomCode={roomCode}
                              memberName={memberName}
                              loadFile={editorLoadFile}
                              onFileLoaded={() => setEditorLoadFile(null)}
                            // ...other props as needed...
                            />
                          </div>
                        )}

                        {/* {activeSection === "whiteboard" && (
                          <div
                            className={`flex-1 ${themeClasses.cardSecondary} rounded-xl ${themeClasses.border} border flex items-center justify-center`}
                          >
                            <div className="text-center">
                              <p className={`text-2xl ${themeClasses.text}`}>🎨</p>
                              <p className={`${themeClasses.textSecondary} mt-2`}>
                                Whiteboard feature coming soon!
                              </p>
                            </div>
                          </div>
                        )} */}

                        {/* // Inside LabRoom.tsx render method */}
                        {activeSection === 'whiteboard' && (
                          <Whiteboard
                            key={`${showChatPanel}-${showTeamPanel}-${showFilePanel}`} // <-- ADD THIS KEY
                            roomId={roomCode}
                            isDarkTheme={isDarkTheme}
                            userName={memberName}
                          />
                        )}

                        {activeSection === 'file-sharing' && (
                          <div className="flex-1 flex flex-col">
                            <div className="p-4 border-b border-gray-700">
                              <h3 className="text-lg font-medium text-gray-100 mb-4">Upload Files</h3>
                              <div className="flex flex-col space-y-4">
                                <div
                                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${selectedFiles.length > 0 ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-blue-400'}`}
                                  onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                  <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    multiple
                                    onChange={handleFileChange}
                                  />
                                  <div className="space-y-2">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="text-sm text-gray-400">
                                      <span className="font-medium text-blue-400 hover:text-blue-300">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Any file type up to 50MB
                                    </p>
                                  </div>
                                </div>

                                {selectedFiles.length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-300">Selected Files ({selectedFiles.length})</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                      {selectedFiles.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
                                          <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-gray-700 rounded-lg">
                                              <FileIcon mimeType={file.type} />
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-200 truncate max-w-[200px]">
                                                {file.name}
                                              </p>
                                              <p className="text-xs text-gray-400">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                              </p>
                                            </div>
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                            }}
                                            className="text-gray-400 hover:text-red-400 p-1"
                                          >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex justify-end space-x-2 pt-2">
                                      <button
                                        onClick={() => {
                                          setSelectedFiles([]);
                                          const input = document.getElementById('file-upload') as HTMLInputElement;
                                          if (input) input.value = '';
                                        }}
                                        className="px-3 py-1.5 text-sm text-gray-300 hover:text-white"
                                      >
                                        Clear All
                                      </button>
                                      <button
                                        onClick={uploadFiles}
                                        disabled={isUploading}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md ${isUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                                      >
                                        {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Room Files Section */}
                            
                          </div>
                        )}

                        {activeSection === "file-sharing" && (
                          <div className="flex flex-col h-full flex-1">
                            <div
                              className={`flex-1 ${themeClasses.cardSecondary} rounded-xl ${themeClasses.border} border-2 border-dashed flex flex-col items-center justify-center p-6 text-center`}
                            >
                              <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                multiple
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    const files = Array.from(e.target.files);
                                    setSelectedFiles(prev => [...prev, ...files]);
                                    // Initialize progress for new files
                                    const newProgress = { ...uploadProgress };
                                    files.forEach(file => {
                                      newProgress[file.name] = 0;
                                    });
                                    setUploadProgress(newProgress);
                                    e.target.value = ''; // Reset input
                                  }
                                }}
                              />
                              
                            </div>
                            {selectedFiles.length > 0 && (
                              <div className="mt-4">
                                <h4
                                  className={`${themeClasses.text} font-semibold mb-2`}
                                >
                                  Selected Files:
                                </h4>
                                <ul
                                  className={`space-y-2 max-h-48 overflow-y-auto p-3 rounded-lg ${themeClasses.cardSecondary}`}
                                >
                                  {selectedFiles.map((file, index) => (
                                    <li
                                      key={index}
                                      className="text-sm flex justify-between items-center"
                                    >
                                      <span className={themeClasses.textSecondary}>
                                        {file.name}
                                      </span>
                                      <span className={themeClasses.textMuted}>
                                        {(file.size / 1024).toFixed(2)} KB
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                                <div className="w-full mt-4">
                                  <div className="flex flex-col gap-3">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                        disabled={isUploading}
                                        className={`px-4 py-2 ${themeClasses.button} text-white text-sm font-semibold rounded-lg transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      >
                                        {isUploading ? 'Uploading...' : 'Add More Files'}
                                      </button>

                                      {selectedFiles.length > 0 && !isUploading && (
                                        <button
                                          onClick={uploadFiles}
                                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                        >
                                          Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
                                        </button>
                                      )}

                                      {isUploading && (
                                        <button
                                          onClick={() => {
                                            // Cancel uploads if needed
                                            setIsUploading(false);
                                            setUploadProgress({});
                                          }}
                                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                    </div>

                                    {/* Upload progress */}
                                    {Object.entries(uploadProgress).map(([fileName, progress]) => {
                                      const isError = progress === -1;
                                      const isComplete = progress === 100;

                                      return (
                                        <div key={fileName} className="w-full mb-3">
                                          <div className="flex justify-between text-xs mb-1">
                                            <span className={`truncate max-w-[200px] ${isError ? 'text-red-500' : themeClasses.textSecondary
                                              }`}>
                                              {fileName}
                                            </span>
                                            <span className={isError ? 'text-red-500' : themeClasses.textMuted}>
                                              {isError ? 'Failed' : `${progress}%`}
                                            </span>
                                          </div>
                                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                            <div
                                              className={`h-2 rounded-full transition-all duration-300 ${isError
                                                ? 'bg-red-500 w-full'
                                                : isComplete
                                                  ? 'bg-green-500 w-full'
                                                  : 'bg-blue-500'
                                                }`}
                                              style={{ width: isError || isComplete ? '100%' : `${Math.max(5, progress)}%` }}
                                            />
                                          </div>
                                          {isError && (
                                            <p className="text-xs text-red-500 mt-1">
                                              Upload failed. Please try again.
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })}

                                    {/* Room files list */}
                                    <div className="mt-6">
                                      <h3 className="text-lg font-medium mb-3">Room Files</h3>
                                      {roomFiles.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No files in this room yet.</p>
                                      ) : (
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                          {roomFiles.map((file) => (
                                            <div
                                              key={file._id}
                                              className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                            >
                                              <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                                  <FileIcon mimeType={file.mimeType} />
                                                </div>
                                                <div>
                                                  <p className="text-sm font-medium truncate max-w-[200px]">
                                                    {file.filename}
                                                  </p>
                                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="flex space-x-2">
                                                <a
                                                  href={file.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-blue-500 hover:underline text-sm px-3 py-1.5 bg-white dark:bg-gray-700 rounded-md font-medium"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  Download
                                                </a>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Uploaded files list */}
                                    {uploadedFiles.length > 0 && (
                                      <div className="mt-4">
                                        <h4 className="text-sm font-medium mb-2">Recently Uploaded</h4>
                                        {uploadedFiles.map((file, index) => (
                                          <div key={index} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                            <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                            <a
                                              href={file.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-500 hover:underline text-sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                              }}
                                            >
                                              View
                                            </a>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => setSelectedFiles([])}
                                    className={`px-4 py-2 ${themeClasses.buttonSecondary} ${themeClasses.textSecondary} text-sm font-semibold rounded-lg transition-colors`}
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Inline Sidebar */}
                  {showTeamPanel && (
                    <TeamSidebar
                      open={showTeamPanel}
                      onClose={() => setShowTeamPanel(false)}
                      hostName={hostName}
                      teamMembers={teamMembers}
                      themeClasses={{
                        card: themeClasses.card,
                        border: themeClasses.border,
                        cardSecondary: themeClasses.cardSecondary,
                        text: themeClasses.text,
                        textMuted: themeClasses.textMuted,
                        buttonSecondary: themeClasses.buttonSecondary,
                      }}
                    />
                  )}
                  {showChatPanel && (
                    <ChatSidebar
                      open={showChatPanel}
                      onClose={() => setShowChatPanel(false)}
                      messages={messages}
                      newMessage={newMessage}
                      onChangeMessage={setNewMessage}
                      onSend={sendMessage}
                      messagesEndRef={messagesEndRef}
                      themeClasses={{
                        card: themeClasses.card,
                        border: themeClasses.border,
                        cardSecondary: themeClasses.cardSecondary,
                        text: themeClasses.text,
                        textMuted: themeClasses.textMuted,
                        buttonSecondary: themeClasses.buttonSecondary,
                        input: themeClasses.input,
                      }}
                    />
                  )}
                  {showFilePanel && (
                    <FileSidebar
                      open={showFilePanel}
                      onClose={() => setShowFilePanel(false)}
                      roomCode={roomCode}
                      themeClasses={{
                        card: themeClasses.card,
                        border: themeClasses.border,
                        cardSecondary: themeClasses.cardSecondary,
                        text: themeClasses.text,
                        textMuted: themeClasses.textMuted,
                        buttonSecondary: themeClasses.buttonSecondary,
                      }}
                      onViewFile={fetchFileContent} // <-- Pass the callback
                    />
                  )}
                </div>
              </div>

              {/* Right Dock Icons (Meet-like) */}
              <div className="fixed bottom-6 right-6 z-50 flex flex-row gap-3">
                <button
                  onClick={() => { setShowTeamPanel(true); setShowChatPanel(false); setShowFilePanel(false); }}
                  className={`w-12 h-12 rounded-full shadow-md flex items-center justify-center transition ${showTeamPanel ? 'bg-blue-600 text-white' : 'bg-white/90 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900'}`}
                  title="People"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
                </button>
                <button
                  onClick={() => { setShowChatPanel(true); setShowTeamPanel(false); setShowFilePanel(false); }}
                  className={`w-12 h-12 rounded-full shadow-md flex items-center justify-center transition ${showChatPanel ? 'bg-blue-600 text-white' : 'bg-white/90 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900'}`}
                  title="Chat"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </button>
                <button
                  onClick={() => { setShowFilePanel(true); setShowTeamPanel(false); setShowChatPanel(false); }}
                  className={`w-12 h-12 rounded-full shadow-md flex items-center justify-center transition ${showFilePanel ? 'bg-blue-600 text-white' : 'bg-white/90 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900'}`}
                  title="Files"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// FileIcon component to display appropriate icon based on file type
const FileIcon = ({ mimeType }: { mimeType: string }) => {
  if (!mimeType) return <span className="w-5 h-5 text-gray-400"><FiFile /></span>;

  if (mimeType.startsWith('image/')) return <span className="w-5 h-5 text-blue-400"><FiImage /></span>;
  if (mimeType.startsWith('audio/')) return <span className="w-5 h-5 text-purple-400"><FiMusic /></span>;
  if (mimeType.startsWith('video/')) return <span className="w-5 h-5 text-red-400"><FiVideo /></span>;

  // Document types
  if (mimeType === 'application/pdf') return <span className="w-5 h-5 text-red-500"><BsFileEarmarkPdf /></span>;

  // Word documents
  if ([
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ].includes(mimeType))
    return <span className="w-5 h-5 text-blue-600"><BsFileEarmarkWord /></span>;

  // Excel documents
  if ([
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ].includes(mimeType))
    return <span className="w-5 h-5 text-green-600"><BsFileEarmarkExcel /></span>;

  // PowerPoint documents
  if ([
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ].includes(mimeType))
    return <span className="w-5 h-5 text-orange-500"><BsFileEarmarkPpt /></span>;

  // Archive files
  if ([
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ].includes(mimeType))
    return <span className="w-5 h-5 text-yellow-500"><BsFileZip /></span>;

  // Code files
  if (
    mimeType.startsWith('text/') ||
    mimeType.includes('javascript') ||
    mimeType.includes('json') ||
    mimeType.includes('xml') ||
    mimeType.includes('css') ||
    mimeType.includes('html')
  ) {
    return <span className="w-5 h-5 text-green-400"><FiCode /></span>;
  }

  return <span className="w-5 h-5 text-gray-400"><FiFile /></span>;
};

// Helper function to format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


export default LabRoom;

