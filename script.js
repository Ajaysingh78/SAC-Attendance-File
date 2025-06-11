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
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    startBtn.addEventListener('click', () => {
        statusText.textContent = '📍 Checking location...';
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
                    statusText.textContent = '❌ You are not at the college campus.';
                    alert('You must be on campus to mark attendance.');
                }
            },
            (err) => {
                console.error('Location error:', err.message);
                statusText.textContent = '❌ Location permission denied.';
                alert('Please allow location access to continue.');
            }
        );
    });

    function startScanner() {
        navigator.mediaDevices
            .getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' }, // fallback support
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })
            .then((stream) => {
                video.srcObject = stream;
                video.setAttribute('playsinline', true);
                video.play();
                requestAnimationFrame(tick);
            })
            .catch((err) => {
                console.error('Camera Error:', err.message);
                statusText.textContent = '❌ Camera access failed. ' + err.message;
                alert('Camera not accessible. Please check permissions or try another browser.');
            });
    }

    function tick() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
            });
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
