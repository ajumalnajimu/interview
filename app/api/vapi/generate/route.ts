import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/lib/firebase-admin";
import { getRandomInterviewCover } from "@/lib/utils";

// Helper: retry a function with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, initialDelay = 35000): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("retry");
      if (attempt < maxRetries && isRateLimit) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Rate limited, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const message = rawBody.message;

    // Only process end-of-call-report events; ignore everything else
    if (message?.type !== "end-of-call-report") {
      // Acknowledge all other Vapi Server URL events with 200 to prevent errors
      return Response.json({ success: true }, { status: 200 });
    }

    console.log("--- VAPI END-OF-CALL-REPORT RECEIVED ---");

    let structuredData = message.call?.analysis?.structuredData || {};

    // If Vapi nested the output under a schema name (e.g. "interview_setup_data")
    const keys = Object.keys(structuredData);
    if (keys.length === 1 && typeof structuredData[keys[0]] === "object" && structuredData[keys[0]] !== null && !Array.isArray(structuredData[keys[0]])) {
      structuredData = structuredData[keys[0]];
    }

    const payload = {
      ...structuredData,
      userid: message.call?.variableValues?.userid,
    };

    const { type, role, level, techstack, amount, userid } = payload;
    console.log("Extracted Data:", { type, role, level, techstack, amount, userid });

    if (!role || !userid) {
      console.error("Missing required fields: role or userid. Full structuredData:", JSON.stringify(structuredData));
      return Response.json({ success: false, error: "Missing data" }, { status: 400 });
    }

    let questionsText = "";
    try {
      // Generate questions with retry logic for rate limiting
      const response = await withRetry(() =>
        generateText({
          model: google("gemini-2.0-flash"),
          prompt: `Prepare questions for a job interview.
            The job role is ${role}.
            The job experience level is ${level}.
            The tech stack used in the job is: ${techstack}.
            The focus between behavioural and technical questions should lean towards: ${type}.
            The amount of questions required is: ${amount || 5}.
            Please return only the questions, without any additional text.
            The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
            Return the questions formatted like this:
            ["Question 1", "Question 2", "Question 3"]
        `,
        })
      );
      questionsText = response.text;
    } catch (apiError: any) {
      console.error("Gemini API failed or rate-limited. Using fallback questions:", apiError.message);
      questionsText = JSON.stringify([
        `Can you tell me about your background and experience as a ${level} ${role}?`,
        `What is the most challenging project you have worked on using ${techstack}?`,
        "How do you handle disagreements with team members or stakeholders?",
        "Can you describe a time when you had to learn a new technology quickly?",
        "What are your greatest strengths and weaknesses?"
      ]);
    }

    console.log("Generated Questions:", questionsText);

    // Parse questions safely - handle markdown code blocks
    let parsedQuestions;
    try {
      // Strip markdown code fences if present (e.g. ```json\n[...]\n```)
      const cleaned = questionsText.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
      parsedQuestions = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse questions JSON, using raw split. Raw:", questionsText);
      // Fallback: split by newline and clean up
      parsedQuestions = questionsText
        .split("\n")
        .map((q) => q.replace(/^[\d\-\.\)]+\s*/, "").trim())
        .filter((q) => q.length > 0);
    }

    const interview = {
      role: role,
      type: type || "mixed",
      level: level || "junior",
      techstack: typeof techstack === "string" ? techstack.split(",").map((s: string) => s.trim()) : (techstack || []),
      questions: parsedQuestions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("interviews").add(interview);
    console.log("Interview saved with ID:", docRef.id);

    return Response.json({ success: true, id: docRef.id }, { status: 200 });
  } catch (error: any) {
    console.error("Error in /api/vapi/generate:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}


export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
