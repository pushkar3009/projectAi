"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import QuizResults from "./quiz-results";


const Quiz = () => {
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState({ user: false, quiz: false });
  const [error, setError] = useState(null);

  const fetchUserData = async () => {
    setLoading((prev) => ({ ...prev, user: true }));
    try {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("Failed to fetch user data");
      return await res.json();
    } finally {
      setLoading((prev) => ({ ...prev, user: false }));
    }
  };

  const generateNewQuiz = async () => {
    try {
      setError(null);
      setShowResults(false);
      setLoading((prev) => ({ ...prev, quiz: true }));

      let userData;
      try {
        userData = await fetchUserData();
      } catch (err) {
        console.warn("Falling back to default user data:", err.message);
        userData = {
          industry: "Google Software Development Engineer (SDE)",
          skills: [],
        };
      }

      let questions = [];

      try {
        const res = await fetch("/api/generate-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });

        const data = await res.json();

        if (res.ok && Array.isArray(data?.questions)) {
          questions = data.questions.map((q) => ({
            question: q.question,
            options: q.options,
            answer: q.correctAnswer || q.answer || q.options?.[0],
            explanation: q.explanation || "",
          }));
        } else {
          console.warn("Invalid quiz format from API. Using fallback.");
        }
      } catch (err) {
        console.warn("API fetch error. Using fallback questions.", err.message);
      }

      if (!questions.length) {
        console.warn("Using fallback DSA questions.");
        questions = [
          {
            question: "What is the time complexity of binary search?",
            options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
            answer: "O(log n)",
            explanation: "Binary search repeatedly divides the array in half, hence O(log n).",
          },
          {
            question: "Which data structure is used in BFS traversal?",
            options: ["Stack", "Queue", "Heap", "Tree"],
            answer: "Queue",
            explanation: "Breadth-First Search uses a queue to explore nodes level by level.",
          },
          {
            question: "What is the worst-case time of QuickSort?",
            options: ["O(n^2)", "O(log n)", "O(n log n)", "O(n)"],
            answer: "O(n^2)",
            explanation: "QuickSort degrades to O(n^2) when pivot picks are unbalanced.",
          },
          {
            question: "Which algorithm finds shortest path in weighted graphs?",
            options: ["DFS", "Prim's", "Kruskal's", "Dijkstra's"],
            answer: "Dijkstra's",
            explanation: "Dijkstra's algorithm efficiently finds shortest paths in weighted graphs.",
          },
          {
            question: "Which data structure uses LIFO?",
            options: ["Queue", "Stack", "Tree", "Graph"],
            answer: "Stack",
            explanation: "Stack follows Last-In-First-Out (LIFO) access pattern.",
          },
        ];
      }

      setQuizData(questions);
      setAnswers(Array(questions.length).fill(null));
      setCurrentQuestion(0);
    } catch (err) {
      console.error("Quiz error:", err);
      setError("Unexpected error during quiz generation.");
    } finally {
      setLoading((prev) => ({ ...prev, quiz: false }));
    }
  };

  const handleAnswerSelect = (answer) => {
    const updated = [...answers];
    updated[currentQuestion] = answer;
    setAnswers(updated);
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  if (loading.quiz || loading.user) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={generateNewQuiz}>Retry</Button>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="text-center p-8">
        <Button onClick={generateNewQuiz}>Start New Quiz</Button>
      </div>
    );
  }

  if (showResults) {
    return <QuizResults questions={quizData} answers={answers} />;
  }

  const currentQuiz = quizData[currentQuestion];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h3 className="text-lg font-medium mb-4">
        Question {currentQuestion + 1}/{quizData.length}
      </h3>

      <p className="mb-6">{currentQuiz.question}</p>

      <div className="space-y-2 mb-6">
        {currentQuiz.options.map((option, i) => (
          <Button
            key={i}
            variant={answers[currentQuestion] === option ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => handleAnswerSelect(option)}
          >
            {option}
          </Button>
        ))}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion((prev) => prev - 1)}
        >
          Previous
        </Button>

        <Button
          onClick={() => {
            if (currentQuestion < quizData.length - 1) {
              setCurrentQuestion((prev) => prev + 1);
            } else {
              handleSubmit();
            }
          }}
          disabled={!answers[currentQuestion]}
        >
          {currentQuestion < quizData.length - 1 ? "Next" : "Submit"}
        </Button>
      </div>
    </div>
  );
};

export default Quiz;
