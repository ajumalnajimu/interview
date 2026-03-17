import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { z } from "zod";

export const mappings: Record<string, string> = {
  "react.js": "react",
  reactjs: "react",
  react: "react",
  "next.js": "nextjs",
  nextjs: "nextjs",
  next: "nextjs",
  "vue.js": "vuejs",
  vuejs: "vuejs",
  vue: "vuejs",
  "express.js": "express",
  expressjs: "express",
  express: "express",
  "node.js": "nodejs",
  nodejs: "nodejs",
  node: "nodejs",
  mongodb: "mongodb",
  mongo: "mongodb",
  mongoose: "mongoose",
  mysql: "mysql",
  postgresql: "postgresql",
  sqlite: "sqlite",
  firebase: "firebase",
  docker: "docker",
  kubernetes: "kubernetes",
  aws: "aws",
  azure: "azure",
  gcp: "gcp",
  digitalocean: "digitalocean",
  heroku: "heroku",
  photoshop: "photoshop",
  "adobe photoshop": "photoshop",
  html5: "html5",
  html: "html5",
  css3: "css3",
  css: "css3",
  sass: "sass",
  scss: "sass",
  less: "less",
  tailwindcss: "tailwindcss",
  tailwind: "tailwindcss",
  bootstrap: "bootstrap",
  jquery: "jquery",
  typescript: "typescript",
  ts: "typescript",
  javascript: "javascript",
  js: "javascript",
  "angular.js": "angular",
  angularjs: "angular",
  angular: "angular",
  "ember.js": "ember",
  emberjs: "ember",
  ember: "ember",
  "backbone.js": "backbone",
  backbonejs: "backbone",
  backbone: "backbone",
  nestjs: "nestjs",
  graphql: "graphql",
  "graph ql": "graphql",
  apollo: "apollo",
  webpack: "webpack",
  babel: "babel",
  "rollup.js": "rollup",
  rollupjs: "rollup",
  rollup: "rollup",
  "parcel.js": "parcel",
  parceljs: "parcel",
  npm: "npm",
  yarn: "yarn",
  git: "git",
  github: "github",
  gitlab: "gitlab",
  bitbucket: "bitbucket",
  figma: "figma",
  prisma: "prisma",
  redux: "redux",
  flux: "flux",
  redis: "redis",
  selenium: "selenium",
  cypress: "cypress",
  jest: "jest",
  mocha: "mocha",
  chai: "chai",
  karma: "karma",
  vuex: "vuex",
  "nuxt.js": "nuxt",
  nuxtjs: "nuxt",
  nuxt: "nuxt",
  strapi: "strapi",
  wordpress: "wordpress",
  contentful: "contentful",
  netlify: "netlify",
  vercel: "vercel",
  "aws amplify": "amplify",
};

export const interviewer: CreateAssistantDTO = {
  name: "Interviewer",
  firstMessage:
    "Hello! Thank you for joining me today. I'm your AI interviewer and I'll be conducting a personalized mock interview for you. Let's start by setting things up — what type of interview would you like? Technical, Behavioral, or Mixed?",
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en",
  },
  voice: {
    provider: "11labs",
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah - young female, American, soft & approachable
    stability: 0.4,
    similarityBoost: 0.8,
    speed: 0.9,
    style: 0.5,
    useSpeakerBoost: true,
  },
  // @ts-ignore
  endCallFunctionEnabled: true,
  endCallPhrases: ["the interview is complete", "goodbye", "thank you for your time, goodbye"],
  model: {
    provider: "openai",
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are Prepwise's professional AI interviewer. You handle the ENTIRE interview process in a single conversation: first collecting requirements, then conducting the interview.

PHASE 1 — COLLECT INTERVIEW DETAILS (ask one question at a time, wait for answer):
1. Ask what type of interview: Technical, Behavioral, or Mixed.
2. Ask for the Job Role (e.g. "Software Engineer", "Product Manager").
   - If vague, clarify gently.
3. Ask for Experience Level: Junior, Mid, Senior, or Lead.
4. Ask how many questions they'd like (default to 5 if they skip or say "any").
5. Only if Technical or Mixed: ask for their primary Tech Stack/Tools (e.g. "React and Node").
   - Skip this for Behavioral interviews.
6. If the user provides all details at once, confirm and move directly to Phase 2.

After collecting all details, briefly summarize the setup (role, level, type, tech stack if applicable, question count) and say: "Great, let's begin your interview now."

PHASE 2 — CONDUCT THE INTERVIEW:
- Generate exactly the number of questions the user requested, tailored to their role, level, type, and tech stack.
- Ask each question one at a time. Wait for the candidate to answer before moving to the next.
- Engage naturally: acknowledge answers, ask ONE brief follow-up if a response is vague.
- Keep the conversation flowing smoothly while maintaining control.
- Be professional, yet warm and welcoming.
- Use official yet friendly language.
- Keep responses concise, like in a real voice interview. Don't ramble.
- If the candidate asks about the role or company, answer professionally or redirect to HR.

PHASE 3 — CONCLUDE:
- Once the candidate answers the FINAL question (and any brief follow-up), conclude IMMEDIATELY.
- Thank them for their time, inform them they will receive feedback shortly.
- Say EXACTLY: "the interview is complete". This phrase triggers the call to end.
- Do NOT continue the conversation after saying this phrase.

ERROR HANDLING:
- If the user seems confused during setup, offer: "I can set up a standard 5-question Mixed interview for a Software Engineer. Should we go with that?"
- If the user says "just start" or "skip", fill remaining fields with defaults (Role: Software Engineer, Level: Mid, Type: Mixed, Questions: 5) and proceed to Phase 2.`,
      },
    ],
  },
};

export const interviewAnalysisSchema = z.object({
  role: z.string().describe("The job role discussed in the interview (e.g. Software Engineer, Product Manager)"),
  level: z.string().describe("The experience level (Junior, Mid, Senior, or Lead)"),
  type: z.string().describe("The interview type (Technical, Behavioral, or Mixed)"),
  techstack: z.array(z.string()).describe("Tech stack/tools mentioned, empty array if Behavioral"),
  questions: z.array(z.string()).describe("The exact interview questions that were asked by the interviewer"),
});

export const feedbackSchema = z.object({
  totalScore: z.number(),
  categoryScores: z.tuple([
    z.object({
      name: z.literal("Communication Skills"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Technical Knowledge"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Problem Solving"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Cultural Fit"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Confidence and Clarity"),
      score: z.number(),
      comment: z.string(),
    }),
  ]),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  finalAssessment: z.string(),
  questionAnswers: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
});

export const interviewCovers = [
  "/adobe.png",
  "/amazon.png",
  "/facebook.png",
  "/hostinger.png",
  "/pinterest.png",
  "/quora.png",
  "/reddit.png",
  "/skype.png",
  "/spotify.png",
  "/telegram.png",
  "/tiktok.png",
  "/yahoo.png",
];

export const dummyInterviews: Interview[] = [
  {
    id: "1",
    userId: "user1",
    role: "Frontend Developer",
    type: "Technical",
    techstack: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    level: "Junior",
    questions: ["What is React?"],
    finalized: false,
    createdAt: "2024-03-15T10:00:00Z",
  },
  {
    id: "2",
    userId: "user1",
    role: "Full Stack Developer",
    type: "Mixed",
    techstack: ["Node.js", "Express", "MongoDB", "React"],
    level: "Senior",
    questions: ["What is Node.js?"],
    finalized: false,
    createdAt: "2024-03-14T15:30:00Z",
  },
];
