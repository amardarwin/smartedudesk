
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
      Act as a school administrator for GHS Deon Khera. Generate a master timetable for classes 6th to 10th over 6 days (MON-SAT) with 8 periods daily.
      Recess is strictly after Period 5.
      
      Teachers & Assignments: ${JSON.stringify(teachers.map(t => ({ 
        id: t.id, 
        name: t.name, 
        assignments: t.assignments,
        qualifiedSubjects: t.subjects 
      })))}
      
      STRICT PEDAGOGICAL CONSTRAINTS (MANDATORY):
      
      1. WORKLOAD BALANCE:
         - NO teacher should have more than 3 continuous teaching periods.
         - NO teacher should have more than 2 continuous free (vacant) periods. (STRICT)
         - NO teacher should have all periods only before recess. (STRICT)
         - NO teacher should remain completely vacant after recess. (STRICT)
         - NO teacher should teach all 3 periods after recess (6, 7, 8) continuously.
         - Teachers MUST have some periods before recess (1-5) AND some after recess (6-8).

      2. SCIENCE SUBJECT SPECIAL RULES (STRICT):
         - 10th Class Science: Fix 3rd Period on FRIDAY.
         - 9th Class Science: Fix 2nd Period on TUESDAY.
         - 8th Class Science: Fix 2nd Period on WEDNESDAY.
         - 7th Class Science: Out of 8 weekly periods, at least 2 MUST be assigned before recess (1-5).
         - 9th & 10th Class Science: Out of 7 weekly periods, exactly 1 MUST be assigned at 8th Period on different days for each class.
         - Science for 8th, 9th, 10th should mostly be BEFORE recess, but continuity is allowed where helpful.

      3. GRADING SUBJECTS (Phy Edu, Computer, Art, W.L., Agri):
         - These should be broken across days. 
         - Example: If Phy Edu has 6 periods, assign 3 on Sat (P7) and 3 on another day (P8).
         - Continuity is NOT mandatory for grading subjects. Focus these on Periods 7 and 8.

      4. CONFLICTS:
         - No teacher in two classes at once.
         - No class with two teachers at once.
         - Teacher IDs must match: ${teachers.map(t => t.id).join(', ')}.

      Return ONLY a JSON object matching the MasterTimetable structure: Record<Day, Record<number, Record<TeacherId, {classId, subject, teacherId}>>>.
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
