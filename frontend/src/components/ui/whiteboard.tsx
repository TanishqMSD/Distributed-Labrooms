import React, { useRef, useEffect, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

// Define the props for our component, which requires a unique roomId
interface WhiteboardProps {
  roomId: string;
  isDarkTheme?: boolean;
  userName?: string; // Add userName prop
}

// Define the structure of the data for a single drawing action
interface DrawData {
  x0: number; // Start X
  y0: number; // Start Y
  x1: number; // End X
  y1: number; // End Y
  color: string;
  lineWidth: number;
  userName?: string; // Add userName to drawing data
  isNewStroke?: boolean; // To indicate start of a new stroke
}

// For showing user labels above strokes
interface Label {
  x: number;
  y: number;
  userName: string;
  timestamp: number;
}

const LABEL_DISPLAY_TIME = 2000; // ms

const Whiteboard: React.FC<WhiteboardProps> = ({ roomId, isDarkTheme = true, userName = "Anonymous" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff'); // Default color is white
  const [lineWidth, setLineWidth] = useState(5);  // Default line width
  const [labels, setLabels] = useState<Label[]>([]);
  
  // Use a ref to store the socket instance so it persists across re-renders
  const socketRef = useRef<Socket | null>(null);
  
  // Ref to store the previous drawing position for a continuous line
  const prevPosRef = useRef<{ x: number, y: number } | null>(null);
  const isFirstDrawOfStroke = useRef(true);

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  
  // Theme-based styling (recalculate on every render)
  const themeClasses = useMemo(() => ({
    container: isDarkTheme 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-gray-200 border-gray-300',
    toolbar: isDarkTheme 
      ? 'bg-gray-900' 
      : 'bg-gray-100',
    canvas: isDarkTheme 
      ? 'bg-gray-700' 
      : 'bg-white',
    text: isDarkTheme 
      ? 'text-white' 
      : 'text-gray-900',
    button: isDarkTheme 
      ? 'bg-gray-700 hover:bg-gray-600' 
      : 'bg-gray-300 hover:bg-gray-400',
    buttonActive: isDarkTheme 
      ? 'bg-blue-600' 
      : 'bg-blue-500',
    ringOffset: isDarkTheme 
      ? 'ring-offset-gray-900' 
      : 'ring-offset-gray-100'
  }), [isDarkTheme]);

  // This is the main effect for setting up the component
  useEffect(() => {
    // --- 1. Connect to the Socket.IO server ---
    // Use environment variable or fallback to localhost:3001
    const backendUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3001';
    const socket = io(backendUrl, {
      query: { roomId },
    });
    socketRef.current = socket;

    // --- 2. Set up the canvas and drawing context ---
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Function to set canvas dimensions based on its container
    const setCanvasDimensions = () => {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
    };
    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);

    // --- 3. Set up Socket.IO event listeners ---

    // 'canvasState': When a user first joins, the server sends the saved canvas state.
    socket.on('canvasState', (state: string) => {
      const img = new Image();
      img.src = state;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        // Reset undo/redo stacks on load
        setUndoStack([]);
        setRedoStack([]);
      };
    });

    // 'drawing': This event is received when *another* user is drawing.
    socket.on('drawing', (data: DrawData) => {
      // Save state before drawing from others for undo
      if (canvasRef.current) {
        setUndoStack(prev => [...prev, canvasRef.current!.toDataURL()]);
        setRedoStack([]);
      }
      drawLine(ctx, data.x0, data.y0, data.x1, data.y1, data.color, data.lineWidth);
      // Show label if it's the start of a new stroke and userName is present
      if (data.isNewStroke && data.userName) {
        setLabels(prev => [
          ...prev,
          { x: data.x0, y: data.y0, userName: data.userName!, timestamp: Date.now() }
        ]);
      }
    });

    // 'canvasCleared': Received when the canvas is cleared by another user.
    socket.on('canvasCleared', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setUndoStack(prev => [...prev, canvas.toDataURL()]);
      setRedoStack([]);
    });

    // --- 4. Cleanup function on component unmount ---
    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
      socket.disconnect(); // Disconnect the socket to prevent memory leaks
    };
  }, [roomId]); // This effect runs only once when the component mounts

  // --- Core Drawing Logic ---

  // Reusable function to draw a line on a given canvas context
  const drawLine = (
    context: CanvasRenderingContext2D,
    x0: number, y0: number, x1: number, y1: number,
    lineColor: string,
    lineWidthValue: number
  ) => {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = lineColor;
    context.lineWidth = lineWidthValue;
    context.lineCap = 'round'; // Makes lines look smoother
    context.stroke();
    context.closePath();
  };

  // Event handler for when the mouse button is pressed down
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Save current state for undo
    if (canvasRef.current) {
      setUndoStack(prev => [...prev, canvasRef.current!.toDataURL()]);
      setRedoStack([]);
    }
    const { offsetX, offsetY } = e.nativeEvent;
    setIsDrawing(true);
    prevPosRef.current = { x: offsetX, y: offsetY };
    isFirstDrawOfStroke.current = true;
  };

  // Event handler for when the mouse moves
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && prevPosRef.current) {
      const drawData: DrawData = {
        x0: prevPosRef.current.x,
        y0: prevPosRef.current.y,
        x1: offsetX,
        y1: offsetY,
        color: color,
        lineWidth: lineWidth,
        userName,
        isNewStroke: isFirstDrawOfStroke.current,
      };

      drawLine(ctx, drawData.x0, drawData.y0, drawData.x1, drawData.y1, drawData.color, drawData.lineWidth);

      // Show label locally for the user's own stroke
      if (isFirstDrawOfStroke.current) {
        setLabels(prev => [
          ...prev,
          { x: drawData.x0, y: drawData.y0, userName, timestamp: Date.now() }
        ]);
        isFirstDrawOfStroke.current = false;
      }

      // Emit the drawing event to the server to be broadcasted to others
      if (socketRef.current) {
        socketRef.current.emit('drawing', drawData);
      }

      prevPosRef.current = { x: offsetX, y: offsetY };
    }
  };

  // Event handler for when the mouse button is released
  const stopDrawing = () => {
    setIsDrawing(false);
    prevPosRef.current = null;

    // After drawing, we send the entire canvas state to the server for persistence.
    if (socketRef.current && canvasRef.current) {
        const canvasState = canvasRef.current.toDataURL(); // Converts canvas to Base64 image string
        socketRef.current.emit('saveCanvasState', canvasState);
    }
  };

  // Function to clear the entire canvas
  const clearCanvas = () => {
    // Save current state for undo
    if (canvasRef.current) {
      setUndoStack(prev => [...prev, canvasRef.current!.toDataURL()]);
      setRedoStack([]);
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tell the server to clear the canvas for everyone else
    if (socketRef.current) {
      socketRef.current.emit('clearCanvas');
      // Also send the empty canvas state to be saved in the database
      socketRef.current.emit('saveCanvasState', canvas.toDataURL());
    }
  };

  // Undo function
  const handleUndo = () => {
    if (undoStack.length === 0 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const prevState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, canvas.toDataURL()]);
    const img = new Image();
    img.src = prevState;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      // Emit the new state to the server
      if (socketRef.current) {
        socketRef.current.emit('saveCanvasState', canvas.toDataURL());
      }
    };
  };

  // Redo function
  const handleRedo = () => {
    if (redoStack.length === 0 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, canvas.toDataURL()]);
    const img = new Image();
    img.src = nextState;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      // Emit the new state to the server
      if (socketRef.current) {
        socketRef.current.emit('saveCanvasState', canvas.toDataURL());
      }
    };
  };

  // Remove old labels periodically
  useEffect(() => {
    if (labels.length === 0) return;
    const interval = setInterval(() => {
      setLabels((prev) => prev.filter(l => Date.now() - l.timestamp < LABEL_DISPLAY_TIME));
    }, 500);
    return () => clearInterval(interval);
  }, [labels]);

  // --- UI Rendering ---
  const colorPalette = ['#ffffff', '#000000', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#06b6d4'];
  const penSizes = [
    { label: 'S', value: 2 },
    { label: 'M', value: 5 },
    { label: 'L', value: 10 },
    { label: 'XL', value: 20 },
  ];

  return (
    <div className={`w-full h-full flex flex-col rounded-xl overflow-hidden border shadow-lg ${themeClasses.container}`}>
      {/* Toolbar */}
      <div className={`p-2 flex items-center gap-4 flex-wrap ${themeClasses.toolbar}`}>
        {/* Undo/Redo Buttons */}
        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className={`bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm ${undoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className={`bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm ${redoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Redo
        </button>

        <div className="flex items-center gap-2">
            <span className={`${themeClasses.text} text-xs mr-2 font-semibold`}>Color</span>
            {colorPalette.map((c) => (
                <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition-transform duration-150 border-2 border-transparent ${color === c ? `ring-2 ring-offset-2 ${themeClasses.ringOffset} ring-white scale-110` : 'hover:scale-110'}`}
                style={{ backgroundColor: c }}
                />
            ))}
        </div>

        <div className="flex items-center gap-2">
            <span className={`${themeClasses.text} text-xs mr-2 font-semibold`}>Size</span>
             {penSizes.map((size) => (
                <button
                key={size.label}
                onClick={() => setLineWidth(size.value)}
                className={`w-8 h-8 rounded-md transition-colors duration-150 ${themeClasses.text} font-bold text-sm flex items-center justify-center ${lineWidth === size.value ? themeClasses.buttonActive : themeClasses.button}`}
                >
                {size.label}
                </button>
            ))}
        </div>

        <button
            onClick={clearCanvas}
            className="ml-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
        >
            Clear
        </button>
      </div>

      {/* Canvas Drawing Area */}
      <div className={`flex-1 w-full min-h-0 overflow-hidden ${themeClasses.canvas}`} style={{ position: 'relative' }}>
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing} // Stop drawing if mouse leaves canvas
            className="cursor-crosshair w-full h-full"
        />
        {/* Render labels above strokes */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%' }}
        >
          {labels.map((label, idx) => (
            <g key={idx} transform={`translate(${label.x},${label.y - 10})`}>
              <rect
                x={-2}
                y={-18}
                width={label.userName.length * 8 + 8}
                height={18}
                rx={6}
                fill={isDarkTheme ? "#222" : "#fff"}
                opacity={0.85}
              />
              <text
                x={6}
                y={-6}
                fontSize="12"
                fill={isDarkTheme ? "#fff" : "#222"}
                fontWeight="bold"
                style={{ fontFamily: 'sans-serif', pointerEvents: 'none' }}
              >
                {label.userName}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default Whiteboard;

