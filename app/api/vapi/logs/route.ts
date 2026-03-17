import { db } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const logs = await db
      .collection("webhook_logs")
      .orderBy("timestamp", "desc")
      .limit(5)
      .get();

    const data = logs.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return Response.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
