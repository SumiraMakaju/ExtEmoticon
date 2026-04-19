const toggle = document.getElementById("toggle");

chrome.storage.local.get("enabled", (data) => {
  const isEnabled = data.enabled !== undefined ? data.enabled : true;
  toggle.checked = isEnabled;
});



toggle.addEventListener("change", () => {
  const isEnabled = toggle.checked;

  chrome.storage.local.set({ enabled: isEnabled });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "TOGGLE",
        enabled: isEnabled
      });
    }
  });
});