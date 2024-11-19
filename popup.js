document.addEventListener("DOMContentLoaded", () => {
  const logsContainer = document.getElementById("logs");
  const filterInput = document.getElementById("filterInput");
  const filterSelect = document.getElementById("filterSelect");
  const clearButton = document.getElementById("clearButton");
  const downloadButton = document.getElementById("downloadButton");
  const closePopup = document.getElementById("closePopup");

  const sendMessageToBackground = (message, callback) => {
    // Use 'chrome' or 'browser' API based on the browser
    if (typeof browser !== 'undefined') {
      // Firefox
      browser.runtime.sendMessage(message).then(callback);
    } else {
      // Chrome
      chrome.runtime.sendMessage(message, callback);
    }
  };

  const fetchLogs = () => {
    sendMessageToBackground({ type: "GET_LOGS" }, (response) => {
      const allLogs = [...response.failedRequests, ...response.consoleErrors];
      displayLogs(allLogs);
    });
  };

  const displayLogs = (logs) => {
    logsContainer.innerHTML = "";

    if (logs.length === 0) {
      logsContainer.innerHTML = '<p class="no-results">No logs available or no results found.</p>';
    } else {
      logs.forEach((log) => {
        const logDiv = document.createElement("div");
        logDiv.classList.add("log");
        logDiv.classList.add(log.type === "Network Request" ? "request" : "error");

        logDiv.innerHTML = `
          <strong>${log.type}</strong><br>
          <strong>Message:</strong> ${highlightSearchTerm(log.message || log.url)}<br>
          <strong>Status:</strong> ${log.statusCode || "N/A"}<br>
          <small>${log.timestamp}</small>
        `;
        logsContainer.appendChild(logDiv);
      });
    }
  };
  
    const highlightSearchTerm = (text) => {
    const searchTerm = filterInput.value.toLowerCase();
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(regex, '<span class="highlight">$1</span>');
  };

  const filterLogs = () => {
    const searchTerm = filterInput.value.toLowerCase();
    const filterType = filterSelect.value;

    sendMessageToBackground({ type: "GET_LOGS" }, (response) => {
      let filteredLogs = [...response.failedRequests, ...response.consoleErrors];

      if (filterType === "console") {
        filteredLogs = response.consoleErrors;
      } else if (filterType === "network") {
        filteredLogs = response.failedRequests;
      }

      filteredLogs = filteredLogs.filter((log) =>
        JSON.stringify(log).toLowerCase().includes(searchTerm)
      );

      displayLogs(filteredLogs);
    });
  };

  filterInput.addEventListener("input", filterLogs);
  filterSelect.addEventListener("change", filterLogs);

  clearButton.addEventListener("click", () => {
    sendMessageToBackground({ type: "CLEAR_LOGS" }, fetchLogs);
  });

  downloadButton.addEventListener("click", () => {
    sendMessageToBackground({ type: "GET_LOGS" }, (response) => {
      const csvContent = ["Type,Message,Status,Timestamp\n"];
      [...response.failedRequests, ...response.consoleErrors].forEach((log) => {
        csvContent.push(
          `${log.type},"${log.message || log.url}",${log.statusCode || "N/A"},"${log.timestamp}"`
        );
      });
      const blob = new Blob([csvContent.join("\n")], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "error_logs.csv";
      link.click();
    });
  });

  closePopup.addEventListener("click", () => {
    window.close();
  });

  fetchLogs();
});
