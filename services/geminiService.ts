import { GoogleGenAI, Chat, FunctionDeclaration, Type } from "@google/genai";
import { UserProfile } from "../types";
import { getBMICategory } from "./ruleEngine";

// Helper to format history for context
const formatHealthContext = (profile: UserProfile): string => {
  const lastLog = profile.dailyLogs[profile.dailyLogs.length - 1];
  const bmiCategory = getBMICategory(profile.bmi || 22);
  
  let context = `
  CURRENT USER HEALTH PROFILE:
  - Name: ${profile.name}
  - Age: ${profile.age}
  - Gender: ${profile.gender}
  - Body Stats: Height ${profile.height}cm, Weight ${profile.weight}kg
  - BMI (Body Mass Index): ${profile.bmi?.toFixed(1) || 'N/A'} (${bmiCategory})
  - Blood Values: 
    * Iron: ${profile.bloodValues.iron}
    * Ferritin: ${profile.bloodValues.ferritin || 'N/A'}
    * B12: ${profile.bloodValues.b12}
    * D3: ${profile.bloodValues.d3}
    * WBC: ${profile.bloodValues.wbc}
    * Hemoglobin: ${profile.bloodValues.hemoglobin || 'N/A'}
    * Magnesium: ${profile.bloodValues.magnesium || 'N/A'}
    * Glucose: ${profile.bloodValues.glucose || 'N/A'}
    * TSH: ${profile.bloodValues.tsh || 'N/A'}
  `;

  // Add Custom Values if they exist
  if (profile.bloodValues.customValues && profile.bloodValues.customValues.length > 0) {
    context += `    * OTHER TESTS:\n`;
    profile.bloodValues.customValues.forEach(val => {
      context += `      - ${val.name}: ${val.value} ${val.unit}\n`;
    });
  }

  if (lastLog) {
    context += `
    TODAY'S STATUS (${lastLog.date}):
    - Nutrition Score (1-10): ${lastLog.nutritionScore || 'N/A'}
    - Stress Level (1-10): ${lastLog.stressLevel}
    - Fatigue Level (1-10): ${lastLog.fatigueLevel}
    - Sleep: ${lastLog.sleepHours} hours
    - Symptoms: ${lastLog.symptoms.join(', ') || 'None'}
    - Immunity Score: ${lastLog.immunityScore}/100
    - Daily System Feedback: ${lastLog.dailyAdvice || 'N/A'}
    `;
  } else {
    context += `\nNo daily log entered for today yet.`;
  }

  // Add recent symptom history context
  const recentSymptoms = profile.symptomHistory.slice(-3);
  if (recentSymptoms.length > 0) {
    context += `\nRECENT SYMPTOM MEMORY:
    ${recentSymptoms.map(s => `- ${s.timestamp}: ${s.symptom} (Severity: ${s.severity || 'N/A'}, Duration: ${s.duration || 'N/A'})`).join('\n')}
    `;
  }

  return context;
};

// Define the Tool
const logSymptomTool: FunctionDeclaration = {
  name: 'logSymptom',
  description: 'Records a user symptom to their personal health memory with details like severity and duration.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      symptom: {
        type: Type.STRING,
        description: 'The name of the symptom or disease indication (e.g., Headache, Flu, Nausea).',
      },
      severity: {
        type: Type.STRING,
        description: 'The quality or intensity of the symptom (e.g., Mild, Throbbing, 8/10, Unbearable).',
      },
      duration: {
        type: Type.STRING,
        description: 'The quantity or time duration (e.g., Since yesterday, 2 hours, Chronic).',
      },
    },
    required: ['symptom'],
  },
};

export const createGeminiChat = (profile: UserProfile): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const healthContext = formatHealthContext(profile);

  const systemInstruction = `
  You are "SağlıkAsist", a smart health assistant for a TÜBİTAK project.

  **CORE OBJECTIVE:**
  Listen to the user, **RECORD** any symptoms they mention using the \`logSymptom\` tool, and then provide helpful **WELLNESS ADVICE**.

  **RULES FOR MEDICAL SAFETY:**
  1.  **NO DIAGNOSIS:** Never say "You have X disease". Say "This sounds like it could be X" or "These symptoms are often associated with X".
  2.  **NO MEDICATION:** Never prescribe drugs (antibiotics, painkillers, etc.).
  3.  **NO TREATMENT:** Do not recommend medical treatments.
  4.  **ADVICE IS ALLOWED:** You **MUST** provide non-medical, supportive advice.
      *   *Example:* "For a sore throat, you might try drinking warm honey ginger tea." (Allowed)
      *   *Example:* "Rest in a dark, quiet room for your headache." (Allowed)
      *   *Example:* "Since your stress is high, try this breathing exercise..." (Allowed)
      *   *Example:* "Take Parol." (PROHIBITED)

  **CONTEXT USAGE:**
  - **BMI Awareness:** The user has a BMI of ${profile.bmi?.toFixed(1) || 'N/A'} (${getBMICategory(profile.bmi || 22)}). Use this to tailor fitness/nutrition advice (e.g., heavier exercise for normal weight, low impact for obese).
  - **Blood Values:** If values are out of range, suggest natural dietary sources.
  - **Daily Status:** User's nutrition score today is ${profile.dailyLogs[profile.dailyLogs.length - 1]?.nutritionScore || 'Unknown'}/10.

  **PROCESS:**
  1.  If the user mentions feeling unwell or a specific symptom, **IMMEDIATELY** call the \`logSymptom\` function to save it to their history.
  2.  After the tool is called, continue the conversation by offering empathy and safe, home-remedy style suggestions based on their input and health profile.

  **LANGUAGE:**
  ALWAYS reply in Turkish.

  ${healthContext}
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 500,
      tools: [{ functionDeclarations: [logSymptomTool] }],
    },
  });
};