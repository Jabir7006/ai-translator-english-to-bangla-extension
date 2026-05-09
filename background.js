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
Output:
<b>অর্থ:</b> কিছু খাবারের নাম বিভিন্ন পেশার মানুষের নামে রাখা হয়েছে, তুমি কি মেলাতে পারবে কোন খাবারটা কোন পেশার?
<b>সহজ কথায়:</b> এখানে জানতে চাওয়া হয়েছে যে তুমি পেশা অনুযায়ী খাবারের নাম মেলাতে পারবে কিনা। 👍

Example 2:
Target: "Form Your Animal Squad and We'll Tell You Which Season You Were Meant for"
Output:
<b>অর্থ:</b> তোমার পছন্দের অ্যানিমেল বা প্রাণীদের নিয়ে একটা স্কোয়াড বানাও, আর আমরা বলে দিব কোন সিজন বা ঋতু তোমার জন্য সবচেয়ে পারফেক্ট!
<b>সহজ কথায়:</b> এখানে বলা হয়েছে যে পছন্দের প্রাণী সিলেক্ট করলে তোমার সিজন জানা যাবে। 👍

Example 3: 
Target: "Spend $20K on an International Trip and We'll Reveal Your Seasonal Aura"
Output:
<b>অর্থ:</b> একটা ইন্টারন্যাশনাল ট্রিপে ২০ হাজার ডলার খরচ করো, আর আমরা বলে দিব তোমার সিজনাল আউরা বা ভাইব কেমন!
<b>সহজ কথায়:</b> এখানে বলা হয়েছে যে ইন্টারন্যাশনাল ট্যুরে টাকা খরচ করলে তোমার ভাইব বোঝা যাবে। 👍

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

const SYSTEM_PROMPT_BN_EN = `You are a helpful translator. Your task is to translate the user's Banglish (Bengali written in English alphabet) text into natural, correct English.

IMPORTANT RULES:
1. Output only the exact English translation.
2. Do NOT output any additional text, explanation, or conversational fillers.
3. Make the English sound natural and conversational.

Example 1:
User: kemon aso
Output: How are you?

Example 2:
User: ajke ki korba?
Output: What will you do today?`;

const SYSTEM_PROMPT_GRAMMAR_CHECK = `You are a helpful English grammar expert. The user will give you an English text.
Your task is to correct any grammatical errors in the text.
Provide the output EXACTLY in this format:

<b>Corrected Text:</b> [The grammatically correct English text]

<b>Explanation:</b> [A short explanation IN BENGALI (Bangla) explaining where the mistake was, why it was wrong, and why the correction is correct. Keep the explanation very casual and easy to understand. If the original text was already correct, just mention that it was correct.]`;

// ─── Cache (Data Structure Algorithm for Speed) ──────────────────────
const translationCache = new Map();
const MAX_CACHE_SIZE = 100;

function getCacheKey(text, context, options) {
    return `${options?.isBanglaOutput}_${(context || "").trim()}_${(text || "").trim()}`;
}

// ─── Provider Functions ──────────────────────────────────────────────

async function fetchWithGroq(userMessage, apiKey, model, options = { systemPrompt: SYSTEM_PROMPT, isBanglaOutput: true }, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error("Timeout")), timeoutMs);

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
                    { role: "system", content: options.systemPrompt },
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

        if (options.isBanglaOutput) {
            const orthMatch = content.match(/(?:<b\s*>|\*\*|\*|)\s*অর্থ:\s*(?:<\/b>|\*\*|\*|)?\s*([\s\S]*?)(?=(?:<b\s*>|\*\*|\*|)\s*সহজ কথায়:|\n\* |\n\n|$)/i);
            const shohojMatch = content.match(/(?:<b\s*>|\*\*|\*|)\s*সহজ কথায়:\s*(?:<\/b>|\*\*|\*|)?\s*([\s\S]*?)(?=(?:\n\* |\n\n|$))/i);
            
            if (orthMatch || shohojMatch) {
                let newContent = "";
                if (orthMatch) newContent += `<b>অর্থ:</b> ${orthMatch[1].trim().replace(/\n/g, ' ')}\n\n`;
                if (shohojMatch) newContent += `<b>সহজ কথায়:</b> ${shohojMatch[1].trim().replace(/\n/g, ' ')}`;
                content = newContent.trim();
            } else {
                const match = content.match(/(<b>অর্থ:<\/b>[\s\S]*)/i);
                if (match) content = match[1].trim();
            }
        }
    }

    return content;
}

