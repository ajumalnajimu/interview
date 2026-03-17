import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/lib/firebase-admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();

    // LOG EVERY SINGLE WEBHOOK PAYLOAD TO FIREBASE FOR DEBUGGING
    try {
      await db.collection("webhook_logs").add({
        timestamp: new Date().toISOString(),
        rawBody: JSON.stringify(rawBody).substring(0, 10000), // Limit size
      });
    } catch (logError) {
      console.error("Failed to log webhook:", logError);
    }

    const message = rawBody.message;

    // Only process end-of-call-report events; ignore everything else
    if (message?.type && message.type !== "end-of-call-report") {
      return Response.json({ success: true }, { status: 200 });
    }

    console.log("--- VAPI WEBHOOK PROCESSING ---");

    // Try multiple extraction strategies
    let role, level, type, techstack, amount, userid;

    // Strategy 1: From message.call.analysis.structuredData (nested or flat)
    if (message?.call?.analysis?.structuredData) {
      let structuredData = message.call.analysis.structuredData;
      const keys = Object.keys(structuredData);
      if (keys.length === 1 && typeof structuredData[keys[0]] === "object" && structuredData[keys[0]] !== null && !Array.isArray(structuredData[keys[0]])) {
        structuredData = structuredData[keys[0]];
      }
      role = structuredData.role;
      level = structuredData.level;
      type = structuredData.type;
      techstack = structuredData.techstack;
      amount = structuredData.amount;
    }

    // Strategy 2: From message.call.variableValues
    if (message?.call?.variableValues) {
      userid = message.call.variableValues.userid;
    }

    // Strategy 3: From rawBody directly (no message wrapper)
    if (!role && rawBody.role) {
      role = rawBody.role;
      level = rawBody.level;
      type = rawBody.type;
      techstack = rawBody.techstack;
      amount = rawBody.amount;
    }
    if (!userid && rawBody.userid) {
      userid = rawBody.userid;
    }

    // Strategy 4: From message directly (different wrapper)
    if (!role && message?.role) {
      role = message.role;
      level = message.level;
      type = message.type === "end-of-call-report" ? "mixed" : message.type;
      techstack = message.techstack;
      amount = message.amount;
    }

    // Strategy 5: Extract from the transcript/summary if structured data failed
    if (!role && message?.call?.analysis?.summary) {
      const summary = message.call.analysis.summary.toLowerCase();
      // Try to extract role from summary
      const roleMatch = summary.match(/(?:role|position|job)(?:\s*:\s*|\s+is\s+|\s+as\s+(?:a\s+)?)([\w\s]+?)(?:\.|,|\n|$)/i);
      if (roleMatch) role = roleMatch[1].trim();
    }

    console.log("Extracted Data:", { type, role, level, techstack, amount, userid });

    // Use sensible defaults for missing fields
    role = role || "Software Engineer";
    level = level || "junior";
    type = (type && type !== "end-of-call-report") ? type : "mixed";
    techstack = techstack || "General";
    amount = amount || 5;

    // userid is still required - but use a fallback from the call metadata
    if (!userid) {
      userid = message?.call?.customer?.number || 
               message?.call?.assistantId || 
               "unknown_user";
      console.warn("No userid found, using fallback:", userid);
    }

    // Generate questions - with fallback
    let questionsText = "";
    try {
      const response = await generateText({
        model: google("gemini-2.0-flash"),
        prompt: `Prepare questions for a job interview.
          The job role is ${role}.
          The job experience level is ${level}.
          The tech stack used in the job is: ${techstack}.
          The focus between behavioural and technical questions should lean towards: ${type}.
          The amount of questions required is: ${amount}.
          Please return only the questions, without any additional text.
          The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
          Return the questions formatted like this:
          ["Question 1", "Question 2", "Question 3"]
      `,
      });
      questionsText = response.text;
    } catch (apiError: any) {
      console.error("Gemini API failed. Using fallback questions:", apiError.message);
      questionsText = JSON.stringify([
        `Can you tell me about your background and experience as a ${level} ${role}?`,
        `What is the most challenging project you have worked on using ${techstack}?`,
        "How do you handle disagreements with team members or stakeholders?",
        "Can you describe a time when you had to learn a new technology quickly?",
        "What are your greatest strengths and weaknesses?"
      ]);
    }

    console.log("Generated Questions:", questionsText);

    // Parse questions safely
    let parsedQuestions;
    try {
      const cleaned = questionsText.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
      parsedQuestions = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse questions JSON, using raw split. Raw:", questionsText);
      parsedQuestions = questionsText
        .split("\n")
        .map((q) => q.replace(/^[\d\-\.\)]+\s*/, "").trim())
        .filter((q) => q.length > 0);
    }

    const interview = {
      role: role,
      type: type,
      level: level,
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
