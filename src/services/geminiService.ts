
import { GoogleGenAI } from "@google/genai";
import { Teacher, ClassRequirement, MasterTimetable } from "../types";

/**
 * Utility to strip markdown code blocks and find the first JSON-like structure
 */
const cleanJsonResponse = (raw: string): string => {
  const jsonStart = raw.indexOf('{');
  const jsonEnd = raw.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    return raw.substring(jsonStart, jsonEnd + 1);
  }
  return raw.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const generateSmartTimetable = async (
  teachers: Teacher[],
  requirements: ClassRequirement[]
): Promise<MasterTimetable | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Act as a school administrator for GHS Deon Khera. Generate a master timetable for 5 classes (6th-10th) over 6 days (MON-SAT) with 8 periods daily.
      
      Teachers & Workloads: ${JSON.stringify(teachers.map(t => ({ id: t.id, name: t.name, assignments: t.assignments })))}
      
      MANDATORY PDF CONSTRAINTS:
      1. Core Subjects (Science, Math, English, SST) for senior classes (8th, 9th, 10th) MUST be in the first 5 periods.
      2. If a teacher has more than 6 periods in a single class per week, 6 periods MUST be in the first 5 periods of the day, and the rest (periods 7 and 8) should be in the last 3 periods (6 to 8).
      3. Grading subjects (Computer, Phy Edu, Art, W.L.) should mostly be assigned after 4 periods (periods 5-8).
      4. Recess is after the 5th period.
      5. Conflict Check: No teacher can be in two classes at once. No class can have two teachers at once.
      6. Teacher ids must match exactly: ${teachers.map(t => t.id).join(', ')}.
      
      Return ONLY a JSON object matching the MasterTimetable structure: Record<Day, Record<number, Record<TeacherId, {classId, subject, teacherId}>>>. 
      Do not include any text before or after the JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const textOutput = response.text;
    if (textOutput) {
      const cleaned = cleanJsonResponse(textOutput);
      return JSON.parse(cleaned) as MasterTimetable;
    }
    return null;
  } catch (error) {
    console.error("AI Generation failed:", error);
    return null;
  }
};
