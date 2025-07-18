"use client";

import React, { useEffect, useState } from "react";
import { saveQuizResult } from "@/actions/interview";

const QuizResults = ({ questions, answers }) => {
  const [saving, setSaving] = useState(true);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const correct = questions.reduce((acc, q, i) => {
      return acc + (answers[i] === q.answer ? 1 : 0);
    }, 0);
    setScore(correct);

    const persistResult = async () => {
      try {
        await saveQuizResult(questions, answers, correct);
      } catch (error) {
        console.error("Failed to save quiz result:", error.message);
      } finally {
        setSaving(false);
      }
    };

    persistResult();
  }, [questions, answers]);

  if (!questions || !answers || questions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600">
        No quiz data available. Please complete a quiz first.
      </div>
    );
  }

  if (saving) {
    return (
      <div className="p-4 text-center text-gray-600">Saving results...</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-6">
        Quiz Results: {score}/{questions.length}
      </h2>

      <div className="space-y-8">
        {questions.map((q, i) => {
          const isCorrect = answers[i] === q.answer;

          return (
            <div
              key={i}
              className={`rounded-xl border p-5 ${
                isCorrect ? "border-green-400" : "border-red-400"
              }`}
            >
              <h3 className="font-semibold mb-2">
                Q{i + 1}. {q.question}
              </h3>

              <p className="mb-1">
                <strong>Your Answer:</strong>{" "}
                <span
                  className={
                    isCorrect
                      ? "text-green-600"
                      : "text-red-600 font-medium"
                  }
                >
                  {answers[i] || "No Answer"}
                </span>
              </p>

              {!isCorrect && (
                <p className="mb-1">
                  <strong>Correct Answer:</strong>{" "}
                  <span className="text-green-700">{q.answer}</span>
                </p>
              )}

              {q.explanation && (
                <p className="mt-2 text-sm text-gray-600">
                  <strong>Explanation:</strong> {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizResults;
