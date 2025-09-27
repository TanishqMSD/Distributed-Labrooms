import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useNavigate } from 'react-router-dom'

const JoinRoom: React.FC = () => {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showRoomCode, setShowRoomCode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [error, setError] = useState('')

  // const [nameError, setNameError] = useState("");

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    // Input Validation
    // const unameRegEx = /^[a-zA-Z][a-zA-Z0-9_]{1,25}$/;

    // if(!unameRegEx.test(name.trim())) {
    //   setNameError(() => "Invalid User Name");
    //   setIsLoading(false);
    //   return;
    // } 
    // else {
    //   setNameError(() => "");
    // }

    setIsLoading(true)
    setError('')

    try {
      // Check if room exists
      const response = await fetch(`${import.meta.env.VITE_API_URL}/rooms/code/${roomCode.trim().toUpperCase()}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Room not found. Please check the room code.')
        } else {
          setError('Failed to join room. Please try again.')
        }
        return
      }

      const room = await response.json()
      
      // If room has password protection, validate password
      if (room.password && room.password !== password) {
        setError('Incorrect password')
        return
      }

      await fetch(`${import.meta.env.VITE_API_URL}/rooms/${room.code}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() })
    })

      // Navigate to the room
      const roomNameParam = room.data?.roomName || 'Untitled Room'
      const hostNameParam = room.data?.hostName || 'Anonymous Host'
      navigate(`/labroom/${room.code}?roomName=${encodeURIComponent(roomNameParam)}&hostName=${encodeURIComponent(hostNameParam)}&memberName=${encodeURIComponent(name.trim())}`)
      
    } catch (err) {
      setError('Failed to join room. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-950">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gray-950">
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-500/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(37, 99, 235, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37, 99, 235, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-6">
        <div className={`w-full max-w-lg mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Modern Glass Card Design */}
          <div className="relative">
            {/* Animated Background Blobs */}
            <div className="absolute -top-2 -left-2 w-12 h-12 md:w-16 md:h-16 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
            <div className="absolute -bottom-2 -right-2 w-16 h-16 md:w-20 md:h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            {/* Main Card Container */}
            <div className="relative bg-gray-900/80 backdrop-blur-2xl rounded-xl md:rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
              {/* Top Accent Bar */}
              <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600" />
              
              <div className="p-4 md:p-6">
                {/* Remove Back Arrow */}
                {/* Header */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 mb-2">
                    Join Room
                  </h1>
                  <p className="text-gray-300 text-sm">
                    Enter the room code to join your team's workspace
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleJoinRoom} className="space-y-4 md:space-y-5">
                  {/* Your Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-blue-300 font-bold text-sm flex items-center gap-2">
                      <span className="text-base md:text-lg"></span>
                      Your Name
                    </Label>
                    <div className="relative">
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-gray-900/40 backdrop-blur-sm border-2 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/30 rounded-lg py-3 px-4 text-sm transition-all duration-300 hover:border-blue-500/50 hover:bg-gray-900/60"
                      />
                      <div className="absolute inset-0 bg-blue-500/10 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {/* {nameError && <p className='text-red-500 text-sm font-bold'>{nameError}</p>} */}
                  </div>

                  {/* Room Code */}
                  <div className="space-y-2">
                    <Label htmlFor="roomCode" className="text-blue-300 font-bold text-sm flex items-center gap-2">
                      <span className="text-base md:text-lg"></span>
                      Room Code
                    </Label>
                    <div className="relative">
                      <Input
                        id="roomCode"
                        type={showRoomCode ? "text" : "password"}
                        placeholder="Enter the Room Code"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        className="w-full bg-gray-900/40 backdrop-blur-sm border-2 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/30 rounded-lg py-3 px-4 pr-12 text-sm transition-all duration-300 hover:border-blue-500/50 hover:bg-gray-900/60 font-mono tracking-wider"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRoomCode(!showRoomCode)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors duration-200"
                      >
                        {showRoomCode ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                      <div className="absolute inset-0 bg-blue-500/10 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>

                  {/* Optional Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-blue-300 font-bold text-sm flex items-center gap-2">
                      <span className="text-base md:text-lg"></span>
                      Password (Optional)
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter room password if required"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-900/40 backdrop-blur-sm border-2 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/30 rounded-lg py-3 px-4 pr-12 text-sm transition-all duration-300 hover:border-blue-500/50 hover:bg-gray-900/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors duration-200"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                      <div className="absolute inset-0 bg-blue-500/10 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 group relative px-6 py-3 text-base font-bold bg-blue-600 text-white rounded-xl shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <span className="text-lg">🚀</span>
                            Join Room
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
                </form>

                {/* Help Text */}
                <div className="mt-6 text-center">
                  <p className="text-gray-300 text-sm md:text-base font-medium">
                    Don't have a room code?{' '}
                    <button
                      onClick={() => navigate('/create-room')}
                      className="text-blue-400 hover:text-blue-300 transition-colors duration-200 underline font-semibold"
                    >
                      Create a new room
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


export default JoinRoom
