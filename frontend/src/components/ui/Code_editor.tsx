import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as monaco from 'monaco-editor';

// Configure Monaco Environment for Web Workers
(window as any).MonacoEnvironment = {
  getWorkerUrl: function (_moduleId: string, label:string) {
    if (label === 'typescript' || label === 'javascript') {
      return './ts.worker.js';
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return './html.worker.js';
    }
    if (label === 'css') {
      return './css.worker.js';
    }
    if (label === 'json') {
      return './json.worker.js';
    }
    return './editor.worker.js';
  }
};

interface CodeEditorProps {
  initialValue?: string;
  initialLanguage?: string;
  onChange?: (value: string) => void;
  theme?: 'vs' | 'vs-dark' | 'hc-black' | 'labrooms-dark';
  readOnly?: boolean;
  showLanguageSelector?: boolean;
  showFileUpload?: boolean;
  // Add these for integration with file sidebar
  roomCode?: string;
  memberName?: string;
  onFileSaved?: (file: { name: string; url: string }) => void;
  loadFile?: { code: string; filename: string; language?: string } | null;
  onFileLoaded?: () => void;
}

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

const DEFAULT_CODE_SAMPLES: Record<string, string> = {
  javascript: `// Write your JavaScript here\nfunction hello() {\n  return "Hello, world!";\n}`,
  typescript: `// Write your TypeScript here\nfunction hello(name: string): string {\n  return \`Hello, \${name}!\`;\n}`,
  python: `# Write your Python here\ndef hello():\n    return "Hello, world!"`,
  java: `// Write your Java here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}`,
  cpp: `// Write your C++ here\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}`,
  c: `// Write your C here\n#include <stdio.h>\n\nint main() {\n    printf("Hello, world!\\n");\n    return 0;\n}`,
  html: `<!DOCTYPE html>\n<html>\n<head>\n    <title>Hello World</title>\n</head>\n<body>\n    <h1>Hello, world!</h1>\n</body>\n</html>`,
  css: `/* Write your CSS here */\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n    color: #333;\n}`,
  php: `<?php\n// Write your PHP here\nfunction hello() {\n    return "Hello, world!";\n}\n?>`,
  shell: `#!/bin/bash\n# Write your shell script here\necho "Hello, world!"`,
};

const EXTENSION_TO_LANGUAGE: Record<string, string> = {};
SUPPORTED_LANGUAGES.forEach(lang => {
  lang.extensions.forEach(ext => {
    EXTENSION_TO_LANGUAGE[ext] = lang.value;
  });
});

