# AI Text Translator Extension

A powerful and intuitive Chrome extension designed to translate English internet content into highly natural, colloquial Bangladeshi Bengali. Rather than providing literal or academic translations, this extension acts like a "Bangladeshi buddy," explaining meanings, slang, and internet culture conversationally. It also features a dedicated Banglish-to-English translation mode.

## Features

- **Context-Aware In-Page Translation**: Simply select any text on a web page, click the floating magic icon (✨), and get a natural Bangla translation in a sleek, non-intrusive toast notification. The extension intelligently grabs surrounding context to ensure accurate meaning.
- **Dual-Mode Popup Interface**:
  - **EN ➡️ BN**: Quickly translate pasted or typed English text into conversational Bangla.
  - **Banglish ➡️ EN**: Translate Banglish (Bangla typed in Latin characters, e.g., "ami bhalo achi") into proper English.
  - The popup textarea auto-focuses upon opening for instant typing.
- **Multi-Provider Support**: Choose between **Google Gemini** (Recommended, better Bangla) and **Groq** (Faster) as your translation engine.
- **Smart Fallback Mechanism**: If your primary provider fails or hits a rate limit, the extension automatically falls back to the secondary provider to ensure you always get a translation.
- **Customizable Models**: Select from a variety of state-of-the-art AI models via the settings page (e.g., Gemini 3.1 Pro, Gemini 2.5 Flash, Llama 3.3 70B, Qwen3 32B, Gemma 4 31B, Gemma 3 27B).

## Installation

1. Clone or download this repository to your local machine.
2. Open your Chromium-based browser (Chrome, Edge, Brave, etc.) and go to the extensions page (`chrome://extensions/`).
3. Enable **Developer mode** (usually a toggle in the top right corner).
4. Click on **Load unpacked** and select the extension directory.
5. The extension should now be installed and visible in your browser toolbar!

## Configuration

To use the extension, you'll need to provide an API key for either Google Gemini or Groq (or both for fallback support). Both offer generous free tiers.

1. Right-click the extension icon in your browser toolbar and select **Options** (or click the gear icon if you have one).
2. **For Gemini (Recommended)**: Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey).
3. **For Groq**: Get a free API key from the [Groq Console](https://console.groq.com/keys).
4. Paste your key(s) into the respective fields in the settings page.
5. Select your preferred provider and model.
6. Click **Save Settings**.

## Usage

- **On a Web Page**: Highlight any English text. A floating ✨ icon will appear near your cursor. Click it to view the translation at the bottom right of your screen.
- **From the Popup**: Click the extension icon in your toolbar, select your desired tab (EN ➡️ BN or Banglish ➡️ EN), type or paste your text, and click **Translate**.

## Tech Stack

- Manifest V3
- Vanilla JavaScript
- Vanilla CSS
- Google Generative AI (Gemini) API & Groq API integrations
