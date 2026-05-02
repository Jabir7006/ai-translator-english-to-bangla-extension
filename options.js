document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveBtn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');

    // 1. Load the existing key when the page opens
    chrome.storage.local.get(['groqApiKey'], (result) => {
        if (result.groqApiKey) {
            apiKeyInput.value = result.groqApiKey;
        }
    });

    // 2. Save the key when the button is clicked
    saveBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        
        chrome.storage.local.set({ groqApiKey: key }, () => {
            // Show a success message
            statusDiv.textContent = 'API Key saved successfully! ✨';
            
            // Clear the message after 3 seconds
            setTimeout(() => {
                statusDiv.textContent = '';
            }, 3000);
        });
    });
});