# 🔥 100% Free Firebase Setup Guide (Spark Plan — No Credit Card Required)

Yeh guide aapko step-by-step batati hai ki **Firebase ka 100% Free Plan (Spark Plan)** use karke website ko kaise live chalana hai bina koi credit card ya billing ke.

---

## ⚡ Free Firebase Plan Mein Kya Milta Hai? (Zero Cost)

| Service | Free Limit (Per Day) | Restaurant Ke Liye Kafi Hai? |
|---|---|---|
| **Cloud Firestore (Database)** | **50,000 Reads / Day** & **20,000 Writes / Day** | Rozana 300–500 tables ke orders ke liye easily sufficient hai |
| **Firebase Auth (Login)** | **Unlimited** Email/Password Users | Staff aur admin login ke liye bilkul free |
| **Firebase Hosting** | **10 GB Storage & Free SSL** | Fast, global CDN aur free `.web.app` domain |
| **Billing / Credit Card** | **NAHI CHAHIYE** (Spark Plan is 100% Free) | Koi payment details nahi deni hoti |

---

## 🛠️ Step 1: Firebase Project Banayein (2 Minutes)

1. [https://console.firebase.google.com/](https://console.firebase.google.com/) par jayein (Apne Google Account se login karein).
2. **"Add project"** par click karein:
   - Project Name dalein (e.g., `spice-garden-restaurant`).
   - Google Analytics ko chahein toh turn off ya on rakh sakte hain.
   - **"Create project"** par click karein.

---

## 🔑 Step 2: Authentication Enable Karein

1. Left sidebar mein **Build** > **Authentication** par click karein.
2. **"Get Started"** dabayein.
3. **"Sign-in method"** tab mein jakar **Email/Password** select karein aur toggle ko **Enable** karke **Save** karein.

---

## 🗄️ Step 3: Cloud Firestore Database Banayein

1. Left sidebar mein **Build** > **Firestore Database** par click karein.
2. **"Create database"** dabayein.
3. Database location select karein (India ke liye `asia-south1` Mumbai best hai).
4. Rules prompt par **"Start in production mode"** select karke **Create** dabayein.

---

## 📋 Step 4: Web App Config Keys Copy Karein

1. Left sidebar mein **Project Settings** (gear icon ⚙️) par click karein.
2. Niche scroll karein aur **"Your apps"** section mein Web icon (`</>`) par click karein.
3. App nickname dalein (e.g., `Restaurant Web`) aur **Register app** dabayein.
4. Screen par jo `firebaseConfig` aayegi, usme se values copy karein.

---

## ⚙️ Step 5: Apni `.env` File Banayein

Project root directory (`restaurant-app`) mein ek nayi file banayein jiska naam ho `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSyA...Aapki-API-Key
VITE_FIREBASE_AUTH_DOMAIN=spice-garden-restaurant.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=spice-garden-restaurant
VITE_FIREBASE_STORAGE_BUCKET=spice-garden-restaurant.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

---

## 🚀 Step 6: Database Ko 1-Click Se Populate / Seed Karein

Jab aap `.env` file save karke `npm run dev` chalaenge:

1. Staff login par jayein: `http://localhost:5173/staff/login`
2. **Admin button** par click karein (ya email `admin@spicegarden.in` aur password `password123` dalein).
3. Left menu se **Store Settings** par jayein.
4. Niche **"⚡ Populate / Reset Free Firebase Data"** button par click karein.
5. **Ek hi click mein** aapka Cloud Firestore automatically bhar jayega:
   - 7 Categories
   - 23 Starter, Soup, Main, Bread, Biryani, Dessert aur Beverage items
   - 8 Tables with QR Codes
   - Staff accounts

---

## 🔒 Step 7: Security Rules Deploy Karein

Firestore security rules deploy karne ke liye terminal mein run karein:

```powershell
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

Rules file pehle se project mein [`firestore.rules`](./firestore.rules) naam se configured hai.

---

## 🌐 Step 8: Website Free Hosting Par Live Karein

Apni website ko free live URL par publish karne ke liye:

```powershell
cmd.exe /c "npm run build"
firebase deploy --only hosting
```

Aapki restaurant website **free SSL** ke saath `https://<your-project-id>.web.app` par live ho jayegi!
