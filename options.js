document.addEventListener('DOMContentLoaded', () => {
    const geminiKeyInput = document.getElementById('geminiKey');
    const groqKeyInput = document.getElementById('groqKey');
    const groqModelSelect = document.getElementById('groqModel');
    const geminiModelSelect = document.getElementById('geminiModel');
    const saveBtn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');
    const providerOptions = document.querySelectorAll('.provider-option');

    let activeProvider = 'gemini';

    // ── Load saved settings ──
    chrome.storage.local.get(['groqApiKey', 'geminiApiKey', 'activeProvider', 'groqModel', 'geminiModel'], (result) => {
        if (result.groqApiKey) {
            groqKeyInput.value = result.groqApiKey;
        }
        if (result.geminiApiKey) {
            geminiKeyInput.value = result.geminiApiKey;
        }
        if (result.activeProvider) {
            activeProvider = result.activeProvider;
        }
        if (result.groqModel) {
            groqModelSelect.value = result.groqModel;
        }
        if (result.geminiModel) {
            geminiModelSelect.value = result.geminiModel;
        }
        updateProviderUI(activeProvider);
    });

    // ── Provider toggle click ──
    providerOptions.forEach(option => {
        option.addEventListener('click', () => {
            activeProvider = option.dataset.provider;
            updateProviderUI(activeProvider);
        });
    });

    function updateProviderUI(provider) {
        providerOptions.forEach(opt => {
            if (opt.dataset.provider === provider) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });

        // Hide/show the respective key sections
        if (provider === 'gemini') {
            document.getElementById('geminiSection').classList.remove('hidden');
            document.getElementById('groqSection').classList.add('hidden');
        } else {
            document.getElementById('groqSection').classList.remove('hidden');
            document.getElementById('geminiSection').classList.add('hidden');
        }
    }

    // ── Save settings ──
    saveBtn.addEventListener('click', () => {
        const geminiKey = geminiKeyInput.value.trim();
        const groqKey = groqKeyInput.value.trim();

        // Validation
        if (!geminiKey && !groqKey) {
            showStatus('অন্তত একটা API key দিতে হবে!', 'error');
            return;
        }

        if (activeProvider === 'gemini' && !geminiKey) {
            showStatus('Gemini সিলেক্ট করেছ কিন্তু Gemini key দাওনি!', 'error');
            return;
        }

        if (activeProvider === 'groq' && !groqKey) {
            showStatus('Groq সিলেক্ট করেছ কিন্তু Groq key দাওনি!', 'error');
            return;
        }

        chrome.storage.local.set({
            groqApiKey: groqKey,
            geminiApiKey: geminiKey,
            activeProvider: activeProvider,
            groqModel: groqModelSelect.value,
            geminiModel: geminiModelSelect.value
        }, () => {
            showStatus('Settings saved successfully! ✨', 'success');
        });
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = type === 'error' ? 'status-error' : 'status-success';

        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = '';
        }, 3500);
    }
});