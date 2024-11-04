let instanceCanvas, instanceCtx;
let animationFrameId;
const numPoints = 50;
let points = [];
let phase = 0;
let cycleLength = 500; // Fixed cycle length, can be adjusted
let cycleStartTime = 0;
let lastVolume = 0;
let isCallInProgress = false;
var vapiInstance = null;
const assistant = "4f171c59-5568-4068-9b49-68627df5ef8d"; // Substitute with your assistant ID
const apiKey = "e5b480bb-ef0b-40b3-9de6-9069088d7bce"; // Substitute with your Public key from Vapi Dashboard.
const buttonConfig = {}; // Modify this as required

document.addEventListener('DOMContentLoaded', function () {
    initializeInstanceCanvas();
    // initializeVapi();
    // addDakotaEventListenersIfExist();
    generatePoints();
});

(function (d, t) {
    var g = document.createElement(t),
        s = d.getElementsByTagName(t)[0];
    // g.src =
    //     "https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js";
    g.src = "vapi_sdk.js";
    g.defer = true;
    g.async = true;
    s.parentNode.insertBefore(g, s);

    g.onload = function () {
        vapiInstance = window.vapiSDK.run({
            apiKey: apiKey, // mandatory
            assistant: assistant, // mandatory
            config: buttonConfig, // optional
        });

        // Set up event listeners for vapi instance
        vapiInstance.on("speech-start", () => {
            console.log("Instance speech has started.");
            isCallInProgress = true;
            showCanvasContainer();
            startInstanceVisualization();
        });

        vapiInstance.on("volume-level", (volume) => {
            updateVolumeData(volume);
        });

        vapiInstance.on("speech-end", () => {
            isCallInProgress = false;
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            hideCanvasContainer();
        });

    };
})(document, "script");

function hideCanvasContainer() {
    const canvasContainer = document.getElementById('instanceCanvasContainer');
    if (canvasContainer) {
        canvasContainer.classList.remove('d-block');
        canvasContainer.classList.add('d-none');
    }
}

function showCanvasContainer() {
    const canvasContainer = document.getElementById('instanceCanvasContainer');
    if (canvasContainer) {
        canvasContainer.classList.remove('d-none');
        canvasContainer.classList.add('d-block');
    }
}


function updateVolumeData(volume) {
    lastVolume = volume;
    generatePoints(volume);
}

function generatePoints(volume = 1) {
    const maxAmplitude = 300 * volume;
    points = Array(numPoints).fill(0).map((_, i) => {
        if (i % 5 === 0) return 0;
        return Math.random() * maxAmplitude;
    });

    for (let i = 0; i < 3; i++) {
        points = smoothPoints(points);
    }

    for (let i = 0; i < 10; i++) {
        const rampFactor = i / 10;
        points[i] *= rampFactor;
        points[numPoints - 1 - i] *= rampFactor;
    }

    for (let i = 0; i < numPoints; i += 5) {
        points[i] = 0;
    }
}

function smoothPoints(arr) {
    return arr.map((point, index, array) => {
        if (index % 10 === 0) return 0;
        if (index === 0) return (point + array[1]) / 2;
        if (index === array.length - 1) return (point + array[array.length - 2]) / 2;
        return (array[index - 1] + point + array[index + 1]) / 3;
    });
}

function drawWaveform(progress, canvas, ctx) {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerY = canvas.height / 2;
    const scaleFactor = 0.8;

    ctx.beginPath();
    ctx.moveTo(0, centerY);

    // Draw top half of the wave
    for (let i = 0; i < numPoints - 1; i++) {
        const x1 = (i / (numPoints - 1)) * canvas.width;
        const x2 = ((i + 1) / (numPoints - 1)) * canvas.width;
        const y1 = centerY - points[i] * Math.sin(progress * Math.PI) * scaleFactor;
        const y2 = centerY - points[i + 1] * Math.sin(progress * Math.PI) * scaleFactor;
        const xMid = (x1 + x2) / 2;
        const yMid = (y1 + y2) / 2;
        ctx.quadraticCurveTo(x1, y1, xMid, yMid);
    }
    ctx.quadraticCurveTo(canvas.width, centerY - points[numPoints - 1] * Math.sin(progress * Math.PI) * scaleFactor, canvas.width, centerY);

    // Draw bottom half of the wave (mirror image)
    for (let i = numPoints - 1; i > 0; i--) {
        const x1 = (i / (numPoints - 1)) * canvas.width;
        const x2 = ((i - 1) / (numPoints - 1)) * canvas.width;
        const y1 = centerY + points[i] * Math.sin(progress * Math.PI) * scaleFactor;
        const y2 = centerY + points[i - 1] * Math.sin(progress * Math.PI) * scaleFactor;
        const xMid = (x1 + x2) / 2;
        const yMid = (y1 + y2) / 2;
        ctx.quadraticCurveTo(x1, y1, xMid, yMid);
    }
    ctx.quadraticCurveTo(0, centerY + points[0] * Math.sin(progress * Math.PI) * scaleFactor, 0, centerY);

    ctx.closePath();
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Always draw the base line if a call is in progress
    if (isCallInProgress) {
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    console.log('Waveform drawn');
}

function animate(currentTime, canvas, ctx) {
    if (isCallInProgress) {
        if (cycleStartTime === 0) cycleStartTime = currentTime;

        const elapsedTime = currentTime - cycleStartTime;
        phase = (elapsedTime % cycleLength) / cycleLength;

        drawWaveform(phase, canvas, ctx);

        animationFrameId = requestAnimationFrame((time) => animate(time, canvas, ctx));
    }
}

function startInstanceVisualization() {
    if (!animationFrameId) {
        const canvasContainer = document.getElementById('instanceCanvasContainer');
        if (canvasContainer) {
            canvasContainer.classList.remove('d-none');
            canvasContainer.classList.add('d-block');
            setInstanceCanvasSize();
            cycleStartTime = 0;
            generatePoints(1);
            animate(performance.now(), instanceCanvas, instanceCtx);
            console.log('Visualization started');
        } else {
            console.error('Instance canvas container not found');
        }
    }
}

function setInstanceCanvasSize() {
    const canvas = document.getElementById('instanceCanvas');
    if (canvas) {
        const containerWidth = canvas.parentElement.offsetWidth;
        canvas.width = containerWidth * 1.0; // 100% of the container width
        canvas.height = 200;
        canvas.style.width = `${canvas.width}px`;
        canvas.style.height = `${canvas.height}px`;
        console.log('Instance canvas size set to:', canvas.width, canvas.height);
    } else {
        console.error('Instance canvas element not found');
    }
}

function initializeInstanceCanvas() {
    instanceCanvas = document.getElementById('instanceCanvas');
    if (!instanceCanvas) {
        console.error('Canvas element with id "instanceCanvas" not found. Please check your HTML.');
        return;
    }
    instanceCtx = instanceCanvas.getContext('2d');
    setInstanceCanvasSize();
    window.addEventListener('resize', setInstanceCanvasSize);
}

</script >
