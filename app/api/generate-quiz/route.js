import { generateQuiz } from "@/actions/interview";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      // request has no valid JSON body
    }

    let industry = body?.industry;
    let skills = body?.skills;

    // Fallback if industry is invalid
    if (
      !industry ||
      typeof industry !== "string" ||
      industry.length < 2 ||
      !/^[a-zA-Z\s]+$/.test(industry)
    ) {
      industry = "Google Software Development Engineer (SDE)";
    }

    // Fallback if skills is not an array
    if (!Array.isArray(skills)) {
      skills = [];
    }

    const quiz = await generateQuiz({ industry, skills });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
