const API_KEY = "AIzaSyAFsWwfpTP-m2z9LOSMqmXLEIzBc1tMtYg"; 
const GEMINI_MODEL_NAME = "gemini-2.0-flash";

export async function callGeminiAPI(prompt, isJsonResponse = false) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${API_KEY}`;
    
    let payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    if (isJsonResponse) {
        payload.generationConfig = {
            responseMimeType: "application/json",
           
        };
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("API Error Response:", errorBody);
            throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            // Basic validation for JSON response
            if (isJsonResponse) {
                try {
                    return JSON.parse(text);
                } catch (parseError) {
                    console.error("Failed to parse JSON response:", parseError, "Raw text:", text);
                    throw new Error("AI returned malformed JSON.");
                }
            }
            return text;
        } else {
            console.error("Unexpected API response structure:", result);
            // Check for safety ratings or blocked content
            if (result.promptFeedback && result.promptFeedback.blockReason) {
                 throw new Error(`Request blocked by API due to: ${result.promptFeedback.blockReason}. ${result.promptFeedback.safetyRatings ? JSON.stringify(result.promptFeedback.safetyRatings) : ''}`);
            }
            throw new Error("Unexpected API response structure or content missing.");
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw error; // Re-throw the error to be caught by the caller
    }
}
