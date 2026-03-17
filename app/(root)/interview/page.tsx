import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

export default async function InterviewPage() {
  const user = await getCurrentUser();

  return (
    <>
      <h3>AI Mock Interview</h3>

      <Agent userName={user?.name!} userId={user?.id} />
    </>
  );
}
