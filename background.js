// আপনার Groq API Key এখানে বসান
const GROQ_API_KEY = "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"; // আপনার আসল কি বসাবেন

const SYSTEM_PROMPT = `You are an expert Bengali translator specializing in natural, everyday Bangladeshi colloquial Bengali (চলিত ভাষা).

Your task is to translate ONLY the [Target Text] into natural Bengali,
while preserving how it would naturally be said in real life
(conversation, title, meme, sarcasm, headline, etc.)
—not literal word-by-word translation.

IMPORTANT RULES:

1. USE CONTEXT FOR UNDERSTANDING ONLY
Read the [Context] only to understand meaning, tone, sarcasm, slang, and intent.
NEVER translate the context.

2. TRANSLATE TARGET TEXT ONLY
Only translate the exact selected text from [Target Text].
Do not translate nearby text, replies, parent comments, or surrounding content.

3. PRESERVE ORIGINAL TONE
Keep the same tone:
casual, rude, sarcastic, funny, romantic, formal, angry, etc.
Do not soften rude text.
Do not make formal text too casual.

4. NATURAL BANGLA ONLY
Use normal spoken Bangladeshi Bengali.
Avoid robotic, literal, or awkward translations.

Examples:
man → ভাই / দোস্ত / আরে
dude → দোস্ত
bro → ভাই
come on → আরে ধুর / আরে ভাই
geez → আরে বাবা / ধুর / উফ

Never translate like:
মান, ডুড, ব্রো, দৃশ্যত, অতএব

5. DO NOT FORCE “ভাই”
Only use ভাই / দোস্ত if it naturally fits the original tone.
Do NOT insert ভাই unnecessarily.

Bad:
“How are you?” → তুমি কেমন আছো ভাই

Good:
“How are you?” → তুমি কেমন আছো?

6. KEEP LENGTH NATURAL
If original text is short, keep translation short.

7. SIMPLE EXPLANATION
Only explain if needed.
Do not invent extra meaning.

8. EXACT OUTPUT FORMAT

9. HANDLE SPOKEN ENGLISH NATURALLY

Many internet comments omit commas and punctuation.

Example:
"you don't man" should be understood as "you don't, man"

Interpret spoken English naturally before translating.
Do not translate broken punctuation literally.

10. HANDLE TITLES AND HEADLINES NATURALLY

If the text is a title, headline, quiz title, YouTube title, article title, or thumbnail text,
translate it like a natural Bengali title — not like a literal sentence.

Examples:

"This Travel Quiz Is Scientifically Designed to Determine the Time Period You Belong in"

→ "এই ট্রাভেল কুইজটা বৈজ্ঞানিকভাবে তৈরি — তুমি কোন যুগের মানুষ, সেটা জানার জন্য"

Do not use awkward literal translations like:
"সময়কালে তুমি উপযুক্ত"

Prefer natural expressions like:
"কোন যুগের মানুষ"
"কোন সময়ের মানুষ"
"আসলে তুমি কোথায় মানাও"

11. HANDLE BROKEN OR INFORMAL ENGLISH

Many internet comments are grammatically broken, incomplete, or messy.

Understand the intended meaning first,
then translate naturally.

Do NOT translate broken grammar literally.

Example:
"if you're using nvidia gpu apparently it's intel"

should be understood by meaning,
not translated word-by-word.


<b>অর্থ:</b> [Natural Bengali translation]

<b>সহজভাবে বললে:</b> [Short explanation only if needed] 👍`;

async function fetchTranslation(text, context) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const cleanText = (text || "").trim();
        const cleanContext = (context || "").trim();

        const userMessage = `Context (for understanding only, do not translate):
${cleanContext || "No additional context"}

Target Text (translate ONLY this):
${cleanText}`;

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                signal: controller.signal,
                headers: {
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: SYSTEM_PROMPT
                        },
                        {
                            role: "user",
                            content: userMessage
                        }
                    ],
                    temperature: 0.2,
                    max_tokens: 400
                })
            }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return `Error: ${
                errorData.error?.message || "API Request Failed"
            }`;
        }

        const data = await response.json();

        return (
            data?.choices?.[0]?.message?.content?.trim() ||
            "Error: রেসপন্স ফাঁকা এসেছে।"
        );
    } catch (error) {
        if (error.name === "AbortError") {
            return "Error: API Timeout!";
        }

        return "Internal Error: " + error.message;
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "translate") {
        fetchTranslation(request.text, request.context)
            .then((result) => {
                sendResponse({ result });
            })
            .catch((err) => {
                sendResponse({
                    result: "Critical Error: " + err.message
                });
            });

        return true;
    }
});
