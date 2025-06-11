window.onload = function () {
    // SAC Scanner with Location Check Enabled

    const video = document.getElementById('video');
    const canvasElement = document.getElementById('canvas');
    const canvas = canvasElement.getContext('2d');
    const fileInput = document.getElementById('file-input');
    const statusText = document.getElementById('status');
    const qrResult = document.getElementById('qr-result');

    const startBtn = document.getElementById('start-btn');
    const scannerSection = document.getElementById('scanner-section');

    // ✅ Set your college latitude and longitude
    const collegeLatitude = 22.1800;
    const collegeLongitude = 75.6300;
    const allowedDistance = 0.2; // in kilometers (200 meters)

    // 📍 Helper function to calculate distance between 2 lat/lng
    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    startBtn.addEventListener('click', () => {
        statusText.textContent = '📍 Checking location...';

        // 🔐 Ask for location permission
        navigator.geolocation.getCurrentPosition((position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            const distance = getDistanceFromLatLonInKm(userLat, userLon, collegeLatitude, collegeLongitude);

            if (distance <= allowedDistance) {
                statusText.textContent = '✅ Location verified. Starting scanner...';
                scannerSection.style.display = 'block';
                startScanner();
            } else {
                statusText.textContent = `❌ You are not within college location.`;
                alert("Access denied. Please be at your college to mark attendance.");
            }
        }, (error) => {
            statusText.textContent = '❌ Location permission denied.';
            alert("Location access is required to proceed.");
        });
    });

    function startScanner() {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then((stream) => {
                video.srcObject = stream;
                video.setAttribute('playsinline', true);
                video.play();
                requestAnimationFrame(tick);
            });
    }

    function tick() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
            if (code) {
                qrResult.textContent = `QR Code: ${code.data}`;
                window.location.href = code.data;
            } else {
                requestAnimationFrame(tick);
            }
        } else {
            requestAnimationFrame(tick);
        }
    }

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
                    qrResult.textContent = `QR Code: ${code.data}`;
                    window.location.href = code.data;
                } else {
                    qrResult.textContent = 'No QR code found.';
                }
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
};
