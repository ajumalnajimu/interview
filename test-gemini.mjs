import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: "AIzaSyCysqSNSg3O1MI3dVcuJuz_QydP4L-z9Ew",
});

async function test() {
  try {
    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: "Say hello in one word",
    });
    console.log("SUCCESS:", text);
  } catch (e) {
    console.error("ERROR:", e.message);
  }
}

test();
