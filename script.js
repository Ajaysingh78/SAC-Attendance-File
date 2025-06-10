
window.onload = function () {
    // script.js (Test version without location check)

    const video = document.getElementById('video');
    const canvasElement = document.getElementById('canvas');
    const canvas = canvasElement.getContext('2d');
    const fileInput = document.getElementById('file-input');
    const statusText = document.getElementById('status');
    const qrResult = document.getElementById('qr-result');

    // Directly show scanner section without checking location
    document.getElementById('start-btn').addEventListener('click', () => {
        statusText.textContent = '📡 Scanner started...';
        document.getElementById('scanner-section').style.display = 'block';
        startScanner();
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

    // pura tera code yahan daal de
};
