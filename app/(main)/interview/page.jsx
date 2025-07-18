"use client";

import { useEffect, useState } from "react";
import { getUserAssessments } from "@/actions/interview";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader,
  BarChart3,
  CheckCircle,
  ListTodo,
  ClipboardList,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

function calculateSummaryStats(assessments) {
  const totalQuestions = assessments.reduce((sum, a) => sum + a.questions.length, 0);
  const totalCorrect = assessments.reduce(
    (sum, a) => sum + a.questions.filter((q) => q.isCorrect).length,
    0
  );
  const accuracy = totalQuestions ? (totalCorrect / totalQuestions) * 100 : 0;
  const averageScore = assessments.length
    ? assessments.reduce((sum, a) => sum + a.quizScore, 0) / assessments.length
    : 0;

  return {
    totalQuestions,
    accuracy: accuracy.toFixed(1),
    averageScore: averageScore.toFixed(1),
  };
}

const categoryColor = (category) => {
  switch (category.toLowerCase()) {
    case "technical":
      return "bg-blue-100 text-blue-700";
    case "soft skills":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function InterviewPage() {
  const [assessments, setAssessments] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getUserAssessments();
        setAssessments(res);
      } catch (err) {
        console.error("Failed to fetch assessments", err);
      }
    }
    fetchData();
  }, []);

  if (!assessments) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        <Loader className="animate-spin mr-2" /> Loading assessments...
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="text-center text-gray-500 py-16 space-y-2">
        <ClipboardList className="mx-auto h-8 w-8 mb-2" />
        <p className="text-lg font-medium">No assessments found yet.</p>
        <p className="text-sm">Take a quiz to see your progress here.</p>
      </div>
    );
  }

  const summary = calculateSummaryStats(assessments);

  const chartData = assessments.map((a) => ({
    date: new Date(a.createdAt).toLocaleDateString(),
    score: a.quizScore,
    category: a.category,
  }));

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-12">
      {/* Summary Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4 border-b pb-1">Summary Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-blue-50 hover:shadow transition">
            <CardContent className="p-5 text-center space-y-2">
              <ListTodo className="mx-auto h-6 w-6 text-blue-600" />
              <p className="text-sm text-muted-foreground">Total Questions Attempted</p>
              <p className="text-2xl font-semibold text-blue-900">{summary.totalQuestions}</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 hover:shadow transition">
            <CardContent className="p-5 text-center space-y-2">
              <CheckCircle className="mx-auto h-6 w-6 text-green-600" />
              <p className="text-sm text-muted-foreground">Accuracy Rate</p>
              <p className="text-2xl font-semibold text-green-900">{summary.accuracy}%</p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 hover:shadow transition">
            <CardContent className="p-5 text-center space-y-2">
              <BarChart3 className="mx-auto h-6 w-6 text-yellow-600" />
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-2xl font-semibold text-yellow-900">{summary.averageScore}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div>
        <h2 className="text-xl font-semibold mb-4 border-b pb-1">Performance Analytics</h2>

        <div className="space-y-10">
          <div>
            <h3 className="text-md font-semibold mb-2">Score Over Time</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-md font-semibold mb-2">Score Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Assessment History */}
      <div>
        <h2 className="text-xl font-semibold mb-4 border-b pb-1">Assessment History</h2>
        <div className="space-y-4">
          {assessments.map((a, idx) => (
            <Card
              key={idx}
              className="hover:shadow transition border-gray-200"
            >
              <CardContent className="space-y-2 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                    <h3 className="text-lg font-semibold">
                      Score: {a.quizScore}/10
                    </h3>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${categoryColor(
                        a.category
                      )}`}
                    >
                      {a.category}
                    </span>
                  </div>
                </div>
                {a.improvementTip && (
                  <div className="text-sm text-gray-700">
                    <strong>Tip:</strong> {a.improvementTip}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
