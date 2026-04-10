import { useState } from "react";
import { askHerbQuestion } from "../services/api";

export default function HerbQA({ herbName }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const res = await askHerbQuestion(herbName, question);
      setAnswer(res.answer);
    } catch (err) {
      setAnswer("Unable to get answer. Please try again.");
    }
    setLoading(false);
  };

  if (!herbName) return null;

  return (
    <div className="herb-qa-section">
      <h3>Ask about {herbName.replace(/_/g, " ")}</h3>
      <div className="qa-input">
        <input
          type="text"
          placeholder="e.g., What are the medicinal uses?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAsk()}
        />
        <button onClick={handleAsk} disabled={loading || !question.trim()}>
          {loading ? "Asking..." : "Ask"}
        </button>
      </div>
      {answer && (
        <div className="qa-answer">
          <h4>Answer:</h4>
          <div>{answer.split("\n").map((line, i) => <p key={i}>{line}</p>)}</div>
        </div>
      )}
    </div>
  );
}