async function fetchWithGemini(userMessage, apiKey, model, options = { systemPrompt: SYSTEM_PROMPT, isBanglaOutput: true }, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error("Timeout")), timeoutMs);

    const geminiModel = model || "gemini-2.5-flash-lite";

    const requestOptions = {
        method: "POST",
        signal: controller.signal,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: options.systemPrompt }]
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
    };

    let response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
        requestOptions
    );

    // Fallback to v1alpha if the model is an experimental/preview model not in v1beta
    if (response.status === 404) {
        response = await fetch(
            `https://generativelanguage.googleapis.com/v1alpha/models/${geminiModel}:generateContent?key=${apiKey}`,
            requestOptions
        );
    }

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

        if (options.isBanglaOutput) {
            const orthMatch = content.match(/(?:<b\s*>|\*\*|\*|)\s*অর্থ:\s*(?:<\/b>|\*\*|\*|)?\s*([\s\S]*?)(?=(?:<b\s*>|\*\*|\*|)\s*সহজ কথায়:|\n\* |\n\n|$)/i);
            const shohojMatch = content.match(/(?:<b\s*>|\*\*|\*|)\s*সহজ কথায়:\s*(?:<\/b>|\*\*|\*|)?\s*([\s\S]*?)(?=(?:\n\* |\n\n|$))/i);
            
            if (orthMatch || shohojMatch) {
                let newContent = "";
                if (orthMatch) newContent += `<b>অর্থ:</b> ${orthMatch[1].trim().replace(/\n/g, ' ')}\n\n`;
                if (shohojMatch) newContent += `<b>সহজ কথায়:</b> ${shohojMatch[1].trim().replace(/\n/g, ' ')}`;
                content = newContent.trim();
            } else {
                const match = content.match(/(<b>অর্থ:<\/b>[\s\S]*)/i);
                if (match) content = match[1].trim();
            }
        }
    }

    return content;
}

// ─── Main Translation Logic ─────────────────────────────────────────

