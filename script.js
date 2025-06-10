const scanner = new Html5Qrcode("reader");

Html5Qrcode.getCameras().then(devices => {
  if (devices && devices.length) {
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
        // You can log scan errors here if needed
      }
    );
  } else {
    document.getElementById("status").innerText = "No camera found";
  }
}).catch(err => {
  document.getElementById("status").innerText = "Camera error: " + err;
});

// Gallery Image Scan Logic
const uploadBtn = document.getElementById("upload-btn");
const fileInput = document.getElementById("file-input");

uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", e => {
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
