import { useState } from 'react'
//import CodeEditor from '@uiw/react-textarea-code-editor'
import { Button } from '../components/ui/button'

interface CodeSnippet {
  name: string
  code: string
}

const Room = () => {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [snippets, setSnippets] = useState<CodeSnippet[]>([])

  const handleSave = () => {
    if (name.trim() && code.trim()) {
      setSnippets([{ name, code }, ...snippets])
      setName('')
      setCode('')
    }
  }

  return (
    <div className="min-h-svh bg-[#18181b] text-white flex flex-col items-center py-10">
      <h1 className="text-4xl font-bold mb-4">Room Demo123</h1>
      <div className="w-full max-w-2xl bg-[#23272f] rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Share a Code Snippet</h2>
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-[#18181b] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
          placeholder="Snippet Name (e.g. Bubble Sort in Python)"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        {/* <CodeEditor
          value={code}
          language="python"
          placeholder="Paste or write your code here..."
          onChange={evn => setCode(evn.target.value)}
          padding={16}
          style={{
            fontSize: 16,
            backgroundColor: '#18181b',
            color: 'white',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            minHeight: 120,
          }}
          className="mb-4"
        />  */}
        <Button className="w-full bg-[#6366f1] hover:bg-[#6366f1]/90 text-white" onClick={handleSave}>
          Save Snippet
        </Button>
      </div>
      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-3">Saved Snippets</h2>
        {snippets.length === 0 && (
          <div className="text-gray-400 mb-4">No code snippets saved yet.</div>
        )}
        <div className="space-y-4">
          {snippets.map((snip, idx) => (
            <div key={idx} className="bg-[#23272f] rounded-lg p-4 border border-[#6366f1]/20">
              <div className="font-semibold text-[#6366f1] mb-2">{snip.name}</div>
              {/* <CodeEditor
                value={snip.code}
                language="python"
                readOnly
                padding={12}
                style={{
                  fontSize: 15,
                  backgroundColor: '#18181b',
                  color: 'white',
                  borderRadius: '0.5rem',
                  minHeight: 80,
                }}
              /> */}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Room 
