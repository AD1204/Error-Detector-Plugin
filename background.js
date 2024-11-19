let failedRequests = [];
let consoleErrors = [];

// Listen for failed network requests
chrome.webRequest.onCompleted.addListener(
  function (details) {
    if (details.statusCode >= 400 && details.statusCode < 600) {
      failedRequests.unshift({
        type: "Network Request",
        url: details.url,
        statusCode: details.statusCode,
        timestamp: new Date().toISOString(),
      });
    }
  },
  { urls: ["<all_urls>"] }
);

// Listen for console errors from content script
// Cross-browser message listener
const runtime = typeof browser !== "undefined" ? browser : chrome;

runtime.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === "CONSOLE_ERROR") {
    consoleErrors.unshift(message.error); // Store the console error
  }

  if (message.type === "GET_LOGS") {
    sendResponse({ failedRequests, consoleErrors });
  }

  if (message.type === "CLEAR_LOGS") {
    failedRequests = [];
    consoleErrors = [];
    sendResponse({ status: "Logs cleared" });
  }
});

// To ensure we capture console errors in Firefox (especially for content script errors), 
// use `window.onerror` and send them to the background script.
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const errorDetails = {
      type: "CONSOLE_ERROR",
      error: {
        type: "Console Error",
        message: event.message,
        url: event.filename,
        timestamp: new Date().toISOString(),
      },
    };
    runtime.runtime.sendMessage(errorDetails);
  });
}

