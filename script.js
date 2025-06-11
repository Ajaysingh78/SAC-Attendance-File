window.onload = function () {
    const video = document.getElementById('video');
    const canvasElement = document.getElementById('canvas');
    const canvas = canvasElement.getContext('2d');
    const fileInput = document.getElementById('file-input');
    const statusText = document.getElementById('status');
    const qrResult = document.getElementById('qr-result');
    const startBtn = document.getElementById('start-btn');
    const scannerSection = document.getElementById('scanner-section');

    const collegeLatitude = 23.1854;
    const collegeLongitude = 77.3271;
    const allowedDistanceKm = 0.2; 

    function getDistanceKm(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1 * Math.PI / 180) *
                  Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    startBtn.addEventListener('click', () => {
        statusText.textContent = '📍 Checking location...';
        navigator.geolocation.getCurrentPosition(position => {
            const d = getDistanceKm(position.coords.latitude, position.coords.longitude, collegeLatitude, collegeLongitude);
            if (d <= allowedDistanceKm) {
                statusText.textContent = '✅ You're on campus. Scanner started.';
                scannerSection.style.display = 'block';
                startScanner();
            } else {
                statusText.textContent = '❌ You are not within college campus.';
                alert('You need to be at IES College of Technology to mark attendance.');
            }
        }, () => {
            statusText.textContent = '❌ Location permission denied.';
            alert('Please allow location access to continue.');
        });
    });

    function startScanner() {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
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
            const data = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const code = jsQR(data.data, data.width, data.height, { inversionAttempts: 'dontInvert' });
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

    fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                canvasElement.width = img.width;
                canvasElement.height = img.height;
                canvas.drawImage(img, 0, 0);
                const data = canvas.getImageData(0, 0, img.width, img.height);
                const code = jsQR(data.data, data.width, data.height);
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
