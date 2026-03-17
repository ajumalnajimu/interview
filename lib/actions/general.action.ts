"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/lib/firebase-admin";
import { feedbackSchema, interviewAnalysisSchema } from "@/constants";
import { getRandomInterviewCover } from "@/lib/utils";

export async function createInterviewAndFeedback({
  userId,
  transcript,
}: {
  userId: string;
  transcript: { role: string; content: string }[];
}) {
  const formattedTranscript = transcript
    .map((s) => `- ${s.role}: ${s.content}\n`)
    .join("");

  // Step 1: Extract interview metadata from transcript
  let interviewMeta;
  try {
    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: interviewAnalysisSchema,
      prompt: `Analyze the following interview transcript and extract the interview setup details and the exact questions that the interviewer asked the candidate. Only include the actual interview questions, not the setup/collection questions.\n\nTranscript:\n${formattedTranscript}`,
      system: "You are an expert at analyzing interview transcripts to extract structured data.",
    });
    interviewMeta = object;
  } catch (error) {
    console.error("Error extracting interview metadata (likely rate limit):", error);
    try {
      const { object: fallbackMeta } = await generateObject({
        model: google("gemini-2.5-flash"), // using a lighter model as fallback
        schema: interviewAnalysisSchema,
        prompt: `Analyze the following interview transcript and extract the interview setup details and the exact questions that the interviewer asked the candidate. Only include the actual interview questions, not the setup/collection questions.\n\nTranscript:\n${formattedTranscript}`,
        system: "You are an expert at analyzing interview transcripts to extract structured data.",
      });
      interviewMeta = fallbackMeta;
    } catch (fallbackError) {
      console.error("Fallback metadata extraction also failed:", fallbackError);
      interviewMeta = {
        role: "Software Engineer",
        level: "Mid",
        type: "Mixed",
        techstack: [],
        questions: [],
      };
    }
  }

  // Step 2: Save interview to Firestore
  const interview = {
    role: interviewMeta.role,
    type: interviewMeta.type,
    level: interviewMeta.level,
    techstack: interviewMeta.techstack,
    questions: interviewMeta.questions,
    userId,
    finalized: true,
    coverImage: getRandomInterviewCover(),
    createdAt: new Date().toISOString(),
  };

  const interviewRef = await db.collection("interviews").add(interview);
  const interviewId = interviewRef.id;

  // Step 3: Generate feedback with Q&A
  const formattedQuestions = interviewMeta.questions.length > 0
    ? interviewMeta.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")
    : "Questions not available.";

  let feedbackData;
  try {
    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        
        The questions asked were:
        ${formattedQuestions}

        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        
        Additionally, populate the \`questionAnswers\` array. For each interview question asked, provide the exact question text and a concise "ideal answer" or "key talking points" that a strong candidate should have mentioned.
        `,
      system: "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });
    feedbackData = object;
  } catch (error) {
    console.error("Error generating feedback:", error);
    feedbackData = {
      totalScore: 70,
      categoryScores: [
        { name: "Communication Skills", score: 70, comment: "AI Feedback unavailable due to rate limits." },
        { name: "Technical Knowledge", score: 70, comment: "AI Feedback unavailable." },
        { name: "Problem Solving", score: 70, comment: "AI Feedback unavailable." },
        { name: "Cultural Fit", score: 70, comment: "AI Feedback unavailable." },
        { name: "Confidence and Clarity", score: 70, comment: "AI Feedback unavailable." },
      ],
      strengths: ["Completed the interview successfully."],
      areasForImprovement: ["AI limit reached - try again later for detailed feedback."],
      finalAssessment: "Due to temporary high traffic we could not generate a detailed assessment. Please try again later!",
      questionAnswers: interviewMeta.questions.map((q: string) => ({ question: q, answer: "Ideal answer unavailable due to AI limits." })),
    };
  }

  const feedback = {
    interviewId,
    userId,
    totalScore: feedbackData.totalScore,
    categoryScores: feedbackData.categoryScores,
    strengths: feedbackData.strengths,
    areasForImprovement: feedbackData.areasForImprovement,
    finalAssessment: feedbackData.finalAssessment,
    questionAnswers: feedbackData.questionAnswers || [],
    createdAt: new Date().toISOString(),
  };

  const feedbackRef = await db.collection("feedback").add(feedback);

  return { success: true, interviewId, feedbackId: feedbackRef.id };
}

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, questions, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const formattedQuestions = questions
      ? questions.map((q, i) => `${i + 1}. ${q}`).join("\n")
      : "Questions not provided.";

    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        
        The questions asked were:
        ${formattedQuestions}

        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        
        Additionally, populate the \`questionAnswers\` array. For each question asked, provide the exact question text and a concise "ideal answer" or "key talking points" that a strong candidate should have mentioned. 
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      questionAnswers: object.questionAnswers || [],
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving/generating feedback (likely rate limit):", error);

    // Fallback if Gemini fails so the user still reaches the feedback page
    const fallbackFeedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: 70, // Generic passing score
      categoryScores: [
        { name: "Communication Skills", score: 70, comment: "AI Feedback unavailable due to rate limits." },
        { name: "Technical Knowledge", score: 70, comment: "AI Feedback unavailable." },
        { name: "Problem Solving", score: 70, comment: "AI Feedback unavailable." },
        { name: "Cultural Fit", score: 70, comment: "AI Feedback unavailable." },
        { name: "Confidence and Clarity", score: 70, comment: "AI Feedback unavailable." },
      ],
      strengths: ["Completed the interview successfully."],
      areasForImprovement: ["Gemini AI limit reached - try again later for detailed feedback."],
      finalAssessment: "Due to temporary high traffic (Google AI Rate Limits), we could not generate a detailed personalized assessment for this session. Please check back later!",
      questionAnswers: questions ? questions.map(q => ({ question: q, answer: "Ideal answer unavailable due to AI limits." })) : [],
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;
    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(fallbackFeedback);
    return { success: true, feedbackId: feedbackRef.id };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();

  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  try {
    // Fetch finalized interviews, filtering out the current user client-side
    // to avoid Firestore composite index requirements
    const interviews = await db
      .collection("interviews")
      .where("finalized", "==", true)
      .limit(limit + 10) // Fetch slightly more to account for client-side filtering
      .get();

    return interviews.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }) as Interview)
      .filter((interview) => interview.userId !== userId)
      .slice(0, limit)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error fetching latest interviews:", error);
    return [];
  }
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  try {
    const interviews = await db
      .collection("interviews")
      .where("userId", "==", userId)
      .get();

    return interviews.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }) as Interview)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error fetching user interviews:", error);
    return [];
  }
}
