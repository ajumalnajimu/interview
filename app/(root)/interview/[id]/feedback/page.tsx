import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";

export default async function FeedbackPage({ params }: RouteParams) {
  const { id } = await params;
  const user = await getCurrentUser();

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  return (
    <section className="section-feedback">
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold">
          Feedback on the Interview -{" "}
          <span className="capitalize">{interview.role}</span> Interview
        </h1>
      </div>

      <div className="flex flex-row justify-center">
        <div className="flex flex-row gap-5">
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p>
              Overall Impression:{" "}
              <span className="text-primary-200 font-bold">
                {feedback?.totalScore}
              </span>{" "}
              /100
            </p>
          </div>

          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p>
              {feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr />

      <p>{feedback?.finalAssessment}</p>

      <div className="flex flex-col gap-4">
        <h2>Breakdown of the Interview:</h2>
        {feedback?.categoryScores?.map((category, index) => (
          <div key={index}>
            <p className="font-bold">
              {index + 1}. {category.name} ({category.score}/100)
            </p>
            <p>{category.comment}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h3>Strengths</h3>
        <ul>
          {feedback?.strengths?.map((strength, index) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h3>Areas for Improvement</h3>
        <ul>
          {feedback?.areasForImprovement?.map((area, index) => (
            <li key={index}>{area}</li>
          ))}
        </ul>
      </div>

      {feedback?.questionAnswers && feedback.questionAnswers.length > 0 && (
        <div className="flex flex-col gap-4 mt-4">
          <h2>Questions & Ideal Answers</h2>
          <Accordion type="single" collapsible className="w-full">
            {feedback.questionAnswers.map((qa, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-dark-300">
                <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
                  {index + 1}. {qa.question}
                </AccordionTrigger>
                <AccordionContent className="text-light-100/80 leading-relaxed bg-dark-200 p-4 rounded-md">
                  <span className="text-primary-200 font-bold mb-2 block">Ideal Talking Points:</span>
                  {qa.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      <div className="buttons mt-8">
        <Button className="btn-primary w-full max-w-sm mx-auto">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-black text-center">
              Back to dashboard
            </p>
          </Link>
        </Button>
      </div>

    </section>
  );
}
