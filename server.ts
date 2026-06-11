import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Increase payload bounds for base64 PDFs and notes
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.trim() === "" || key === "MY_GEMINI_API_KEY") {
      throw new Error(
        "GEMINI_API_KEY is not configured in environment variables. Please check the Secrets panel in AI Studio settings."
      );
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// 1. API: Generate study guide from uploaded materials
app.post("/api/generate-notes", async (req, res) => {
  try {
    const { sources, focusDepth, explainStyle, flashcardCount, quizCount } = req.body;

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return res.status(400).json({ error: "At least one study source is required." });
    }

    const ai = getGeminiClient();

    // Prepare inputs for Gemini
    const contents: any[] = [];

    sources.forEach((source) => {
      if (source.type === "pdf") {
        // Strip out the data:application/pdf;base64, header if it exists
        const base64Data = source.content.replace(/^data:application\/pdf;base64,/, "");
        contents.push({
          inlineData: {
            mimeType: "application/pdf",
            data: base64Data,
          },
        });
      } else {
        contents.push({
          text: `--- SOURCE START: ${source.name} (Type: ${source.type}) ---\n${source.content}\n--- SOURCE END ---`,
        });
      }
    });

    const userInstructions = `
      Create a highly structured and comprehensive study guide tailored based on:
      - Focus depth: ${focusDepth || "deep"} (Ensure thoroughness, detail, and no skipped concepts).
      - Explanation Style: ${explainStyle || "feynman"} (Highly intuitive, using first-principles reasoning and relatable real-world analogies).

      Flashcard & Exam Config:
      - Output EXACTLY ${flashcardCount || 10} flashcards and EXACTLY ${quizCount || 10} practice exam questions.
      - Ensure absolutely NO duplicates in the flashcards or practice questions.
      - Each flashcard and question MUST test a unique concept with great details. Do not repeat the same logic.

      Critically, scan the source materials in detail and document EACH topic, rule, concept, theorem, code snippet, math formula, or main point. Do NOT leave out any single content area. Let's build a beautiful system.
    `;

    contents.push({ text: userInstructions });

    // Define strict response schema matching src/types.ts
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "An elegant, comprehensive academic title of the study bundle.",
        },
        quickSummary: {
          type: Type.STRING,
          description: "A motivating, summary of the bundle, chapters covered, and high-level prep perspective.",
        },
        topics: {
          type: Type.ARRAY,
          description: "Exhaustive array of EVERY topic and sub-topic. Must be 100% complete with no omission from the source PDF/lecture notes. Cover definitions, context, and steps.",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Primary title of the topic." },
              category: { type: Type.STRING, description: "Category/Chapter of study." },
              summary: { type: Type.STRING, description: "Brief overview of what this theory/concept is about (2-3 sentences)." },
              fullExplanation: {
                type: Type.STRING,
                description: "The complete, rich, absolute exhaustive explanation formatted in BEAUTIFUL MARKDOWN. Never output a giant wall of text. Use headings (###), bold text (**), bullet points (*), numbered lists, code blocks (```), and blockquotes (>) to structure thoughts organically. Include step-by-step reasoning, theory, math models, edge cases, and all data from the source material.",
              },
              simplified: {
                type: Type.OBJECT,
                properties: {
                  coreIdea: { type: Type.STRING, description: "Very simple explanation in plain English." },
                  analogy: { type: Type.STRING, description: "A beautiful, relatable real-world analogy to make it instantly intuitive." },
                  keySteps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3 key consecutive logical steps or rules to master this topic.",
                  },
                },
                required: ["coreIdea", "analogy", "keySteps"],
              },
            },
            required: ["title", "category", "summary", "fullExplanation", "simplified"],
          },
        },
        flashcards: {
          type: Type.ARRAY,
          description: `A smart deck of exactly ${flashcardCount || 10} interactive practice cards highlighting core vocabulary, concepts, formulas, or short questions. Must contain unique, non-repeating logic and great detail.`,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING, description: "A high-yield test question, key concept term, or formula name." },
              back: { type: Type.STRING, description: "The answer or thorough definition of the front concept." },
            },
            required: ["front", "back"],
          },
        },
        practiceExam: {
          type: Type.ARRAY,
          description: `A solid practice exam consisting of exactly ${quizCount || 10} multiple-choice prep questions based on the source materials. Thorough explanations, unique concepts, NO repeats.`,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "A high-fidelity exam-style query." },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of exactly 4 plausible choices.",
              },
              correctAnswer: { type: Type.STRING, description: "The precise option matching the only correct answer." },
              explanation: { type: Type.STRING, description: "Pedagogically rich, clear explanation of why that answer is correct, and why other options are distractors." },
            },
            required: ["question", "options", "correctAnswer", "explanation"],
          },
        },
      },
      required: ["title", "quickSummary", "topics", "flashcards", "practiceExam"],
    };

    const systemInstruction = `
      You are the Ultimate Learner, a senior cognitive training algorithm and academic genius.
      Your goal is to parse PDFs/word files and construct a masterpiece study-set.
      Always yield deep, understandable explanations with bullet points and clear reasoning so that no information is lost, coupled with clear Feynman-style analogies.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1, // low temperature for precise factual extraction
      },
    });

    const outputText = response.text;
    if (!outputText) {
      return res.status(500).json({ error: "Failed to generate any output text from the model." });
    }

    const studyGuide = JSON.parse(outputText);
    return res.json(studyGuide);
  } catch (error: any) {
    console.error("Error in generate-notes:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred during study guide generation.",
    });
  }
});

// Configure client environment & routing
async function init() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Express in Development mode (with Vite middleware)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Setting up Express in Production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express dev/prod server listening at http://0.0.0.0:${PORT}`);
  });
}

init();
