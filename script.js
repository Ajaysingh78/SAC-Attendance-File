const scanner = new Html5Qrcode("reader");

Html5Qrcode.getCameras()
  .then(devices => {
    if (devices && devices.length) {
      // Prefer rear camera if available
      const backCamera = devices.find(device => device.label.toLowerCase().includes("back")) || devices[0];

      scanner.start(
        backCamera.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          facingMode: "environment"
        },
        qrCodeMessage => {
          document.getElementById("status").innerText = "QR Detected. Opening Form...";
          window.location.href = qrCodeMessage;
        },
        errorMessage => {
          // Just ignore scan errors (common)
        }
      );
    } else {
      document.getElementById("status").innerText = "No camera found on this device.";
    }
  })
  .catch(err => {
    document.getElementById("status").innerText = "Camera error: " + err;
    console.error("Camera load error:", err);
  });
