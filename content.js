// Listen for console errors and send them to the background
window.addEventListener("error", (event) => {
  const errorDetails = {
    type: "CONSOLE_ERROR",
    error: {
      type: "Console Error",
      message: event.message,
      url: event.filename,
      timestamp: new Date().toISOString(),
    },
  };
  chrome.runtime.sendMessage(errorDetails);
});
