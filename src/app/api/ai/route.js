import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const prompts = {
  explain: (code, language) => `Explain this ${language} code in simple terms.\n\n${code}`,
  bugs: (code, language) => `Find bugs in this ${language} code. ${language === "php" ? "Apply Magento/PHP best practices where relevant." : ""}\nExplain the issue and suggest fixes.\n\n${code}`,
  improve: (code, language) => `Improve this ${language} code and return a cleaner optimized version.\n\n${code}`,
  interview: (code, language) => `Generate 5 ${language} developer interview questions based on this code.\n\n${code}`,
};

export async function POST(req) {
  try {
    const { code, type, language = "javascript", messages } = await req.json();

    // Chat mode
    if (type === "chat") {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        max_tokens: 1024,
        temperature: 0.5,
      });
      const result = response.choices[0].message.content;
      return Response.json({ result });
    }

    // Normal analysis mode
    if (!code || !type) {
      return Response.json({ error: "Missing code or type" }, { status: 400 });
    }

    if (!prompts[type]) {
      return Response.json({ error: "Invalid type" }, { status: 400 });
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompts[type](code, language) }],
      max_tokens: 1024,
      temperature: 0.2,
    });

    const result = response.choices[0].message.content;
    return Response.json({ result });

  } catch (error) {
    console.error("AI error:", error);
    return Response.json({ error: "AI request failed" }, { status: 500 });
  }
}