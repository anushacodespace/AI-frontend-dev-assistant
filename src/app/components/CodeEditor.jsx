"use client";

import { Editor } from "@monaco-editor/react";

function CodeEditor({ code, setCode, language }) {
  return (
    <Editor
      height="100%"
      language={language}
      theme="vs-dark"
      value={
        code ||
`//Write or paste your code here`
      }
      onChange={(value) => setCode(value)}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        wordWrap: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true
      }}
    />
  );
}

export default CodeEditor;