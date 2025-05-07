chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getDuration') {
    (async () => {
      try {
        const res = await fetch(message.url);
        const html = await res.text();
        const match = html.match(/(\d+)h(?:\s?(\d+))?min/);
        if (match) {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2] || "0");
          const total = hours * 60 + minutes;
          sendResponse({ durationMinutes: total });
        } else {
          sendResponse({ durationMinutes: 90 });
        }
      } catch (e) {
        sendResponse({ durationMinutes: 90 });
      }
    })();
    return true;
  }
});