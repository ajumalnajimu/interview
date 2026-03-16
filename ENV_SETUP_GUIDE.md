# 🔐 Prepwise — Environment Variables Setup Guide

This guide walks you through collecting **every API key and credential** needed for your `.env.local` file.

---

## Quick Checklist

| Service              | Variables Count | Free Tier? | Time Estimate |
|----------------------|:--------------:|:----------:|:-------------:|
| Firebase (Client)    | 6              | ✅ Yes     | ~10 min       |
| Firebase (Admin SDK) | 3              | ✅ Yes     | ~5 min        |
| Vapi AI              | 2              | ✅ Trial   | ~5 min        |
| Google Gemini        | 1              | ✅ Yes     | ~3 min        |
| App URL              | 1              | N/A        | ~1 min        |

---

## 1️⃣ Firebase — Client Config (6 variables)

These power authentication and Firestore in the browser.

### Steps:

1. Go to the **[Firebase Console](https://console.firebase.google.com/)**
2. Click **"Create a project"** (or select an existing one)
   - Project name: `prepwise` (or any name you like)
   - Disable Google Analytics (optional, not needed)
   - Click **Create Project**
3. Once created, click the **Web icon** (`</>`) on the project overview page to register a web app
   - App nickname: `prepwise-web`
   - ❌ Skip Firebase Hosting for now
   - Click **Register app**
4. You'll see a code snippet with `firebaseConfig`. Copy these values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...............
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=prepwise-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=prepwise-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=prepwise-xxxxx.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

> [!TIP]
> You can always find these later at:
> **Project Settings** (⚙️ gear icon) → **General** → scroll down to **Your apps** → **SDK setup and configuration**

### Enable Authentication:

5. In the Firebase Console sidebar, go to **Build → Authentication**
6. Click **Get Started**
7. Enable these sign-in providers:
   - **Email/Password** — Toggle on → Save
   - **Google** — Toggle on → Select your support email → Save

### Enable Firestore:

8. In the sidebar, go to **Build → Firestore Database**
9. Click **Create database**
   - Select location closest to you (e.g., `asia-south1` for India)
   - Start in **test mode** (for development)
   - Click **Create**

---

## 2️⃣ Firebase — Admin SDK (3 variables)

These are used server-side (Next.js server actions) for secure Firestore operations.

### Steps:

1. In the [Firebase Console](https://console.firebase.google.com/), go to **Project Settings** (⚙️ gear icon)
2. Click the **Service accounts** tab
3. Click **"Generate new private key"** → Confirm
4. A JSON file will download. Open it and extract these values:

```
FIREBASE_PROJECT_ID=prepwise-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@prepwise-xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...(long key)...\n-----END PRIVATE KEY-----\n"
```

> [!CAUTION]
> **Never commit this JSON file or these keys to Git!** The private key grants full admin access to your Firebase project. Keep it safe and only in `.env.local`.

> [!IMPORTANT]
> The `FIREBASE_PRIVATE_KEY` must be wrapped in **double quotes** in your `.env.local` file. The `\n` characters represent actual newlines in the key — keep them as-is within the quotes.

---

## 3️⃣ Vapi AI (2 variables)

Vapi powers the real-time voice interview agent (WebRTC, speech-to-text, text-to-speech).

### Steps:

1. Go to **[https://vapi.ai](https://vapi.ai)** and click **"Get Started"** / **Sign Up**
2. Create an account (Google sign-in or email)
3. Once logged in, you'll land on the **Dashboard**

### Get the API Key (server-side):

4. Go to **Dashboard → Organization Settings** (or look for **API Keys** in the sidebar)
5. Copy your **Private API Key**:

```
VAPI_API_KEY=vapi-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Get the Web Token (client-side):

6. In the same API Keys / Organization section, find the **Public Key** (also called Web Token)
7. Copy it:

```
NEXT_PUBLIC_VAPI_WEB_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

> [!NOTE]
> Vapi offers a **free trial** with limited minutes. For development and testing, this is more than enough. You can upgrade later if needed.

---

## 4️⃣ Google Gemini API (1 variable)

Gemini generates interview questions and analyzes transcripts for feedback.

### Steps:

1. Go to **[Google AI Studio](https://aistudio.google.com/)**
2. Sign in with your Google account
3. Click **"Get API Key"** in the top-left or sidebar
4. Click **"Create API key"**
   - Select an existing Google Cloud project, or let it create one for you
5. Copy the generated API key:

```
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...............
```

> [!TIP]
> The free tier of Gemini API is generous for development — 60 requests/minute for Gemini 1.5 Flash. No billing setup required for basic usage.

---

## 5️⃣ App URL (1 variable)

This is the base URL of your application. For local development:

```
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> When deploying to Vercel, change this to your production URL (e.g., `https://prepwise.vercel.app`).

---

## ✅ Final `.env.local` Template

Create a file called `.env.local` in the **project root** (`prepwise/`) and fill in all values:

```env
# Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"

# Vapi AI
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_web_token
VAPI_API_KEY=your_vapi_api_key

# Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# App URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 🔒 Security Reminders

1. **`.env.local` is already in `.gitignore`** — it will NOT be committed to Git ✅
2. Variables starting with `NEXT_PUBLIC_` are exposed to the browser — this is expected for Firebase client config and Vapi web token
3. Variables **without** `NEXT_PUBLIC_` are server-only — they stay secret
4. **Never share** your `FIREBASE_PRIVATE_KEY` or `VAPI_API_KEY` publicly

---

## 🚀 After Setup

Once all variables are filled in, start the dev server:

```bash
npm run dev
```

Visit **http://localhost:3000** — your app should be up and running!
