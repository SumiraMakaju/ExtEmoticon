const HF_TOKEN = CONFIG.HF_TOKEN; 

const MODEL_URL = "https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment-latest";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_SENTIMENT") {
    fetchSentiment(message.text).then(sendResponse);
    return true;
  }
});

async function fetchSentiment(text) {
  try {

    const cleanText = text
      .replace(/https?:\/\/\S+/g, "")     // remove URLs
      .replace(/@\w+/g, "@user")           // anonymize mentions
      .trim();

    if (!cleanText) return { sentiment: "neutral" };

    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: cleanText })
    });

    const rawText = await response.text();

    if (response.status === 503) {
      console.log("Model loading, retrying in 10s...");
      await new Promise(r => setTimeout(r, 10000));
      return fetchSentiment(text); // retry once
    }

    const result = JSON.parse(rawText);

   if (result && result[0]) {
      const best = result[0].reduce((a, b) => a.score > b.score ? a : b);

      // Lower threshold to 0.55 — social media text is messier
      if (best.score < 0.55) return { sentiment: "neutral" };
      if (best.label === "positive") return { sentiment: "positive" };
      if (best.label === "negative") return { sentiment: "negative" };
      return { sentiment: "neutral" };
    }

    return { sentiment: "neutral" };
  } catch (err) {
    console.error("HF API error:", err.message);
    return { sentiment: "neutral" };
  }
}