const detectLanguage = (code: string): string | null => {
    const trimmedCode = code.trim();
    if (trimmedCode.includes('#include')) return 'cpp';
    if (/^\s*def\s+\w+\(.*\):/m.test(trimmedCode) || /^\s*if\s+__name__\s*==\s*['"]__main__['"]:/m.test(trimmedCode)) return 'python';
    if (trimmedCode.includes('public class') || trimmedCode.includes('System.out.println')) return 'java';
    if (trimmedCode.startsWith('#!/bin/bash') || trimmedCode.startsWith('#!/bin/sh')) return 'shell';
    if (/^\s*<!DOCTYPE html>/i.test(trimmedCode) || /^\s*<html/i.test(trimmedCode)) return 'html';
    if (trimmedCode.startsWith('<?php')) return 'php';
    if (/:\s*(string|number|boolean|any|void|Array<.*>)/.test(trimmedCode)) return 'typescript';
    if (trimmedCode.includes('function') || trimmedCode.includes('const') || trimmedCode.includes('let')) return 'javascript';
    if (/^[\s\w\.\#\-]+\s*\{/m.test(trimmedCode) && trimmedCode.includes('}')) return 'css';
    return null;
};

/*
const ThemeToggle = ({ theme, onClick }: { theme: string; onClick: () => void }) => {
  const isDark = theme === 'labrooms-dark';

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center h-8 w-16 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isDark
          ? 'bg-gray-700 focus:ring-gray-500 focus:ring-offset-gray-900'
          : 'bg-yellow-400 focus:ring-yellow-500 focus:ring-offset-gray-100'
      }`}
    >
      <span
        className={`absolute left-1 top-1 flex items-center justify-center h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
          isDark ? 'translate-x-0' : 'translate-x-8'
        }`}
      >
        {/* Moon Icon *}
        <svg
          className={`w-5 h-5 text-gray-700 transition-opacity duration-200 ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>

        {/* Sun Icon *}
        <svg
          className={`w-5 h-5 text-yellow-500 transition-opacity duration-200 ${
            !isDark ? 'opacity-100' : 'opacity-0'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 
            6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 
            0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 
            0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      </span>
    </button>
  );
};
*/


const WarningModal = ({ isOpen, message, onConfirm, onCancel, isDark }: { isOpen: boolean; message: string; onConfirm: () => void; onCancel: () => void; isDark: boolean; }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`p-6 rounded-lg shadow-xl w-full max-w-md ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0 mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <div className="ml-4 text-left">
                <h3 className="text-lg leading-6 font-medium">Security Warning</h3>
                <div className="mt-2">
                    <p className="text-sm">{message}</p>
                </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button onClick={onConfirm} type="button" className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium sm:ml-3 sm:w-auto sm:text-sm ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
              Accept
            </button>
            <button onClick={onCancel} type="button" className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 bg-transparent text-base font-medium sm:mt-0 sm:w-auto sm:text-sm ${isDark ? 'border-gray-600 hover:bg-gray-700 text-white' : 'border-gray-300 hover:bg-gray-100 text-gray-700'}`}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
};


const CodeEditor: React.FC<CodeEditorProps> = ({
  initialValue = '',
  initialLanguage = 'javascript',
  onChange,
  // theme = 'labrooms-dark',
  readOnly = false,
  showLanguageSelector = true,
  showFileUpload = true,
  roomCode,
  memberName,
  onFileSaved,
  loadFile,
  onFileLoaded,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef<HTMLDivElement>(null);
  const monacoInstanceRef = useRef<typeof monaco | null>(null);
  const isUploadingFileRef = useRef(false);
  const isChangingLanguageRef = useRef(false);

  const [isEditorReady, setIsEditorReady] = useState(false);
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(initialValue || DEFAULT_CODE_SAMPLES[initialLanguage] || '');
  const [currentTheme] = useState<'vs' | 'vs-dark' | 'hc-black' | 'labrooms-dark'>('labrooms-dark');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [modalState, setModalState] = useState({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} });
  const [filename, setFilename] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const PotentiallyHarmfulExtensions = ['.py', '.js', '.exe', '.msi'];
  const PotentiallyHarmfulLanguages = ['python', 'javascript'];

  useEffect(() => {
    const loaderUrl = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.36.1/min/vs/loader.js';
    const loadMonaco = () => {
      (window as any).require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.36.1/min/vs' }});
      (window as any).require(['vs/editor/editor.main'], (monacoModule: typeof monaco) => {
        monacoInstanceRef.current = monacoModule;
        registerLanguages(monacoModule);
        setIsEditorReady(true);
      });
    };
    if (!(window as any).require) {
      const script = document.createElement('script');
      script.src = loaderUrl;
      script.onload = loadMonaco;
      document.body.appendChild(script);
    } else { loadMonaco(); }
  }, []);

  useEffect(() => {
    const monaco = monacoInstanceRef.current;
    if (!isEditorReady || !monacoEl.current || !monaco) return;

    const editor = monaco.editor.create(monacoEl.current, { 
      value: code, 
      language, 
      theme: currentTheme, 
      automaticLayout: true, 
      minimap: { enabled: false }, 
      scrollBeyondLastLine: false, 
      fontSize: 14, 
      readOnly, 
      lineNumbers: 'on', 
      roundedSelection: true, 
      lineHeight: 24,
      padding: { top: 16, bottom: 16 },
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8
      }
    });
    
    const changeListener = editor.onDidChangeModelContent((event) => {
        const value = editor.getValue();
        setCode(value);
        onChange?.(value);

        if (isUploadingFileRef.current || isChangingLanguageRef.current) {
            isUploadingFileRef.current = false;
            isChangingLanguageRef.current = false;
            return;
        }

        const isSignificantChange = event.changes.some(change => change.text.length > 50);
        if (isSignificantChange) {
            const detectedLang = detectLanguage(value);
            if (detectedLang && PotentiallyHarmfulLanguages.includes(detectedLang)) {
                setModalState({
                    isOpen: true,
                    message: `The pasted code was detected as '${detectedLang}', which may be harmful if executed. Do you want to keep it?`,
                    onConfirm: () => setModalState({ ...modalState, isOpen: false }),
                    onCancel: () => {
                        editorRef.current?.setValue('');
                        setModalState({ ...modalState, isOpen: false });
                    }
                });
            }
            setLanguage(currentLang => detectedLang && detectedLang !== currentLang ? detectedLang : currentLang);
        }
    });

    editorRef.current = editor;
    return () => { changeListener.dispose(); editor.dispose(); editorRef.current = null; };
  }, [isEditorReady, onChange]);

  /*
  useEffect(() => {
    const monaco = monacoInstanceRef.current;
    if (editorRef.current && monaco) { monaco.editor.setTheme(currentTheme); }
  }, [currentTheme]);
    */

  useEffect(() => {
    const monaco = monacoInstanceRef.current;
    if (!editorRef.current || !monaco) return;
    const model = editorRef.current.getModel();
    if (model) { monaco.editor.setModelLanguage(model, language); }
  }, [language]);

  // Load file from outside (when user clicks "View" in files section)
  useEffect(() => {
    if (loadFile) {
      setCode(loadFile.code);
      setFilename(loadFile.filename.replace(/\.[^/.]+$/, "")); // Remove extension for editing
      if (loadFile.language) setLanguage(loadFile.language);
      if (editorRef.current) editorRef.current.setValue(loadFile.code);
      onFileLoaded && onFileLoaded();
    }
    // eslint-disable-next-line
  }, [loadFile]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    if (!code || Object.values(DEFAULT_CODE_SAMPLES).includes(code)) {
      const newSample = DEFAULT_CODE_SAMPLES[newLanguage] || '';
      setCode(newSample);
      if (editorRef.current) { 
        isChangingLanguageRef.current = true;
        editorRef.current.setValue(newSample); 
      }
    }
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    const loadFileContent = (fileContent: string) => {
        const detectedLanguage = EXTENSION_TO_LANGUAGE[extension] || language;
        isUploadingFileRef.current = true;
        setLanguage(detectedLanguage);
        setCode(fileContent);
        editorRef.current?.setValue(fileContent);
    };

    if (PotentiallyHarmfulExtensions.includes(extension)) {
        setModalState({
            isOpen: true,
            message: `The file type '${extension.slice(1)}' may contain executable code and could be harmful. Are you sure you want to open it?`,
            onConfirm: () => {
                const reader = new FileReader();
                reader.onload = (event) => loadFileContent(event.target?.result as string);
                reader.readAsText(file);
                setModalState({ ...modalState, isOpen: false });
            },
            onCancel: () => setModalState({ ...modalState, isOpen: false }),
        });
    } else {
        const reader = new FileReader();
        reader.onload = (event) => loadFileContent(event.target?.result as string);
        reader.readAsText(file);
    }

    if (fileInputRef.current) { fileInputRef.current.value = ''; }
  }, [language]);

  // Save code as file to backend
  const handleSend = async () => {
    if (!roomCode || !filename.trim()) {
      alert('Please enter a filename.');
      return;
    }
    if (!code.trim()) {
      alert('Cannot save a blank file.');
      return;
    }
    setIsSaving(true);
    try {
      // Infer extension from language
      const ext = SUPPORTED_LANGUAGES.find(l => l.value === language)?.extensions?.[0] || '.txt';
      const fullFilename = filename.endsWith(ext) ? filename : filename + ext;
      // Save to backend
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/files/${roomCode}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: fullFilename,
          url: URL.createObjectURL(new Blob([code], { type: 'text/plain' })), // Placeholder, backend should ignore this
          fileType: 'code',
          mimeType: 'text/plain',
          size: code.length,
          uploader: { id: 'frontend', name: memberName || 'Host' },
          publicId: '', // Not needed for code files
          code, // Send code as a separate field
        }),
      });
      if (res.ok) {
        setIsSaving(false);
        setFilename('');
        if (onFileSaved) onFileSaved({ name: fullFilename, url: '' });
        alert('Code file saved!');
      } else {
        setIsSaving(false);
        alert('Failed to save file');
      }
    } catch (err) {
      setIsSaving(false);
      alert('Error saving file');
    }
  };

  // const toggleTheme = () => { setCurrentTheme((prevTheme) => (prevTheme === 'labrooms-dark' ? 'vs' : 'labrooms-dark')); };
  const isDark = currentTheme === 'labrooms-dark';

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* ...existing code... */}
      <WarningModal 
          isOpen={modalState.isOpen}
          message={modalState.message}
          onConfirm={modalState.onConfirm}
          onCancel={modalState.onCancel}
          isDark={isDark}
      />
      <div className={`w-full h-full flex flex-col min-h-0 transition-colors duration-300 ${isDark ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>
          <div className="flex-shrink-0 flex items-center gap-4 mb-4">
              {showLanguageSelector && (
              <select value={language} onChange={handleLanguageChange} className={`py-1.5 px-3 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${isDark ? 'bg-gray-700 text-white border border-gray-600' : 'bg-white text-black border border-gray-300'}`}>
                  {SUPPORTED_LANGUAGES.map((lang) => (<option key={lang.value} value={lang.value}>{lang.label}</option>))}
              </select>
              )}
              {showFileUpload && (
              <>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept={SUPPORTED_LANGUAGES.flatMap(lang => lang.extensions).join(',')} className="hidden" id="code-file-upload"/>
                  <label htmlFor="code-file-upload" className={`py-1.5 px-4 text-sm rounded-md cursor-pointer hover:opacity-80 transition-all duration-300 ${isDark ? 'bg-gray-700 text-white border border-gray-600' : 'bg-white text-black border border-gray-300'}`}>
                  Upload File
                  </label>
              </>
              )}
              {/* Filename input and Send button */}
              <input
                type="text"
                placeholder="File name (e.g. mycode.js)"
                value={filename}
                onChange={e => setFilename(e.target.value)}
                className={`py-1.5 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`}
                style={{ minWidth: 120 }}
              />
              <button
                onClick={handleSend}
                disabled={isSaving}
                className={`py-1.5 px-4 text-sm rounded-md font-semibold transition-all duration-300 ${isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'} ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              {/*
              <div className="ml-auto">
                  <ThemeToggle theme={currentTheme} onClick={toggleTheme} />
              </div>
              */}
          </div>
          <div ref={monacoEl} className="w-full flex-1 rounded-lg overflow-hidden transition-colors duration-300"/>
      </div>
    </div>
  );
};

