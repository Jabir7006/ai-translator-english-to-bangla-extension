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
                // Formatting the response exactly like content.js does
                resultDiv.innerHTML = response.result.replace(/\n/g, "<br>");
            } else {
                resultDiv.innerHTML = "সার্ভার থেকে কোনো রেজাল্ট আসেনি।";
            }
        }
    );
});