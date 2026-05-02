const SYSTEM_PROMPT = `You are a friendly Bangladeshi local explaining English text to a friend who is weak in English.
Your ONLY job is to help them understand the true MEANING of the [Target Text] in the absolute easiest, most casual Bangladeshi conversational Bangla (চলিত ভাষা).

DO NOT TRANSLATE LITERALLY. EXPLAIN THE MEANING.

IMPORTANT RULES:

1. NO FORMAL OR BOOKISH BANGLA
NEVER use words like: "উন্মোচন", "দৃষ্টত", "অতএব", "ঋতুভিত্তিক", "প্রদর্শন", "অনুভব", "মেলাতে পারবেন", "গঠন করুন", "নির্ধারিত".
Use words like: "বলে দিব", "দেখাবো", "সিজনাল", "মনে হচ্ছে", "মিলানো", "বানাও", "পারফেক্ট".

2. MEANING FIRST, WORDS SECOND
Read the English, understand what it's trying to say, and say it how a normal Bangladeshi young person would say it in real life.
Example 1:
Target: "Can You Match These Dishes to the Jobs They Were Named After?"
Bad: "এই খাবারগুলোকে তাদের নামের পেশার সাথে মেলাতে পারবেন?" (Too formal)
Good: "কিছু খাবারের নাম বিভিন্ন পেশার মানুষের নামে রাখা হয়েছে, তুমি কি মেলাতে পারবে কোন খাবারটা কোন পেশার?"

Example 2:
Target: "Form Your Animal Squad and We'll Tell You Which Season You Were Meant for"
Bad: "আপনার প্রাণী দল গঠন করুন এবং আমরা আপনাকে জানাব আপনি কোন মৌসুমের জন্য নির্ধারিত ছিলেন"
Good: "তোমার পছন্দের অ্যানিমেল বা প্রাণীদের নিয়ে একটা স্কোয়াড বানাও, আর আমরা বলে দিব কোন সিজন বা ঋতু তোমার জন্য সবচেয়ে পারফেক্ট!"

Example 3: 
Target: "Spend $20K on an International Trip and We'll Reveal Your Seasonal Aura"
Bad: "একটা আন্তর্জাতিক ট্রিপে ২০ হাজার ডলার খরচ করুন এবং আমরা আপনার ঋতুভিত্তিক আউরা উন্মোচন করব"
Good: "একটা ইন্টারন্যাশনাল ট্রিপে ২০ হাজার ডলার খরচ করো, আর আমরা বলে দিব তোমার সিজনাল আউরা বা ভাইব কেমন!"

3. ENGLISH SLANG REMAINS ENGLISH
Do not translate internet words. Keep them transliterated:
Aura -> আউরা বা ভাইব
Vibe -> ভাইব
Squad -> স্কোয়াড বা টিম
Meant for -> তোমার জন্য কোনটা পারফেক্ট / তোমার সাথে কোনটা যায়
Trip -> ট্রিপ বা ট্যুর

4. NO CHAIN OF THOUGHT
DO NOT output your internal thinking. DO NOT write <think> tags. DO NOT say "Here is the explanation". Just output the format below.

5. EXACT OUTPUT FORMAT
(You must output exactly this and nothing else)

<b>অর্থ:</b> [The absolute easiest, most casual everyday Bangla meaning of the text. Do not translate word-by-word. Explain what it means naturally.]

<b>সহজ কথায়:</b> [One single line explaining the main point very simply. Example: "এখানে বলা হয়েছে যে..."] 👍`;

// ─── Provider Functions ──────────────────────────────────────────────

