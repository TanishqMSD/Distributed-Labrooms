import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useNavigate } from 'react-router-dom'

const CreateRoom: React.FC = () => {
  const navigate = useNavigate()
  const [roomName, setRoomName] = useState('')
  const [hostName, setHostName] = useState('')
  const [expiry, setExpiry] = useState('2h')
  const [enablePassword, setEnablePassword] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // const [hostNameError, setHostNameError] = useState('');
  // const [roomNameError, setRoomNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const expiryOptions = [
    { label: '2 hours', value: '2h' },
    { label: '1 day', value: '1d' },
    { label: '7 days', value: '7d' },
    { label: '1 year', value: '1y' },
  ]

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Input Validation
    // const unameRegEx = /^[a-zA-Z][a-zA-Z0-9_]{1,25}$/;
    // const rnameRegEx = /^[a-zA-Z][a-zA-Z0-9 _]{1,25}$/;
    const passwordRegEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    let errorFlag = false;

    // if(!rnameRegEx.test(roomName.trim())) {
    //   setRoomNameError(() => "Invalid Room Name");
    //   errorFlag = true;
    //   setIsLoading(false);
    // }
    // else {
    //   setRoomNameError("");
    // }

    // if(!unameRegEx.test(hostName.trim())) {
    //   setHostNameError(() => "Invalid Host Name");
    //   errorFlag = true;
    //   setIsLoading(false);
    // } 
    // else {
    //   setHostNameError(() => "");
    // }

    if(enablePassword && !passwordRegEx.test(password.trim())) {
      setPasswordError(() => "Password must contain: at least 1 uppercase letter, 1 lowercase letter, 1 digit, 1 special character (@$!%*?&), and be at least 8 characters long." );
      errorFlag = true;
      setIsLoading(false);
    }
    else {
      setPasswordError("");
    }

    if(errorFlag) {
      return;
    }

    try {
      const roomData: any = { roomName, hostName, expiry }
      if (enablePassword && password.trim()) {
        roomData.password = password.trim()
      }

      const response = await fetch(import.meta.env.VITE_API_URL + '/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData)
      })
      if (!response.ok) throw new Error('Failed to create room')
      const room = await response.json()
      const roomNameParam = room.data?.roomName || 'Untitled Room'
      const hostNameParam = room.data?.hostName || 'Anonymous Host'

      navigate(`/labroom/${room.code}?roomName=${encodeURIComponent(roomNameParam)}&hostName=${encodeURIComponent(hostNameParam)}`)
    } catch (err) {
      alert('Error creating room: ' + (err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToHome = () => {
    navigate('/')
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
                {/* Header */}
                <div className="text-center mb-4 md:mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-blue-500/20 backdrop-blur-sm rounded-xl md:rounded-2xl mb-3 md:mb-4 border border-blue-500/30">
                    <span className="text-xl md:text-2xl">🚀</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 mb-2">
                    Create Room
                  </h1>
                  <p className="text-gray-300 text-sm md:text-base">Set up your collaborative workspace</p>
                </div>

                {/* Form */}
                <form onSubmit={handleCreateRoom} className="space-y-4 md:space-y-5">
                  {/* Room Name */}
                  <div className="space-y-2">
                    <Label htmlFor="roomName" className="text-blue-300 font-bold text-sm flex items-center gap-2">
                      <span className="text-base md:text-lg"></span>
                      Room Name
                    </Label>
                    <div className="relative">
                      <Input
                        id="roomName"
                        type="text"
                        placeholder="Enter room name..."
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="w-full bg-gray-900/40 backdrop-blur-sm border-2 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/30 rounded-lg py-3 px-4 text-sm transition-all duration-300 hover:border-blue-500/50 hover:bg-gray-900/60"
                      />
                      <div className="absolute inset-0 bg-blue-500/10 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {/* {roomNameError && <p className='text-red-500 text-sm font-bold'>{roomNameError}</p>} */}
                  </div>
                  {/* Host Name */}
                  <div className="space-y-2">
                    <Label htmlFor="hostName" className="text-blue-300 font-bold text-sm flex items-center gap-2">
                      <span className="text-base md:text-lg"></span>
                      Host Name
                    </Label>
                    <div className="relative">
                      <Input
                        id="hostName"
                        type="text"
                        placeholder="Your name..."
                        value={hostName}
                        onChange={(e) => setHostName(e.target.value)}
                        className="w-full bg-gray-900/40 backdrop-blur-sm border-2 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/30 rounded-lg py-3 px-4 text-sm transition-all duration-300 hover:border-blue-500/50 hover:bg-gray-900/60"
                      />
                      <div className="absolute inset-0 bg-blue-500/10 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {/* {hostNameError && <p className='text-red-500 font-bold text-sm'>{hostNameError}</p>} */}
                  </div>
                  {/* Room Expiry */}
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="text-blue-300 font-bold text-sm flex items-center gap-2">
                      <span className="text-base md:text-lg"></span>
                      Room Expiry
                    </Label>
                    <div className="relative">
                      <select
                        id="expiry"
                        className="w-full rounded-lg border-2 border-blue-500/30 bg-gray-900/40 backdrop-blur-sm text-white py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 hover:border-blue-500/50 hover:bg-gray-900/60"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                      >
                        {expiryOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-gray-900">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-0 bg-blue-500/10 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>
                  {/* Password Protection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-blue-300 font-bold text-sm flex items-center gap-2">
                        <span className="text-base md:text-lg"></span>
                        Password Protection
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          setEnablePassword(!enablePassword)
                          if (!enablePassword) {
                            setPassword('')
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          enablePassword ? 'bg-blue-500' : 'bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            enablePassword ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    {enablePassword && (
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-blue-300 font-bold text-sm flex items-center gap-2">
                          <span className="text-base md:text-lg"></span>
                          Room Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter room password..."
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
                        {passwordError && <p className='text-red-500 text-sm font-bold'>{passwordError}</p>}
                      </div>
                    )}
                  </div>
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="group relative w-full py-4 text-lg font-bold bg-blue-600 text-white rounded-lg shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating Room...
                          </>
                        ) : (
                          <>
                            <span>🎉</span>
                            Create Room
                          </>
                        )}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      onClick={handleBackToHome}
                      className="group w-full py-3 text-base font-bold border-2 border-blue-500/50 text-blue-300 bg-gray-900/10 backdrop-blur-sm hover:bg-blue-500/10 rounded-lg transition-all duration-300 transform hover:scale-105"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>←</span>
                        Back to Home
                      </span>
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 via-gray-900/50 to-transparent" />
    </div>
  )
}


export default CreateRoom
