"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import getVapiInstance from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createInterviewAndFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({ userName, userId }: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const vapi = getVapiInstance();

    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role as any, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      setIsSpeaking(false);
    };

    const onError = (error: Error | any) => {
      const msg = error?.message || (typeof error === "string" ? error : "Unknown Vapi error");
      toast.error(`Vapi Call Error: ${msg}`);
      setCallStatus(CallStatus.FINISHED);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handlePostCall = async () => {
      if (callStatus !== CallStatus.FINISHED || messages.length === 0 || isProcessing) return;

      setIsProcessing(true);

      try {
        const result = await createInterviewAndFeedback({
          userId: userId!,
          transcript: messages,
        });

        if (result.success && result.interviewId) {
          router.push(`/interview/${result.interviewId}/feedback`);
        } else {
          toast.error("Something went wrong generating your feedback.");
          router.push("/");
        }
      } catch (error) {
        console.error("Error processing interview:", error);
        toast.error("Failed to generate feedback. Please try again.");
        router.push("/");
      }
    };

    handlePostCall();
  }, [messages, callStatus, isProcessing, router, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    try {
      // Check for microphone permission first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (micError) {
        toast.error("Microphone access is required. Please allow microphone permissions in your browser.");
        setCallStatus(CallStatus.FINISHED);
        return;
      }

      const vapi = getVapiInstance();

      // Single inline assistant — handles setup + interview in one call
      await vapi.start(interviewer as any);
    } catch (err: any) {
      console.error("Error starting Vapi call:", err);
      const msg = err?.message || (typeof err === "string" ? err : "Unknown error occurred");
      toast.error(`Failed to connect: ${msg}`);
      setCallStatus(CallStatus.FINISHED);
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    getVapiInstance().stop();
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center mt-6">
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4 mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="font-medium animate-pulse text-lg">Generating your feedback...</p>
          </div>
        ) : callStatus !== "ACTIVE" ? (
          <button
            className="relative btn-call"
            onClick={() => handleCall()}
            disabled={callStatus === "CONNECTING"}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
