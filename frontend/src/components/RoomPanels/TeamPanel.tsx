import React from 'react'

export interface TeamMember {
  id: string
  name: string
  isOnline: boolean
  joinedAt: Date
}

interface TeamPanelProps {
  open: boolean
  onClose: () => void
  hostName: string
  teamMembers: TeamMember[]
  themeClasses: {
    card: string
    border: string
    cardSecondary: string
    text: string
    textMuted: string
    buttonSecondary: string
  }
}

const TeamPanel: React.FC<TeamPanelProps> = ({ open, onClose, hostName, teamMembers, themeClasses }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${themeClasses.card} rounded-2xl ${themeClasses.border} border shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${themeClasses.text} flex items-center gap-2`}>
              <span className="text-xl">👥</span>
              Team Members ({teamMembers.length + 1})
            </h3>
            <button onClick={onClose} className={`p-2 ${themeClasses.buttonSecondary} rounded-lg hover:scale-105 transition-transform`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            <div className={`flex items-center gap-3 ${themeClasses.cardSecondary} rounded-lg p-3`}>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">{hostName[0]}</span>
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${themeClasses.text}`}>{hostName}</p>
                <p className="text-xs text-blue-500 flex items-center gap-1">
                  <span className="text-sm">👑</span>
                  Host
                </p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>

            {teamMembers.map((member) => (
              <div key={member.id} className={`flex items-center gap-3 ${themeClasses.cardSecondary} rounded-lg p-3 transition-colors hover:scale-[1.02]`}>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{member.name[0]}</span>
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${themeClasses.text}`}>{member.name}</p>
                  <p className={`text-xs ${themeClasses.textMuted}`}>
                    Joined {Math.floor((Date.now() - member.joinedAt.getTime()) / 60000)} min ago
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full ${member.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              </div>
            ))}

            {teamMembers.length === 0 && (
              <div className="text-center py-6">
                <p className={`${themeClasses.textMuted} text-sm`}>No other members yet</p>
                <p className={`${themeClasses.textMuted} text-xs mt-1`}>Share the room code to invite others</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamPanel
