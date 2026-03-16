import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/lib/firebase-admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    console.log("--- VAPI WEBHOOK RECEIVED ---");
    console.log(JSON.stringify(rawBody, null, 2));

    const message = rawBody.message;
    let payload = rawBody;

    // If it's a Vapi Server URL message, extract the actual data
    if (message?.type === "end-of-call-report") {
      console.log("Detected end-of-call-report");
      const structuredData = message.call?.analysis?.structuredData || {};
      payload = {
        ...structuredData,
        userid: message.call?.variableValues?.userid,
      };
    } else if (message?.type === "tool-calls") {
      console.log("Detected tool-calls");
      const toolCall = message.toolCalls?.[0];
      const args = toolCall?.function?.arguments || {};
      payload = {
        ...args,
        userid: message.call?.variableValues?.userid,
      };
    }

    const { type, role, level, techstack, amount, userid } = payload;
    console.log("Extracted Data:", { type, role, level, techstack, amount, userid });

    if (!role || !userid) {
      console.error("Missing required fields: role or userid");
      return Response.json({ success: false, error: "Missing data" }, { status: 400 });
    }

    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-lite"),
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
        
        Thank you! <3
    `,
    });

    console.log("Generated Questions:", questions);

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: typeof techstack === "string" ? techstack.split(",") : techstack,
      questions: JSON.parse(questions),
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