function registerLanguages(monacoInstance: typeof monaco) {
  monacoInstance.editor.defineTheme('labrooms-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5c6773', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7733' },
      { token: 'number', foreground: 'ffcc66' },
      { token: 'string', foreground: '99cc99' },
      { token: 'type.identifier', foreground: 'ffcc66' },
      { token: 'delimiter.html', foreground: '808080' },
      { token: 'tag.html', foreground: '569cd6' },
      { token: 'attribute.name.html', foreground: '9cdcfe' },
      { token: 'attribute.value.html', foreground: 'ce9178' },
    ],
    colors: {
      'editor.background': '#1e1e1e', 'editor.foreground': '#d4d4d4', 'editor.lineHighlightBackground': '#282828', 'editor.lineNumbers': '#858585', 'editor.selectionBackground': '#264f78', 'editorCursor.foreground': '#a6a6a6', 'editorWhitespace.foreground': '#404040', 'editorIndentGuide.background': '#404040', 'editorIndentGuide.activeBackground': '#707070', 'editor.lineHighlightBorder': '#282828', 'editorGutter.background': '#1E1E1E', 'editorWidget.background': '#252526', 'editorWidget.border': '#454545', 'editorHoverWidget.background': '#252526', 'editorHoverWidget.border': '#454545',
    },
  });
  monacoInstance.languages.typescript.javascriptDefaults.setCompilerOptions({ target: monacoInstance.languages.typescript.ScriptTarget.ES2015, allowNonTsExtensions: true, lib: ['es2015'], });
  monacoInstance.languages.typescript.typescriptDefaults.setCompilerOptions({ target: monacoInstance.languages.typescript.ScriptTarget.ES2015, allowNonTsExtensions: true, lib: ['es2015'], module: monacoInstance.languages.typescript.ModuleKind.ES2015, });
}

export default CodeEditor;
