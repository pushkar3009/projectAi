"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Generate quiz using Gemini
export async function generateQuiz(params) {
  try {
    const { industry = "Software Engineering", skills = [] } = params || {};

    const prompt = `
      Generate 10 technical interview questions for a ${industry} role${
      skills.length ? ` requiring ${skills.join(", ")}` : ""
    }.

      Format requirements:
      - Multiple choice with exactly 4 options
      - Mark correct answer with (Correct)
      - Include brief explanations
      - Return ONLY this JSON format:

      {
        "questions": [
          {
            "question": "What is...? ",
            "options": [
              "Option A",
              "Option B (Correct)",
              "Option C",
              "Option D"
            ],
            "explanation": "Because..."
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonString = text.replace(/```json|```/g, "").trim();
    const quiz = JSON.parse(jsonString);

    const questions = quiz.questions.map((q) => ({
      question: q.question,
      options: q.options.map((opt) => opt.replace(" (Correct)", "")),
      correctAnswer:
        q.options.find((opt) => opt.includes("(Correct)"))?.replace(" (Correct)", "") || q.options[0],
      explanation: q.explanation || "",
    }));

    return { questions };
  } catch (error) {
    console.error("Quiz generation failed:", error);
    throw new Error("Failed to generate quiz. Please try again.");
  }
}

// Save quiz results to database
export async function saveQuizResult(questions, answers, score) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    if (!Array.isArray(questions) || !Array.isArray(answers)) {
      throw new Error("Invalid input data");
    }

    const questionResults = questions.map((q, i) => ({
      question: q.question,
      answer: q.correctAnswer || q.answer || q.options?.[0] || "Unknown",
      userAnswer: answers[i] || "No answer provided",
      isCorrect: (q.correctAnswer || q.answer) === answers[i],
      explanation: q.explanation || "",
    }));

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, industry: true },
    });
    if (!user) throw new Error("User not found");

    let improvementTip = null;
    const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

    if (wrongAnswers.length > 0) {
      const prompt = `Briefly suggest improvement areas for these missed questions:\n\n${wrongAnswers
        .map((q) => `Q: ${q.question}\nA: ${q.answer}`)
        .join("\n\n")}`;

      try {
        const result = await model.generateContent(prompt);
        improvementTip = result.response.text();
      } catch (error) {
        improvementTip = "Review your incorrect answers for common patterns.";
      }
    }

    await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        improvementTip,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to save results:", error);
    throw new Error(error.message || "Failed to save quiz results");
  }
}

// Get all assessments for logged-in user
export async function getUserAssessments() {
  const { userId } =  await auth();
  if (!userId) return [];

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });

  if (!user) return [];

  const assessments = await db.assessment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return assessments;
}
