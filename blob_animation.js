let blob;
let isCallInProgress = false;

document.addEventListener('DOMContentLoaded', function () {
    blob = document.querySelector('.blob');
    initializeVapi();
});

function initializeVapi() {
    vapiInstance = window.vapiSDK.run({
        apiKey: apiKey,
        assistant: assistant,
        config: buttonConfig,
    });

    vapiInstance.on("volume-level", (volume) => {
        if (isCallInProgress) {
            updateBlobSize(volume);
        }
    });

    vapiInstance.on("speech-start", () => {
        isCallInProgress = true;
    });

    vapiInstance.on("speech-end", () => {
        isCallInProgress = false;
        resetBlobSize();
    });
}

function updateBlobSize(volume) {
    const scale = 1 + volume * 0.5; // Adjust this multiplier as needed
    blob.style.transform = `scale(${scale})`;
}

function resetBlobSize() {
    blob.style.transform = 'scale(1)';
}