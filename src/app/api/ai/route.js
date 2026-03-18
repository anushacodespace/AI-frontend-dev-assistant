import Groq from "groq-sdk";

export const runtime = "nodejs"; // ✅ IMPORTANT (prevents buffering)

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const prompts = {
  explain: (code, language) =>
    `Explain this ${language} code in simple terms.\n\n${code}`,
  bugs: (code, language) =>
    `Find bugs in this ${language} code. ${
      language === "php"
        ? "Apply Magento/PHP best practices where relevant."
        : ""
    }\nExplain the issue and suggest fixes.\n\n${code}`,
  improve: (code, language) =>
    `Improve this ${language} code and return a cleaner optimized version.\n\n${code}`,
  interview: (code, language) =>
    `Generate 5 ${language} developer interview questions based on this code.\n\n${code}`,
};

export async function POST(req) {
  try {
    const { code, type, language = "javascript", messages } =
      await req.json();

    let finalMessages;

    if (type === "chat") {
      finalMessages = messages;
    } else {
      if (!code || !type || !prompts[type]) {
        return new Response("Invalid input", { status: 400 });
      }

      finalMessages = [
        { role: "user", content: prompts[type](code, language) },
      ];
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: finalMessages,
      temperature: 0.5,
      stream: true,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices?.[0]?.delta?.content;

            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform", // ✅ prevents buffering
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return new Response("Error", { status: 500 });
  }
}