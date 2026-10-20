# 🔥 Firebase Production Setup & Deployment Guide

This guide walks you through deploying **Spice Garden Restaurant App** to your own Firebase project.

---

## 1. Create and Configure Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/) and click **Add Project**.
2. Name your project (e.g. `spice-garden-live`).
3. Enable or disable Google Analytics as desired.
4. Go to **Authentication** > **Get Started** > **Sign-in method** tab:
   - Enable **Email/Password**.
5. Go to **Cloud Firestore** > **Create database**:
   - Choose a nearby region (e.g., `asia-south1` for India or `us-central1` for US).
   - Start in **Production mode**.
6. Go to **Project Settings** (gear icon) > **General** > **Your apps**:
   - Click the **Web** icon (`</>`) to register a web app.
   - Note the `firebaseConfig` keys.

---

## 2. Environment Variables (.env)

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=spice-garden-live.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=spice-garden-live
VITE_FIREBASE_STORAGE_BUCKET=spice-garden-live.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:000000000000
```

---

## 3. Initial Staff Account Setup

In Firebase Authentication, create the initial staff users with Email and Password:
- `admin@spicegarden.in`
- `kitchen@spicegarden.in`
- `waiter@spicegarden.in`

Next, in Cloud Firestore, create a collection named `staff` and add documents matching the user UIDs:

```json
// Collection: staff
// Document ID: <Firebase Auth UID of the Admin user>
{
  "uid": "<UID>",
  "email": "admin@spicegarden.in",
  "name": "Rajesh Kumar (General Manager)",
  "role": "admin",
  "isActive": true
}
```

Repeat for kitchen (`"role": "kitchen"`) and waiter (`"role": "waiter"`).

---

## 4. Deploying Firestore Rules & Indexes

Install the Firebase CLI and login:
```bash
npm install -g firebase-tools
firebase login
firebase use --add
```

Select your Firebase project. Then deploy rules and indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 5. Spark Plan vs Blaze Plan Considerations

- **Spark Plan (Free)**:
  - Supports 50,000 Firestore reads and 20,000 writes per day.
  - Generous enough for a restaurant handling 300–500 tables per day.
  - Firebase Hosting includes SSL and custom domain mapping at no charge.
  - **Limitation**: Cloud Functions (Node.js backend execution) are disabled on Spark.
  - **How this app handles it**: Server-side price calculation and tamper checks are handled via canonical client-side transactional validation and `firestore.rules`.

- **Blaze Plan (Pay As You Go)**:
  - If you require Cloud Functions for automated SMS / WhatsApp order confirmations or external payment gateway webhooks (e.g., Razorpay, Stripe), upgrade to the Blaze plan.
  - The first 2 million Cloud Function invocations per month are free.

---

## 6. Building and Deploying to Firebase Hosting

Run the production build:
```bash
npm run build
```

Deploy the compiled dist files to Firebase Hosting:
```bash
firebase deploy --only hosting
```

Your restaurant portal will be live at `https://<your-project-id>.web.app`!