function fetchTranslation(text, context, options = { systemPrompt: SYSTEM_PROMPT, isBanglaOutput: true }) {
    const cleanText = (text || "").trim();
    const cleanContext = (context || "").trim();
    
    // 1. Check Cache first! (Now caches Promises for Request Coalescing/Prefetching)
    const cacheKey = getCacheKey(cleanText, cleanContext, options);
    if (translationCache.has(cacheKey)) {
        console.log("[AI Translator] ⚡ Returning translation from Cache! (0ms)");
        const cachedPromise = translationCache.get(cacheKey);
        // Move to end to maintain LRU order
        translationCache.delete(cacheKey);
        translationCache.set(cacheKey, cachedPromise);
        return cachedPromise;
    }

    const fetchPromise = (async () => {
        try {
            const storageData = await chrome.storage.local.get([
                "groqApiKey",
                "geminiApiKey",
                "activeProvider",
                "groqModel",
                "geminiModel"
            ]);

            const groqKey = (storageData.groqApiKey || "").trim();
            const geminiKey = (storageData.geminiApiKey || "").trim();
            const provider = storageData.activeProvider || "gemini";
            const groqModel = storageData.groqModel || "llama-3.3-70b-versatile";
            const geminiModel = storageData.geminiModel || "gemini-2.5-flash-lite";

            console.log("[AI Translator] === New Translation ===");
            console.log("[AI Translator] Active provider:", provider);
            console.log("[AI Translator] Gemini key exists:", !!geminiKey);
            console.log("[AI Translator] Groq key exists:", !!groqKey);

            const userMessage = `Context (for understanding only, do not translate):
${cleanContext || "No additional context"}

Target Text (translate ONLY this):
${cleanText}

CRITICAL INSTRUCTION: You must strictly follow the exact output format defined in the system prompt.
Respond ONLY with the exact "<b>অর্থ:</b>" and "<b>সহজ কথায়:</b>" tags.
Do NOT output a checklist. Do NOT output your thought process. Do NOT add any conversational filler.`;

            // Determine provider order: selected first, then fallback
            const providers = [];

            if (provider === "gemini") {
                if (geminiKey) providers.push({ name: "gemini", model: geminiModel, fn: (timeout) => fetchWithGemini(userMessage, geminiKey, geminiModel, options, timeout) });
                if (groqKey) providers.push({ name: "groq", model: groqModel, fn: (timeout) => fetchWithGroq(userMessage, groqKey, groqModel, options, timeout) });
            } else {
                if (groqKey) providers.push({ name: "groq", model: groqModel, fn: (timeout) => fetchWithGroq(userMessage, groqKey, groqModel, options, timeout) });
                if (geminiKey) providers.push({ name: "gemini", model: geminiModel, fn: (timeout) => fetchWithGemini(userMessage, geminiKey, geminiModel, options, timeout) });
            }

            console.log("[AI Translator] Provider order:", providers.map(p => p.name).join(" → "));

            if (providers.length === 0) {
                return { result: "Error: কোনো API Key সেট করা হয়নি। Extension options এ গিয়ে API key দিন।", provider: null, model: null };
            }

            const TOTAL_TIMEOUT_MS = 10000; // 10 seconds total budget
            const HEAD_START_MS = 3000;     // 3 seconds head start for primary

            const runProvider = async (p, timeout) => {
                const res = await p.fn(timeout);
                if (!res) throw new Error("Empty response");
                return { result: res, provider: p.name, model: p.model };
            };

            if (providers.length === 1) {
                try {
                    console.log(`[AI Translator] Trying ${providers[0].name} with timeout ${TOTAL_TIMEOUT_MS}ms...`);
                    const res = await runProvider(providers[0], TOTAL_TIMEOUT_MS);
                    console.log(`[AI Translator] ✅ ${providers[0].name} succeeded`);
                    return res;
                } catch (err) {
                    console.warn(`[AI Translator] ⚠️ ${providers[0].name} failed:`, err.name, err.message);
                    if (err.name === "AbortError" || err.message.includes("Timeout")) {
                        return { result: "Error: ১০ সেকেন্ডের মধ্যে কোনো মডেল থেকে রেসপন্স পাওয়া যায়নি (Timeout)।", provider: null, model: null };
                    }
                    return { result: `Error: ${err.message}`, provider: null, model: null };
                }
            }

            // We have 2 providers.
            return new Promise((resolve) => {
                let resolved = false;
                let p1Finished = false, p1Result = null, p1Error = null;
                let p2Started = false, p2Finished = false, p2Result = null, p2Error = null;

                const checkState = () => {
                    if (resolved) return;

                    // 1. If P1 succeeded, return P1 immediately
                    if (p1Finished && !p1Error) {
                        resolved = true;
                        resolve(p1Result);
                        return;
                    }

                    // 2. If P1 failed, and P2 succeeded, return P2 immediately
                    if (p1Finished && !!p1Error && p2Finished && !p2Error) {
                        resolved = true;
                        const getErrMsg = (err) => err.name === "AbortError" || (err.message && err.message.includes("Timeout")) ? "Timeout" : err.message;
                        p2Result.fallbackReason = `${providers[0].name} failed - ${getErrMsg(p1Error)}`;
                        resolve(p2Result);
                        return;
                    }

                    // 3. If both failed
                    if (p1Finished && !!p1Error && p2Finished && !!p2Error) {
                        resolved = true;
                        const getErrMsg = (err) => err.name === "AbortError" || (err.message && err.message.includes("Timeout")) ? "Timeout" : err.message;
                        const errorMsg = `${providers[0].name} failed: ${getErrMsg(p1Error)} | ${providers[1].name} failed: ${getErrMsg(p2Error)}`;
                        resolve({ result: `Error: ${errorMsg}`, provider: null, model: null });
                        return;
                    }
                };

                const startP2 = () => {
                    if (p2Started || resolved) return;
                    p2Started = true;
                    const remainingTime = TOTAL_TIMEOUT_MS - (Date.now() - startTime);
                    if (remainingTime <= 0) return; // No time left for P2

                    console.log(`[AI Translator] Starting fallback ${providers[1].name} with timeout ${remainingTime}ms...`);
                    runProvider(providers[1], remainingTime)
                        .then(res => { p2Finished = true; p2Result = res; checkState(); })
                        .catch(err => { p2Finished = true; p2Error = err; checkState(); });
                };

                const startTime = Date.now();
                console.log(`[AI Translator] Starting primary ${providers[0].name} with timeout ${TOTAL_TIMEOUT_MS}ms...`);

                // Start P1
                runProvider(providers[0], TOTAL_TIMEOUT_MS)
                    .then(res => { p1Finished = true; p1Result = res; checkState(); })
                    .catch(err => { 
                        p1Finished = true; p1Error = err; 
                        console.warn(`[AI Translator] ⚠️ ${providers[0].name} failed:`, err.message);
                        startP2(); // Start P2 immediately if P1 fails
                        checkState(); 
                    });

                // Start P2 after head start if P1 hasn't finished
                setTimeout(() => {
                    if (!p1Finished) startP2();
                }, HEAD_START_MS);

                // DEADLINE: at 9.5s, if P1 is still not done but P2 successfully finished, return P2 to meet 10s deadline
                setTimeout(() => {
                    if (!resolved && !p1Finished && p2Finished && !p2Error) {
                        console.log(`[AI Translator] ⚠️ Primary provider took >9.5s. Using fallback response.`);
                        resolved = true;
                        p2Result.fallbackReason = `${providers[0].name} took too long (>9.5s)`;
                        resolve(p2Result);
                    }
                }, 9500);
            });

        } catch (error) {
            if (error.name === "AbortError") {
                return { result: "Error: ১০ সেকেন্ডের মধ্যে কোনো মডেল থেকে রেসপন্স পাওয়া যায়নি (Timeout)।", provider: null, model: null };
            }

            return { result: "Internal Error: " + error.message, provider: null, model: null };
        }
    })();

    // Cache the promise immediately so subsequent identical requests hook into it!
    translationCache.set(cacheKey, fetchPromise);
    if (translationCache.size > MAX_CACHE_SIZE) {
        const firstKey = translationCache.keys().next().value;
        translationCache.delete(firstKey);
    }

    return fetchPromise;
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "prefetch_translate") {
        const options = { systemPrompt: SYSTEM_PROMPT, isBanglaOutput: true };
        fetchTranslation(request.text, request.context, options).catch(err => console.error("[AI Translator] Prefetch failed:", err));
        sendResponse({ status: "prefetching" });
        return true;
    }

    if (request.action === "translate" || request.action === "translate_bn_en" || request.action === "grammar_check") {
        let options;
        if (request.action === "translate_bn_en") {
            options = { systemPrompt: SYSTEM_PROMPT_BN_EN, isBanglaOutput: false };
        } else if (request.action === "grammar_check") {
            options = { systemPrompt: SYSTEM_PROMPT_GRAMMAR_CHECK, isBanglaOutput: false };
        } else {
            options = { systemPrompt: SYSTEM_PROMPT, isBanglaOutput: true };
        }

        fetchTranslation(request.text, request.context, options)
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