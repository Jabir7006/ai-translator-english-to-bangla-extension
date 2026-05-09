
////////////////////////////////////////////////////////////////////////////////
// CONTENT SCRIPT
////////////////////////////////////////////////////////////////////////////////

if (!window.hasInjectedAI) {
    window.hasInjectedAI = true;

    const rootContainer = document.createElement("div");
    const shadow = rootContainer.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
        .float-btn {
            position: absolute;
            background: #1e1e2e;
            border: 1px solid #cba6f7;
            color: #cba6f7;
            padding: 6px 10px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 2147483647;
            display: none;
            transition: transform 0.1s;
            user-select: none;
        }

        .float-btn:hover {
            transform: scale(1.08);
            background: #313244;
        }

        .ai-toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #1e1e2e;
            color: #cdd6f4;
            padding: 24px 24px 18px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.6);
            font-family: system-ui, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            max-width: 460px;
            z-index: 2147483647;
            display: none;
            border: 1px solid #313244;
        }

        .ai-toast b {
            color: #f9e2af;
        }

        .close-btn {
            position: absolute;
            top: 8px;
            right: 12px;
            cursor: pointer;
            color: #f38ba8;
            font-weight: bold;
            font-size: 18px;
            padding: 2px 6px;
            border-radius: 4px;
        }

        .close-btn:hover {
            background: rgba(243, 139, 168, 0.1);
        }

        .toast-content {
            margin-top: 5px;
        }

        .provider-tag {
            display: inline-block;
            margin-top: 10px;
            padding: 3px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.3px;
        }
        .provider-tag.gemini {
            background: rgba(137, 180, 250, 0.12);
            color: #89b4fa;
            border: 1px solid rgba(137, 180, 250, 0.25);
        }
        .provider-tag.groq {
            background: rgba(166, 227, 161, 0.12);
            color: #a6e3a1;
            border: 1px solid rgba(166, 227, 161, 0.25);
        }
    `;
    shadow.appendChild(style);

    const floatBtn = document.createElement("div");
    floatBtn.className = "float-btn";
    floatBtn.innerHTML = "✨";
    shadow.appendChild(floatBtn);

    const toast = document.createElement("div");
    toast.className = "ai-toast";

    const closeBtn = document.createElement("span");
    closeBtn.className = "close-btn";
    closeBtn.innerHTML = "✕";
    closeBtn.addEventListener("click", () => {
        toast.style.display = "none";
    });

    const toastContent = document.createElement("div");
    toastContent.className = "toast-content";

    toast.appendChild(closeBtn);
    toast.appendChild(toastContent);
    shadow.appendChild(toast);

    document.body.appendChild(rootContainer);

    let textToTranslate = "";
    let contextToSend = "";

    function normalizeSelectedText(text) {
    if (!text) return "";

    let cleaned = text.trim();

    // multiple spaces remove
    cleaned = cleaned.replace(/\s+/g, " ");

    // common spoken English patterns fix
    cleaned = cleaned.replace(/\byou don't man\b/gi, "you don't, man");
    cleaned = cleaned.replace(/\bi know man\b/gi, "I know, man");
    cleaned = cleaned.replace(/\btrust me man\b/gi, "trust me, man");
    cleaned = cleaned.replace(/\bcome on man\b/gi, "come on, man");
    cleaned = cleaned.replace(/\bnah man\b/gi, "nah, man");
    cleaned = cleaned.replace(/\byeah man\b/gi, "yeah, man");

    return cleaned;
}

    function getSelectionContext() {
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
            return "";
        }

        const selectedText = selection.toString().trim();
        if (!selectedText) {
            return "";
        }

        let node = selection.getRangeAt(0).commonAncestorContainer;

        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }

        if (!node) return "";

        // সবচেয়ে কাছের meaningful block খুঁজবো
        const meaningfulParent =
            node.closest?.(
                "p, div, article, section, li, blockquote, td, span"
            ) || node;

        let context =
            meaningfulParent.innerText ||
            meaningfulParent.textContent ||
            "";

        context = context.replace(/\s+/g, " ").trim();

        // selected text remove করে দেবো যাতে model confuse না হয়
        if (selectedText && context.includes(selectedText)) {
            context = context.replace(selectedText, "").trim();
        }

        // খুব বড় context কেটে দিচ্ছি
        if (context.length > 300) {
            context = context.slice(0, 300) + "...";
        }

        return context;
    }

    document.addEventListener("mouseup", (e) => {
        if (shadow.contains(e.target)) return;

        setTimeout(() => {
            const selectedText = window
                .getSelection()
                .toString()
                .trim();

            if (!selectedText || selectedText.length < 2) {
                floatBtn.style.display = "none";
                return;
            }

            textToTranslate = normalizeSelectedText(selectedText);
            contextToSend = getSelectionContext();

            console.log("TEXT:", textToTranslate);
            console.log("CONTEXT:", contextToSend);

            // We no longer prefetch on highlight to save API quota.
            // It will be prefetched when the user hovers over the button instead.

            floatBtn.style.top = `${e.pageY + 10}px`;
            floatBtn.style.left = `${e.pageX + 10}px`;
            floatBtn.style.display = "block";
        }, 20);
    });

    let hasPrefetchedForCurrentText = false;

    floatBtn.addEventListener("mouseenter", () => {
        if (!textToTranslate || hasPrefetchedForCurrentText) return;
        
        hasPrefetchedForCurrentText = true;
        // ✨ Speculative Prefetch on Hover!
        // Gives the API a 150ms - 400ms head start before the user actually clicks.
        try {
            if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) return;
            chrome.runtime.sendMessage({
                action: "prefetch_translate",
                text: textToTranslate,
                context: contextToSend
            });
        } catch (e) {}
    });

    floatBtn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();

        floatBtn.style.display = "none";
        hasPrefetchedForCurrentText = false; // Reset for the next translation

        if (!textToTranslate) return;

        toastContent.innerHTML =
            "🤖 অর্থ বুঝে স্বাভাবিক বাংলায় অনুবাদ করছি...";
        toast.style.display = "block";

        try {
            if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
                throw new Error("Extension context invalidated");
            }
            
            chrome.runtime.sendMessage(
                {
                    action: "translate",
                    text: textToTranslate,
                    context: contextToSend
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        toastContent.innerHTML =
                            "Internal Error: " +
                            chrome.runtime.lastError.message;
                        return;
                    }

                    if (response?.result) {
                        let html = response.result.replace(
                            /\n/g,
                            "<br>"
                        );

                        if (response.provider) {
                            const icon = response.provider === "gemini" ? "✦" : "⚡";
                            const label = response.provider === "gemini" ? "Gemini" : "Groq";
                            const modelText = response.model ? ` • ${response.model}` : "";
                            html += `<br><span class="provider-tag ${response.provider}">${icon} ${label}${modelText}</span>`;
                        }
                        
                        if (response.fallbackReason) {
                            html += `<div style="font-size: 11px; color: #f38ba8; margin-top: 8px; border-top: 1px solid #313244; padding-top: 6px;">⚠️ Fallback triggered: ${response.fallbackReason}</div>`;
                        }

                        toastContent.innerHTML = html;
                    } else {
                        toastContent.innerHTML =
                            "সার্ভার থেকে কোনো রেজাল্ট আসেনি।";
                    }
                }
            );
        } catch (e) {
            console.error("SendMessage error:", e);
            const errMsg = e.message || "";
            if (errMsg.includes("Extension context invalidated") || errMsg.includes("Cannot read properties of undefined")) {
                toastContent.innerHTML = "এক্সটেনশন আপডেট হয়েছে। দয়া করে <b>পেজটি রিলোড</b> করুন। (Please refresh the page)";
            } else {
                toastContent.innerHTML = "Error: " + errMsg;
            }
        }
    });
}