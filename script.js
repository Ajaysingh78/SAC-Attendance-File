const scanner = new Html5Qrcode("reader");

Html5Qrcode.getCameras().then(devices => {
  if (devices && devices.length) {
    const cameraId = devices[0].id;  // Just use default (no force back cam)

    scanner.start(
      cameraId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      qrCodeMessage => {
        document.getElementById("status").innerText = "QR Detected. Opening Form...";
        window.location.href = qrCodeMessage;
      },
      errorMessage => {
        // You can ignore or log errors if needed
      }
    );
  } else {
    document.getElementById("status").innerText = "No camera found";
  }
}).catch(err => {
  document.getElementById("status").innerText = "Camera error: " + err;
});

// Gallery Image Scan Logic
document.getElementById("upload-btn").addEventListener("click", () => {
  document.getElementById("file-input").click();
});

document.getElementById("file-input").addEventListener("change", e => {
  if (e.target.files.length === 0) return;

  const file = e.target.files[0];
  const html5QrCode = new Html5Qrcode("reader");

  html5QrCode.scanFile(file, true)
    .then(decodedText => {
      document.getElementById("status").innerText = "QR Detected from Image. Redirecting...";
      window.location.href = decodedText;
    })
    .catch(err => {
      document.getElementById("status").innerText = "Failed to scan image: " + err;
    });
});
