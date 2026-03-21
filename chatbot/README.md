# NavDisha Healthcare Chatbot 🏥

A premium chatbot interface built with **Next.js**, **TailwindCSS**, and the **Vercel AI SDK**. 
This chatbot is specifically designed to handle queries about healthcare practitioners from the `service_practitioners.csv` database.

## ✨ Features
- **Smart Data retrieval**: Automatically identifies when a user is asking for practitioners at a specific service and pulls the data from your CSV.
- **Premium Design**: Modern, glassmorphism UI with smooth animations and responsive layout.
- **Vercel AI SDK**: Real-time streaming responses for a buttery-smooth chat experience.
- **Gemini Powered**: Uses Google's latest `gemini-pro` model for intelligent understanding.

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A Google Cloud Project with the Generative AI API enabled OR a Gemini API Key from [AI Studio](https://aistudio.google.com/).

### 2. Environment Variables
Create a `.env.local` file in this directory and add your API key:
```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
```

### 3. Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚢 Deploy to Vercel

The easiest way to deploy is through the [Vercel Dashboard](https://vercel.com/new).

1. Push this folder to a GitHub repository.
2. Link the repository to a new Vercel project.
3. Add the `GOOGLE_GENERATIVE_AI_API_KEY` in the **Environment Variables** section of the Vercel project settings.
4. Vercel will automatically build and deploy your app.

## 📂 Data
The application reads from `data/service_practitioners.csv`. To update the database, simply replace this CSV file and re-deploy.
