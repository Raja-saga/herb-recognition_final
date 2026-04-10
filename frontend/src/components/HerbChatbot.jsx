import { useState, useEffect, useRef } from "react";

export default function HerbChatbot({ predictedHerb }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [language, setLanguage] = useState("en");

  useEffect(() => {
    if (predictedHerb) {
      setMessages([{
        role: "assistant",
        content: language === "ta"
            ? `வணக்கம்! நான் உங்கள் மூலிகை உதவியாளர். ${predictedHerb.replace(/_/g, " ")} பற்றி கேளுங்கள்!`
            : `Hi! I'm your herb assistant. Ask me anything about ${predictedHerb.replace(/_/g, " ")}!`
      }]);
    }
  }, [predictedHerb]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!predictedHerb) return null;

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          herb: predictedHerb, 
          question: input,
          language: language   // 🔥 IMPORTANT
        })
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "❌ Service unavailable. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = language === "ta"
  ? [
      "இந்த மூலிகையின் மருத்துவ பயன்பாடுகள் என்ன?",
      "இந்த மூலிகையை எப்படி தயாரிப்பது?",
      "இந்த மூலிகையின் பக்க விளைவுகள் என்ன?"
    ]
  : [
      "What are the medicinal uses of this herb?",
      "How to prepare this herb?",
      "What are the side effects of this herb?"
    ];

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div style={{ marginLeft: "auto" }}>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            style={{ padding: "5px", borderRadius: "6px" }}
          >
            <option value="en">English</option>
            <option value="ta">தமிழ்</option>
          </select>
        </div>

        <span className="chatbot-icon">🌿</span>
        <div>
          <h3>Herb Assistant</h3>
          <p className="chatbot-subtitle">{predictedHerb.replace(/_/g, " ")}</p>
        </div>
      </div>

      <div className="chat-window">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.role}`}>
            {/* <div className="bubble-content">{msg.content}</div> */}
            <div className="bubble-content">
              {(msg.content || "").split("\n").map((line, index) => (
                <p key={index} style={{ margin: "4px 0" }}>
                  {line || <br />}
                </p>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble assistant">
            <div className="bubble-content typing">●●●</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="quick-questions">
          {quickQuestions.map((q, i) => (
            <button key={i} className="quick-btn" onClick={() => { setInput(q); }}>
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-box">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={language === "ta" ? "ஏதாவது கேளுங்கள்..." : "Ask me anything..."}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? "⏳" : "➤"}
        </button>
      </div>
    </div>
  );
}
