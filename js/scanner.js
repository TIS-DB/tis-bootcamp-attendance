let scanner = null;
let isProcessing = false;

const POWER_AUTOMATE_URL = "PASTE_POWER_AUTOMATE_HTTP_URL_HERE";

window.onload = function () {
  const savedVolunteer = localStorage.getItem("tisVolunteerName");
  if (savedVolunteer) {
    document.getElementById("scannedBy").value = savedVolunteer;
  }
};

function showResult(type, message) {
  const box = document.getElementById("resultBox");
  box.className = "result " + type;
  box.innerHTML = message;
  box.classList.remove("hidden");
}

function startScanner() {
  const sessionName = document.getElementById("sessionName").value;
  const scannedBy = document.getElementById("scannedBy").value.trim();

  if (!sessionName) {
    showResult("error", "Please select a session first.");
    return;
  }

  if (!scannedBy) {
    showResult("error", "Please enter volunteer name.");
    return;
  }

  localStorage.setItem("tisVolunteerName", scannedBy);

  document.getElementById("startBtn").classList.add("hidden");
  document.getElementById("stopBtn").classList.remove("hidden");

  scanner = new Html5Qrcode("reader");

  scanner.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    },
    onScanSuccess,
    onScanFailure
  ).catch(() => {
    showResult("error", "Camera could not start. Please allow camera permission.");
    document.getElementById("startBtn").classList.remove("hidden");
    document.getElementById("stopBtn").classList.add("hidden");
  });
}

async function stopScanner() {
  if (scanner) {
    await scanner.stop();
    scanner.clear();
    scanner = null;
  }

  document.getElementById("startBtn").classList.remove("hidden");
  document.getElementById("stopBtn").classList.add("hidden");
}

async function onScanSuccess(decodedText) {
  if (isProcessing) return;

  isProcessing = true;

  const studentId = decodedText.trim();
  const sessionName = document.getElementById("sessionName").value;
  const scannedBy = document.getElementById("scannedBy").value.trim();

  showResult("success", "Scanning... please wait.");

  try {
    const response = await fetch(POWER_AUTOMATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        studentId: studentId,
        sessionName: sessionName,
        scannedBy: scannedBy
      })
    });

    const data = await response.json();

    if (data.status === "success") {
      showResult(
        "success",
        "✅ Attendance marked<br>" +
        "<b>Student:</b> " + data.studentName + "<br>" +
        "<b>ID:</b> " + studentId + "<br>" +
        "<b>Session:</b> " + sessionName
      );
    } else if (data.status === "duplicate") {
      showResult(
        "duplicate",
        "⚠️ Already marked<br>" +
        "<b>Student:</b> " + data.studentName + "<br>" +
        "<b>ID:</b> " + studentId + "<br>" +
        "<b>Session:</b> " + sessionName
      );
    } else {
      showResult(
        "error",
        "❌ Error<br>" + data.message
      );
    }

  } catch (error) {
    showResult(
      "error",
      "❌ Could not save attendance. Check internet or Power Automate URL."
    );
  }

  setTimeout(() => {
    isProcessing = false;
  }, 2500);
}

function onScanFailure(error) {
  // Ignore continuous scan failures.
}
