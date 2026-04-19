const style = document.createElement("style");
style.textContent = `
  .sentiment-positive {
    border-left: 4px solid #22c55e !important;
    background-color: rgba(34, 197, 94, 0.08) !important;
    border-radius: 4px;
    padding-left: 8px !important;
    transition: background-color 0.3s ease;
  }
  .sentiment-negative {
    border-left: 4px solid #ef4444 !important;
    background-color: rgba(239, 68, 68, 0.08) !important;
    border-radius: 4px;
    padding-left: 8px !important;
    transition: background-color 0.3s ease;
  }
  .sentiment-neutral {
    border-left: 4px solid #9ca3af !important;
    background-color: rgba(156, 163, 175, 0.05) !important;
    border-radius: 4px;
    padding-left: 8px !important;
    transition: background-color 0.3s ease;
  }
  .sentiment-loading {
    border-left: 4px solid #facc15 !important;
    background-color: rgba(250, 204, 21, 0.05) !important;
    border-radius: 4px;
    padding-left: 8px !important;
  }
`;
document.head.appendChild(style);


chrome.storage.local.get("enabled", (data) => {
  isEnabled = data.enabled !== undefined ? data.enabled : true;
  if (isEnabled) startObserving();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TOGGLE") {
    isEnabled = message.enabled;
    if (isEnabled) startObserving();
    else removeAllHighlights();
  }
});

function startObserving() {
  const observer = new MutationObserver(() => highlightComments());
  observer.observe(document.body, { childList: true, subtree: true });
  highlightComments();
}

function highlightComments() {
  const commentElements = document.querySelectorAll("yt-attributed-string#content-text");

  commentElements.forEach((el) => {
    if (el.dataset.sentimentDone === "true") return;
    el.dataset.sentimentDone = "true";

    const text = el.innerText.trim();
    if (!text) return;

    el.classList.add("sentiment-loading");

    chrome.runtime.sendMessage({ type: "GET_SENTIMENT", text }, (response) => {
      if (response) applyColor(el, response.sentiment);
    });
  });
}

function applyColor(el, sentiment) {
  el.classList.remove("sentiment-loading", "sentiment-positive", "sentiment-negative", "sentiment-neutral");
  if (sentiment === "positive") el.classList.add("sentiment-positive");
  else if (sentiment === "negative") el.classList.add("sentiment-negative");
  else el.classList.add("sentiment-neutral");
}

function removeAllHighlights() {
  document.querySelectorAll("yt-attributed-string#content-text").forEach((el) => {
    el.classList.remove("sentiment-positive", "sentiment-negative", "sentiment-neutral", "sentiment-loading");
    el.dataset.sentimentDone = "false";
  });
}