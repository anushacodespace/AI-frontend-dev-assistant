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

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

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

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, type, language }),
      });

      const data = await response.json();
      setResults((prev) => ({ ...prev, [type]: data.result }));
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

      const data = await response.json();
      const assistantMessage = { role: "assistant", content: data.result };
      setChatMessages([...updatedMessages, assistantMessage]);
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
        {/* LEFT SIDE */}
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

        {/* RIGHT SIDE */}
        <div className="ai-panel">
          {/* Tabs */}
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

          {/* CHAT TAB */}
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
                    <div className="loader-row">
                      <ClipLoader size={14} color="#3b82f6" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="chat-input-row">
                <textarea
                  className="chat-input"
                  placeholder="Ask about your code... (Enter to send)"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                />
                <button
                  className="chat-send-btn"
                  onClick={sendChat}
                  disabled={!chatInput.trim() || chatLoading}
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            /* ANALYSIS TABS */
            <div className="tab-content">
              <div className="ai-panel-header">
                {results[activeTab] && (
                  <button className="copy-btn" onClick={handleCopy}>
                    {copied ? "✅ Copied!" : "📋 Copy"}
                  </button>
                )}
              </div>

              {loadingTab === activeTab && (
                <div className="loader-row">
                  <ClipLoader size={18} color="#3b82f6" />
                  <span>Analyzing your code...</span>
                </div>
              )}

              {loadingTab !== activeTab && results[activeTab] && (
                <ReactMarkdown>{results[activeTab]}</ReactMarkdown>
              )}

              {loadingTab !== activeTab && !results[activeTab] && (
                <p className="empty-msg">
                  ✨ Click a button to analyze your code.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}