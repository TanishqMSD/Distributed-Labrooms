import React from 'react'
import type { FormEvent } from 'react'

export interface ChatMessage {
  id: string
  sender: string
  content: string
  timestamp: Date
  type: 'message' | 'system'
}

interface ChatSidebarProps {
  open: boolean
  onClose: () => void
  messages: ChatMessage[]
  newMessage: string
  onChangeMessage: (val: string) => void
  onSend: () => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  themeClasses: {
    card: string
    border: string
    cardSecondary: string
    text: string
    textMuted: string
    buttonSecondary: string
    input: string
  }
}

// Function to find URLs in text and wrap them in a clickable anchor tag
const renderMessageWithLinks = (text: string, themeClasses: any) => {
  // Regular expression to find URLs starting with http:// or https://
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Split the text by the URL regex to get an array of text and URLs
  return text.split(urlRegex).map((part, index) => {
    // Check if the part is a URL
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank" // Opens the link in a new tab
          rel="noopener noreferrer" // Security best practice
          className={`text-blue-400 hover:underline cursor-pointer ${themeClasses.text}`}
        >
          {part}
        </a>
      );
    }
    // If it's not a URL, return the plain text
    return part;
  });
};

const ChatSidebar: React.FC<ChatSidebarProps> = ({ open, onClose, messages, newMessage, onChangeMessage, onSend, messagesEndRef, themeClasses }) => {
  if (!open) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSend()
  }

  return (
    <div className="w-[86vw] sm:w-[360px] lg:w-[380px] shrink-0 transition-all duration-300">
      <div className={`${themeClasses.card} rounded-2xl ${themeClasses.border} border shadow-lg h-full flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${themeClasses.text} flex items-center gap-2`}>
              <span className="text-xl">💬</span>
              Team Chat
            </h3>
            <button onClick={onClose} className={`p-2 ${themeClasses.buttonSecondary} rounded-lg hover:scale-105 transition-transform`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className={`${message.type === 'system' ? 'text-center' : ''}`}>
                {message.type === 'system' ? (
                  <div className={`text-xs ${themeClasses.textMuted} py-1`}>{message.content}</div>
                ) : (
                  <div className={`${themeClasses.cardSecondary} rounded-lg p-3 ${themeClasses.border} border`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${themeClasses.text}`}>{message.sender}</span>
                      <span className={`text-xs ${themeClasses.textMuted}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {/* Render message content with clickable links */}
                    <p className={`text-sm ${themeClasses.textMuted} break-words`}>
                      {renderMessageWithLinks(message.content, themeClasses)}
                    </p>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => onChangeMessage(e.target.value)}
              className={`flex-1 ${themeClasses.input} rounded-lg px-4 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <button type="submit" className={`px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors hover:scale-105`}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChatSidebar