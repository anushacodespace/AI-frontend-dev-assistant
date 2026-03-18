"use client";

import { useState } from "react";
import CodeEditor from "./components/CodeEditor";
import ReactMarkdown from "react-markdown";
import { ClipLoader } from "react-spinners";

const languages = [
  { label: "JS", value: "javascript" },
  { label: "TS", value: "typescript" },
  { label: "PY", value: "python" },
  { label: "PHP", value: "php" },
  { label: "CSS", value: "css" },
  { label: "HTML", value: "html" },
  { label: "Java", value: "java" },
  { label: "C++", value: "cpp" },
  { label: "SQL", value: "sql" },
];

const TABS = [
  { label: "🤖 Explain", type: "explain" },
  { label: "🔍 Bugs", type: "bugs" },
  { label: "⚡ Improve", type: "improve" },
  { label: "🎤 Interview", type: "interview" },
  { label: "💬 Chat", type: "chat" },
];

export default function Home() {
  const [code, setCode] = useState("");
  const [results, setResults] = useState({
    explain: "",
    bugs: "",
    improve: "",
    interview: "",
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("explain");
  const [loadingTab, setLoadingTab] = useState("");
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState("javascript");

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // 🔥 FIXED STREAMING
  const runAI = async (type) => {
    if (!code.trim()) {
      setResults((prev) => ({
        ...prev,
        [type]: "⚠️ Editor is empty. Please write some code first.",
      }));
      setActiveTab(type);
      return;
    }

    setLoading(true);
    setLoadingTab(type);
    setActiveTab(type);

    // reset output
    setResults((prev) => ({
      ...prev,
      [type]: "",
    }));

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, type, language }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let done = false;
      let fullText = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        const chunk = decoder.decode(value);
        if (!chunk) continue;

        fullText += chunk;

        setResults((prev) => {
          const updated = {
            ...prev,
            [type]: fullText,
          };
          return { ...updated };
        });

        // 🔥 force UI update
        await new Promise((r) => setTimeout(r, 0));
      }
    } catch {
      setResults((prev) => ({
        ...prev,
        [type]: "❌ Error connecting to AI server.",
      }));
    }

    setLoading(false);
    setLoadingTab("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(results[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setCode("");
    setResults({ explain: "", bugs: "", improve: "", interview: "" });
    setChatMessages([]);
    setChatInput("");
    setActiveTab("explain");
    setLoadingTab("");
  };

  // 🔥 FIXED CHAT STREAMING
  const sendChat = async () => {
    if (!chatInput.trim()) return;

    const systemMessage = {
      role: "system",
      content: `You are an expert coding assistant. The user is working with ${language} code.${
        code ? ` Here is their current code:\n\n${code}` : ""
      } Help them with any questions about their code.`,
    };

    const userMessage = { role: "user", content: chatInput };
    const updatedMessages = [...chatMessages, userMessage];

    setChatMessages(updatedMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          messages: [systemMessage, ...updatedMessages],
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let done = false;
      let fullText = "";

      // add empty assistant message
      setChatMessages([
        ...updatedMessages,
        { role: "assistant", content: "" },
      ]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        const chunk = decoder.decode(value);
        if (!chunk) continue;

        fullText += chunk;

        setChatMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: fullText,
          };
          return [...updated];
        });

        // 🔥 force UI update
        await new Promise((r) => setTimeout(r, 0));
      }
    } catch {
      setChatMessages([
        ...updatedMessages,
        { role: "assistant", content: "❌ Error connecting to AI server." },
      ]);
    }

    setChatLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  return (
    <div className="App">
      <h1>AI Frontend Developer Assistant</h1>

      <div className="main-container">
        <div className="editor-panel">
          <div className="language-selector">
            {languages.map((lang) => (
              <button
                key={lang.value}
                className={`lang-btn ${
                  language === lang.value ? "lang-active" : ""
                }`}
                onClick={() => setLanguage(lang.value)}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <div className="editor-wrapper">
            <CodeEditor code={code} setCode={setCode} language={language} />
          </div>

          <div className="buttons">
            {TABS.filter((t) => t.type !== "chat").map(({ label, type }) => (
              <button
                key={type}
                disabled={!code.trim()}
                className={loadingTab === type ? "active-btn" : ""}
                onClick={() => runAI(type)}
              >
                {loadingTab === type ? (
                  <ClipLoader size={12} color="#fff" />
                ) : null}{" "}
                {label}
              </button>
            ))}
            <button
              className="clear-btn"
              disabled={!code.trim()}
              onClick={handleClear}
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        <div className="ai-panel">
          <div className="tabs">
            {TABS.map(({ label, type }) => (
              <button
                key={type}
                className={`tab-btn ${activeTab === type ? "tab-active" : ""}`}
                onClick={() => setActiveTab(type)}
              >
                {label}
                {results[type] && <span className="tab-dot" />}
              </button>
            ))}
          </div>

          {activeTab === "chat" ? (
            <div className="chat-container">
              <div className="chat-messages">
                {chatMessages.length === 0 && (
                  <p className="empty-msg">
                    💬 Ask anything about your code...
                  </p>
                )}
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`chat-bubble ${
                      msg.role === "user" ? "chat-user" : "chat-ai"
                    }`}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ))}
                {chatLoading && (
                  <div className="chat-bubble chat-ai">
                    <ClipLoader size={14} color="#3b82f6" />
                  </div>
                )}
              </div>

              <div className="chat-input-row">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button onClick={sendChat}>Send</button>
              </div>
            </div>
          ) : (
            <div className="tab-content">
              {results[activeTab] && (
                <button onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
              <ReactMarkdown>{results[activeTab]}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}