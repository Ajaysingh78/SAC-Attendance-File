window.onload = function () {
  const video = document.getElementById('video');
  const canvasElement = document.getElementById('canvas');
  const canvas = canvasElement.getContext('2d');
  const fileInput = document.getElementById('file-input');
  const statusText = document.getElementById('status');
  const qrResult = document.getElementById('qr-result');
  const startBtn = document.getElementById('start-btn');
  const scannerSection = document.getElementById('scanner-section');
  const toggleBtn = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");

  const collegeLatitude = 23.1854;
  const collegeLongitude = 77.3271;
  const allowedDistanceKm = 0.5;

  const redirectParam = new URLSearchParams(window.location.search).get("redirect");

  // 🔹 Toggle Hamburger Menu
  toggleBtn.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });

  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("show");
    });
  });

  // 🔹 If redirected (location check)
  if (redirectParam) {
    statusText.textContent = '📍 Checking your location...';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const dist = getDistanceKm(
          position.coords.latitude,
          position.coords.longitude,
          collegeLatitude,
          collegeLongitude
        );
        if (dist <= allowedDistanceKm) {
          statusText.textContent = '✅ Inside campus. Redirecting...';
          console.log("Redirecting to:", decodeURIComponent(redirectParam));
          window.location.href = decodeURIComponent(redirectParam);
        } else {
          statusText.textContent = '❌ You are not inside the campus.';
          alert(`You are ${Math.round(dist * 1000)} meters away from campus. Access denied.`);
        }
      },
      (error) => {
        alert("❌ Location permission required to proceed.");
        statusText.textContent = '❌ Location error.';
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return;
  }

  // 🔹 Distance calculation
  function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // 🔹 Start Button
  startBtn.addEventListener('click', () => {
    statusText.textContent = '📍 Checking your location...';
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      statusText.textContent = '❌ Geolocation not supported.';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const dist = getDistanceKm(
          position.coords.latitude,
          position.coords.longitude,
          collegeLatitude,
          collegeLongitude
        );

        if (dist <= allowedDistanceKm) {
          statusText.textContent = '✅ On Campus. Starting Scanner...';
          scannerSection.style.display = 'block';
          startScanner();
        } else {
          statusText.textContent = '❌ You are not inside campus.';
          alert(`You are ${Math.round(dist * 1000)} meters away from campus. Attendance not allowed.`);
        }
      },
      (error) => {
        console.error("Location Error:", error);
        alert("Location permission is required. Please allow location and refresh the page.");
        statusText.textContent = '❌ Location permission denied.';
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

  // 🔹 Device ID
  function getDeviceId() {
    let id = localStorage.getItem("device_id");
    if (!id) {
      id = "dev-" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("device_id", id);
    }
    return id;
  }

  // 🔹 Extract Email from QR (for device check)
  function extractEmailFromQR(url) {
    try {
      const params = new URLSearchParams(new URL(url).search);
      const email = params.get("entry.1361914762"); 
      if (email) return decodeURIComponent(email).trim().toLowerCase();
      const possibleKeys = ['entry.877086558', 'email'];
      for (const k of possibleKeys) {
        const v = params.get(k);
        if (v) return decodeURIComponent(v).trim().toLowerCase();
      }
      const match = url.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      return match ? match[0].toLowerCase() : null;
    } catch (e) {
      return null;
    }
  }

  // 🔹 Verify Device + Redirect
  function verifyDeviceAndRedirect(qrURL) {
    console.log("Scanned QR URL:", qrURL);
    const email = extractEmailFromQR(qrURL);
    const deviceId = getDeviceId();

    // 🚀 Direct open form (skip firebase issue)
    if (qrURL.includes("docs.google.com/forms")) {
      window.location.href = `?redirect=${encodeURIComponent(qrURL)}`;
      return;
    }

    if (!email) {
      alert("❌ Email not found in QR. Please check QR content.");
      return;
    }

    // ✅ Firebase check (agar tum Firebase use kar rahe ho)
    if (typeof db !== "undefined") {
      db.collection("registrations").doc(email).get().then((docSnap) => {
        if (!docSnap.exists) {
          db.collection("registrations").doc(email).set({
            deviceId: deviceId,
            createdAt: Date.now()
          }).then(() => {
            window.location.href = `?redirect=${encodeURIComponent(qrURL)}`;
          });
        } else {
          const savedDevice = docSnap.data().deviceId;
          if (savedDevice === deviceId) {
            window.location.href = `?redirect=${encodeURIComponent(qrURL)}`;
          } else {
            alert("❌ Unauthorized Device! This email is already used on another device.");
            qrResult.textContent = "❌ Access denied: Device mismatch.";
          }
        }
      });
    } else {
      // agar firebase connected nahi hai to direct redirect
      window.location.href = `?redirect=${encodeURIComponent(qrURL)}`;
    }
  }

  // 🔹 Start Scanner
  function startScanner() {
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } }
    }).then((stream) => {
      video.srcObject = stream;
      video.setAttribute('playsinline', true);
      video.play();
      requestAnimationFrame(tick);
    }).catch((err) => {
      console.error("Camera Error:", err);
      alert("Camera access failed. Please check your browser permissions.");
      statusText.textContent = '❌ Camera access failed.';
    });
  }

  // 🔹 QR Detection (Camera)
  function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvasElement.height = video.videoHeight;
      canvasElement.width = video.videoWidth;
      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
      const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
      if (code) {
        qrResult.textContent = `✅ QR Code: ${code.data}`;
        verifyDeviceAndRedirect(code.data);
      } else {
        requestAnimationFrame(tick);
      }
    } else {
      requestAnimationFrame(tick);
    }
  }

  // 🔹 File Upload QR
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      const img = new Image();
      img.onload = function () {
        canvasElement.width = img.width;
        canvasElement.height = img.height;
        canvas.drawImage(img, 0, 0);
        const imageData = canvas.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          qrResult.textContent = `✅ QR Code: ${code.data}`;
          verifyDeviceAndRedirect(code.data);
        } else {
          qrResult.textContent = '❌ No QR code found.';
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
};
