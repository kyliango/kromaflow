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
const formatButtons = document.querySelectorAll('.format-btn'); // Nouveau
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const canvasPanel = document.querySelector('.canvas-panel');

// --- ÉTAT GLOBAL (STATE) ---
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
    format: 'original' // 'original', 'square', 'story'
};

function drawCanvas() {
    if (!state.image) return;

    // 1. Calcul des dimensions et du recadrage (Crop Logic)
    let sWidth, sHeight, sx, sy, dWidth, dHeight;
    const img = state.image;

    if (state.format === 'square') {
        // Carré 1:1
        const side = Math.min(img.width, img.height);
        sWidth = side;
        sHeight = side;
        // On centre le crop
        sx = (img.width - side) / 2;
        sy = (img.height - side) / 2;
        dWidth = side;
        dHeight = side;
    } else if (state.format === 'story') {
        // Story 9:16
        const targetRatio = 9 / 16;
        const imgRatio = img.width / img.height;

        if (imgRatio > targetRatio) {
            // L'image est plus large que le format story -> On coupe la largeur
            sHeight = img.height;
            sWidth = img.height * targetRatio;
            sx = (img.width - sWidth) / 2;
            sy = 0;
        } else {
            // L'image est plus haute (ou égale) -> On coupe la hauteur
            sWidth = img.width;
            sHeight = img.width / targetRatio;
            sx = 0;
            sy = (img.height - sHeight) / 2;
        }
        dWidth = sWidth;
        dHeight = sHeight;
    } else {
        // Original
        sWidth = img.width;
        sHeight = img.height;
        sx = 0;
        sy = 0;
        dWidth = img.width;
        dHeight = img.height;
    }

    // Appliquer la taille au canvas
    canvas.width = dWidth;
    canvas.height = dHeight;

    // 2. Nettoyage
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3. Application des Filtres
    let filterString = `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%) sepia(${state.sepia}%)`;
    if (state.grayscale) filterString += ' grayscale(100%)';
    ctx.filter = filterString;

    // 4. Dessin de l'image recadrée
    // drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, dWidth, dHeight);

    ctx.filter = 'none'; // Reset filtres

    // 5. Texte
    ctx.fillStyle = state.textColor;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = canvas.width / 150;
    ctx.textAlign = 'center';
    
    // Taille responsive basée sur la nouvelle largeur du canvas
    const fontSize = Math.floor(canvas.width * 0.08); 
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
}

// --- LOGIQUE PRESETS ---
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
                drawCanvas();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

topTextInput.addEventListener('input', (e) => { state.topText = e.target.value; drawCanvas(); });
bottomTextInput.addEventListener('input', (e) => { state.bottomText = e.target.value; drawCanvas(); });
brightnessSlider.addEventListener('input', (e) => { state.brightness = e.target.value; drawCanvas(); });
contrastSlider.addEventListener('input', (e) => { state.contrast = e.target.value; drawCanvas(); });
grayscaleToggle.addEventListener('change', (e) => { state.grayscale = e.target.checked; drawCanvas(); });
fontSelect.addEventListener('change', (e) => { state.fontFamily = e.target.value; drawCanvas(); });
textColorInput.addEventListener('input', (e) => { state.textColor = e.target.value; drawCanvas(); });

presetButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const presetName = e.target.dataset.preset;
        const newSettings = presets[presetName];
        state = { ...state, ...newSettings };
        brightnessSlider.value = newSettings.brightness;
        contrastSlider.value = newSettings.contrast;
        grayscaleToggle.checked = newSettings.grayscale;
        drawCanvas();
    });
});

// NOUVEAU : Listener pour les formats
formatButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Gestion visuelle des boutons (Active state)
        formatButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Mise à jour du state
        state.format = e.currentTarget.dataset.format;
        drawCanvas();
    });
});

resetBtn.addEventListener('click', () => {
    state = { 
        ...state, 
        topText: '', bottomText: '', 
        brightness: 100, contrast: 100, saturation: 100, sepia: 0, grayscale: false,
        fontFamily: 'Anton', textColor: '#ffffff', format: 'original'
    };
    
    // Reset UI
    topTextInput.value = ''; bottomTextInput.value = '';
    brightnessSlider.value = 100; contrastSlider.value = 100;
    grayscaleToggle.checked = false;
    fontSelect.value = 'Anton'; textColorInput.value = '#ffffff';
    
    // Reset Boutons Format
    formatButtons.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-format="original"]').classList.add('active');

    drawCanvas();
});

downloadBtn.addEventListener('click', () => {
    if (!state.image) return alert("Charge une image d'abord !");
    const link = document.createElement('a');
    link.download = `kromaflow-${state.format}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});