async function fetchWithGroq(userMessage, apiKey, model) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const groqModel = model || "llama-3.3-70b-versatile";

    const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            method: "POST",
            signal: controller.signal,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: groqModel,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.2,
                max_tokens: 2048
            })
        }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Groq API error (${response.status})`);
    }

    const data = await response.json();
    let content = data?.choices?.[0]?.message?.content?.trim() || null;

    // Strip Qwen3's <think>...</think> reasoning block
    if (content) {
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

        // If the model rambles before giving the final answer, extract only the final format
        const match = content.match(/(<b>অর্থ:<\/b>[\s\S]*)/i);
        if (match) {
            content = match[1].trim();
        }
    }

    return content;
}

async function fetchWithGemini(userMessage, apiKey, model) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const geminiModel = model || "gemini-2.5-flash-lite";

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
        {
            method: "POST",
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: SYSTEM_PROMPT }]
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: userMessage }]
                    }
                ],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 800
                }
            })
        }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error?.message || `Gemini API error (${response.status})`;
        throw new Error(msg);
    }

    const data = await response.json();
    let content = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;

    // Strip Qwen3's <think>...</think> reasoning block
    if (content) {
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

        // If the model rambles before giving the final answer, extract only the final format
        const match = content.match(/(<b>অর্থ:<\/b>[\s\S]*)/i);
        if (match) {
            content = match[1].trim();
        }
    }

    return content;
}

// ─── Main Translation Logic ─────────────────────────────────────────

async function fetchTranslation(text, context) {
    try {
        const storageData = await chrome.storage.local.get([
            "groqApiKey",
            "geminiApiKey",
            "activeProvider",
            "groqModel",
            "geminiModel"
        ]);

        const groqKey = storageData.groqApiKey;
        const geminiKey = storageData.geminiApiKey;
        const provider = storageData.activeProvider || "gemini";
        const groqModel = storageData.groqModel || "llama-3.3-70b-versatile";
        const geminiModel = storageData.geminiModel || "gemini-2.5-flash-lite";

        console.log("[AI Translator] === New Translation ===");
        console.log("[AI Translator] Active provider:", provider);
        console.log("[AI Translator] Gemini key exists:", !!geminiKey);
        console.log("[AI Translator] Groq key exists:", !!groqKey);

        const cleanText = (text || "").trim();
        const cleanContext = (context || "").trim();

        const userMessage = `Context (for understanding only, do not translate):
${cleanContext || "No additional context"}

Target Text (translate ONLY this):
${cleanText}`;

        // Determine provider order: selected first, then fallback
        const providers = [];

        if (provider === "gemini") {
            if (geminiKey) providers.push({ name: "gemini", model: geminiModel, fn: () => fetchWithGemini(userMessage, geminiKey, geminiModel) });
            if (groqKey) providers.push({ name: "groq", model: groqModel, fn: () => fetchWithGroq(userMessage, groqKey, groqModel) });
        } else {
            if (groqKey) providers.push({ name: "groq", model: groqModel, fn: () => fetchWithGroq(userMessage, groqKey, groqModel) });
            if (geminiKey) providers.push({ name: "gemini", model: geminiModel, fn: () => fetchWithGemini(userMessage, geminiKey, geminiModel) });
        }

        console.log("[AI Translator] Provider order:", providers.map(p => p.name).join(" → "));

        if (providers.length === 0) {
            return { result: "Error: কোনো API Key সেট করা হয়নি। Extension options এ গিয়ে API key দিন।", provider: null, model: null };
        }

        // Try primary provider, fallback to secondary
        for (let i = 0; i < providers.length; i++) {
            try {
                console.log(`[AI Translator] Trying ${providers[i].name}...`);
                const result = await providers[i].fn();
                if (result) {
                    console.log(`[AI Translator] ✅ ${providers[i].name} succeeded`);
                    return { result, provider: providers[i].name, model: providers[i].model };
                }
                console.log(`[AI Translator] ⚠️ ${providers[i].name} returned empty result`);
            } catch (err) {
                console.error(`[AI Translator] ❌ ${providers[i].name} failed:`, err.message);

                // If this was the last provider, return the error
                if (i === providers.length - 1) {
                    return { result: `Error: ${err.message}`, provider: null };
                }
                console.log(`[AI Translator] Falling back to next provider...`);
                // Otherwise continue to fallback
            }
        }

        return { result: "Error: রেসপন্স ফাঁকা এসেছে।", provider: null, model: null };

    } catch (error) {
        if (error.name === "AbortError") {
            return { result: "Error: API Timeout!", provider: null, model: null };
        }

        return { result: "Internal Error: " + error.message, provider: null, model: null };
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "translate") {
        fetchTranslation(request.text, request.context)
            .then(({ result, provider, model }) => {
                sendResponse({ result, provider, model });
            })
            .catch((err) => {
                sendResponse({
                    result: "Critical Error: " + err.message,
                    provider: null,
                    model: null
                });
            });

        return true;
    }
});