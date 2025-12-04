// CORRECTION ICI : On retire { willReadFrequently: true } pour réactiver le GPU sur iPhone
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d'); 

// --- SÉLECTION DOM ---
const imageUpload = document.getElementById('imageUpload');
const topTextInput = document.getElementById('topTextInput');
const bottomTextInput = document.getElementById('bottomTextInput');
const brightnessSlider = document.getElementById('brightnessSlider');
const contrastSlider = document.getElementById('contrastSlider');
const grayscaleToggle = document.getElementById('grayscaleToggle');
const fontSelect = document.getElementById('fontSelect');
const textColorInput = document.getElementById('textColorInput');
const presetButtons = document.querySelectorAll('.preset-btn');
const formatButtons = document.querySelectorAll('.format-btn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const canvasPanel = document.querySelector('.canvas-panel');

// --- ÉTAT GLOBAL ---
let state = {
    image: null,
    topText: '',
    bottomText: '',
    brightness: 100,
    contrast: 100,
    grayscale: false,
    saturation: 100,
    sepia: 0,
    fontFamily: 'Anton',
    textColor: '#ffffff',
    format: 'original'
};

// Système anti-lag (Throttle)
let isDrawing = false;
let drawingScheduled = false;

function requestDraw() {
    if (isDrawing) {
        drawingScheduled = true;
        return;
    }
    requestAnimationFrame(drawCanvas);
}

function drawCanvas() {
    if (!state.image) return;
    
    isDrawing = true;

    // 1. Limitation taille image (Max 1024px pour iPhone)
    const MAX_SIZE = 1024;
    let scale = 1;
    if (state.image.width > MAX_SIZE || state.image.height > MAX_SIZE) {
        scale = Math.min(MAX_SIZE / state.image.width, MAX_SIZE / state.image.height);
    }

    const trueWidth = state.image.width * scale;
    const trueHeight = state.image.height * scale;

    // 2. Calcul du Crop
    let dWidth, dHeight, dx, dy;

    if (state.format === 'square') {
        const side = Math.min(trueWidth, trueHeight);
        canvas.width = side;
        canvas.height = side;
        dWidth = trueWidth; dHeight = trueHeight;
        dx = (side - trueWidth) / 2;
        dy = (side - trueHeight) / 2;
    } else if (state.format === 'story') {
        const targetRatio = 9 / 16;
        if ((trueWidth / trueHeight) > targetRatio) {
            canvas.height = trueHeight;
            canvas.width = trueHeight * targetRatio;
        } else {
            canvas.width = trueWidth;
            canvas.height = trueWidth / targetRatio;
        }
        dWidth = trueWidth; dHeight = trueHeight;
        dx = (canvas.width - trueWidth) / 2;
        dy = (canvas.height - trueHeight) / 2;
    } else {
        canvas.width = trueWidth;
        canvas.height = trueHeight;
        dWidth = trueWidth; dHeight = trueHeight;
        dx = 0; dy = 0;
    }

    // 3. Dessin
    try {
        // Reset explicite pour iOS
        ctx.filter = 'none';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();

        // Application des filtres
        // On force des nombres entiers (Math.round) pour éviter les erreurs de syntaxe WebKit
        let b = Math.round(state.brightness);
        let c = Math.round(state.contrast);
        let s = Math.round(state.saturation);
        let sp = Math.round(state.sepia);
        
        let filterString = `brightness(${b}%) contrast(${c}%) saturate(${s}%) sepia(${sp}%)`;
        
        if (state.grayscale) {
            filterString += ' grayscale(100%)';
        }
        
        ctx.filter = filterString;

        ctx.drawImage(state.image, dx, dy, dWidth, dHeight);
        
        ctx.restore();

        // 4. Texte (Dessiné PAR DESSUS l'image filtrée)
        // Note: Le contexte est restauré, donc ctx.filter est 'none' ici (c'est ce qu'on veut)
        
        ctx.fillStyle = state.textColor;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = Math.max(2, canvas.width / 150);
        ctx.lineJoin = 'round';
        ctx.textAlign = 'center';
        
        const fontSize = Math.floor(canvas.width * 0.1); 
        ctx.font = `700 ${fontSize}px '${state.fontFamily}', sans-serif`;

        if (state.topText) {
            ctx.textBaseline = 'top';
            ctx.strokeText(state.topText, canvas.width / 2, fontSize * 0.2);
            ctx.fillText(state.topText, canvas.width / 2, fontSize * 0.2);
        }

        if (state.bottomText) {
            ctx.textBaseline = 'bottom';
            ctx.strokeText(state.bottomText, canvas.width / 2, canvas.height - (fontSize * 0.2));
            ctx.fillText(state.bottomText, canvas.width / 2, canvas.height - (fontSize * 0.2));
        }
        
        canvasPanel.classList.add('active');
        
    } catch (e) {
        console.error("Erreur:", e);
    } finally {
        isDrawing = false;
        if (drawingScheduled) {
            drawingScheduled = false;
            requestDraw();
        }
    }
}

// --- PRESETS ---
const presets = {
    cyberpunk: { brightness: 110, contrast: 130, saturation: 200, sepia: 0, grayscale: false },
    vintage: { brightness: 90, contrast: 80, saturation: 80, sepia: 60, grayscale: false },
    cinematic: { brightness: 80, contrast: 140, saturation: 90, sepia: 0, grayscale: false },
    normal: { brightness: 100, contrast: 100, saturation: 100, sepia: 0, grayscale: false }
};

// Listeners
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                state.image = img;
                requestDraw();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Helper pour écouteurs multiples
const addInputListeners = (element, callback) => {
    element.addEventListener('input', callback);
    element.addEventListener('change', callback); 
};

addInputListeners(topTextInput, (e) => { state.topText = e.target.value; requestDraw(); });
addInputListeners(bottomTextInput, (e) => { state.bottomText = e.target.value; requestDraw(); });
addInputListeners(brightnessSlider, (e) => { state.brightness = e.target.value; requestDraw(); });
addInputListeners(contrastSlider, (e) => { state.contrast = e.target.value; requestDraw(); });
addInputListeners(textColorInput, (e) => { state.textColor = e.target.value; requestDraw(); });

grayscaleToggle.addEventListener('change', (e) => { state.grayscale = e.target.checked; requestDraw(); });
fontSelect.addEventListener('change', (e) => { state.fontFamily = e.target.value; requestDraw(); });

presetButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const settings = presets[e.target.dataset.preset];
        state = { ...state, ...settings };
        brightnessSlider.value = settings.brightness;
        contrastSlider.value = settings.contrast;
        grayscaleToggle.checked = settings.grayscale;
        requestDraw();
    });
});

formatButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        formatButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.format = e.currentTarget.dataset.format;
        requestDraw();
    });
});

resetBtn.addEventListener('click', () => {
    state = { 
        ...state, 
        topText: '', bottomText: '', 
        brightness: 100, contrast: 100, saturation: 100, sepia: 0, grayscale: false,
        fontFamily: 'Anton', textColor: '#ffffff', format: 'original'
    };
    
    topTextInput.value = ''; bottomTextInput.value = '';
    brightnessSlider.value = 100; contrastSlider.value = 100;
    grayscaleToggle.checked = false;
    fontSelect.value = 'Anton'; textColorInput.value = '#ffffff';
    
    formatButtons.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-format="original"]').classList.add('active');
    
    requestDraw();
});

downloadBtn.addEventListener('click', () => {
    if (!state.image) return alert("Charge une image d'abord !");
    const link = document.createElement('a');
    link.download = `kromaflow-${state.format}.png`;
    link.href = canvas.toDataURL('image/png', 0.9);
    link.click();
});
