import fetch from "node-fetch";

async function testWebhook() {
  const url = "https://interview-oomw.vercel.app/api/vapi/generate";
  const payload = {
    message: {
      type: "end-of-call-report",
      call: {
        variableValues: {
          userid: "eP4wTfF6PihZ81HclvBXXwT7jJ03" // A valid user id format (dummy or real doesn't block insertion unless Firestore rules forbid. Oh wait, Firebase Admin ignores rules!)
        },
        analysis: {
          structuredData: {
            interview_setup_data: {
              role: "Test Engineer",
              level: "Junior",
              type: "Technical",
              techstack: "Jest, Cypress",
              amount: 2
            }
          }
        }
      }
    }
  };

  console.log("Sending payload to", url);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Response:", text);
}

testWebhook();
