/**
 * Calls the gpt4free API to analyze a file for bugs and vulnerabilities with step-by-step reasoning.
 * @param path The file path (for context)
 * @param content The file content
 * @param model (optional) The model to use (e.g., 'gpt-4o', 'gpt-4o-mini', etc.)
 * @param promptOverride (optional) If provided, use this as the prompt instead of the default
 * @returns The AI's response (string or object)
 */
export async function analyzeFileWithAI(path: string, content: string, model: string = "gpt-4o-mini", promptOverride?: string): Promise<string> {
  const prompt = promptOverride ?? `Analyze the following file for bugs and vulnerabilities. Explain your reasoning step by step.\nFile path: ${path}\nFile content:\n${content}`;

  // gpt4free API endpoint (adjust if running on a different port or host)
  const endpoint = "http://localhost:1337/v1/chat/completions";

  const body = {
    model,
    messages: [
      { role: "user", content: prompt }
    ],
    web_search: false
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`gpt4free API error: ${res.status}`);
  }

  const data = await res.json();
  // The response format: { choices: [{ message: { content: string } }] }
  return data.choices?.[0]?.message?.content || "";
}
