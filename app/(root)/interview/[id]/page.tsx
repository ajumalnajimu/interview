import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";

export default async function InterviewSessionPage({
  params,
}: RouteParams) {
  const { id } = await params;
  const user = await getCurrentUser();

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  // In the single-call architecture, interviews always have feedback.
  // Redirect to the feedback page directly.
  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  if (feedback) {
    redirect(`/interview/${id}/feedback`);
  }

  // If somehow there's no feedback yet, redirect to dashboard
  redirect("/");
}
