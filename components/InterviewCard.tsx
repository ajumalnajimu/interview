import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getTechLogos } from "@/lib/utils";
import { getFeedbackByInterviewId } from "@/lib/actions/general.action";

export default async function InterviewCard({
  interviewId,
  userId,
  role,
  type,
  techstack,
  createdAt,
  coverImage,
}: InterviewCardProps) {
  const feedback =
    interviewId && userId
      ? await getFeedbackByInterviewId({
          interviewId,
          userId,
        })
      : null;

  const normalizedType = /mix/i.test(type) ? "Mixed" : type;

  const techLogos = await getTechLogos(techstack);

  const badgeColor =
    {
      Behavioral: "bg-light-400",
      Mixed: "bg-light-600",
      Technical: "bg-light-800",
    }[normalizedType] || "bg-light-600";

  const formattedDate = dayjs(
    createdAt || new Date()
  ).format("MMM D, YYYY");

  return (
    <div className="card-border w-[360px] max-sm:w-full min-h-96">
      <div className="card-interview">
        <div>
          {/* Type Badge */}
          <div
            className={`absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg ${badgeColor}`}
          >
            <p className="badge-text">{normalizedType}</p>
          </div>

          {/* Cover Image */}
          <Image
            src={coverImage || "/covers/adobe.png"}
            alt="cover"
            width={90}
            height={90}
            className="rounded-full object-fit size-[90px]"
          />

          {/* Title */}
          <h3 className="mt-5 capitalize">{role} Interview</h3>

          {/* Date & Score */}
          <div className="flex flex-row gap-5 mt-3">
            <div className="flex flex-row gap-2 items-center">
              <Image
                src="/calendar.svg"
                alt="calendar"
                width={22}
                height={22}
              />
              <p>{formattedDate}</p>
            </div>

            <div className="flex flex-row gap-2 items-center">
              <Image src="/star.svg" alt="score" width={22} height={22} />
              <p>{feedback?.totalScore || "---"}/100</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-row justify-between">
          {/* Tech Stack Icons */}
          <div className="flex flex-row items-center">
            {techLogos.slice(0, 3).map(({ tech, url }, index) => (
              <div
                key={tech}
                className="relative group bg-dark-300 rounded-full p-2 -ml-3 first:ml-0"
              >
                <span className="tech-tooltip">{tech}</span>
                <Image
                  src={url}
                  alt={tech}
                  width={24}
                  height={24}
                />
              </div>
            ))}
            {techLogos.length > 3 && (
              <div className="relative bg-dark-300 rounded-full p-2 -ml-3">
                <span className="text-xs text-light-100">
                  +{techLogos.length - 3}
                </span>
              </div>
            )}
          </div>

          <Button asChild className="btn-primary">
            <Link
              href={
                feedback
                  ? `/interview/${interviewId}/feedback`
                  : `#`
              }
            >
              {feedback ? "View Feedback" : "Processing..."}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
