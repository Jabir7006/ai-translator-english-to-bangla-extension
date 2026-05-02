document.getElementById("translateBtn").addEventListener("click", () => {
    const text = document.getElementById("inputText").value.trim();
    const resultDiv = document.getElementById("result");
    const loader = document.getElementById("loader");

    if (!text) return;

    // Reset UI state
    resultDiv.style.display = "none";
    resultDiv.innerHTML = "";
    loader.style.display = "block";

    // Send the message to your existing background.js
    chrome.runtime.sendMessage(
        {
            action: "translate",
            text: text,
            context: "Direct user input via extension popup." // Provides default context
        },
        (response) => {
            loader.style.display = "none";
            resultDiv.style.display = "block";

            if (chrome.runtime.lastError) {
                resultDiv.innerHTML = "Error: " + chrome.runtime.lastError.message;
                return;
            }

            if (response?.result) {
                let html = response.result.replace(/\n/g, "<br>");

                if (response.provider) {
                    const icon = response.provider === "gemini" ? "✦" : "⚡";
                    const label = response.provider === "gemini" ? "Gemini" : "Groq";
                    const color = response.provider === "gemini" ? "#89b4fa" : "#a6e3a1";
                    const bg = response.provider === "gemini"
                        ? "rgba(137,180,250,0.12)"
                        : "rgba(166,227,161,0.12)";
                    html += `<br><span style="display:inline-block;margin-top:8px;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;color:${color};background:${bg};border:1px solid ${color}33;">${icon} ${label}</span>`;
                }

                resultDiv.innerHTML = html;
            } else {
                resultDiv.innerHTML = "সার্ভার থেকে কোনো রেজাল্ট আসেনি।";
            }
        }
    );
});