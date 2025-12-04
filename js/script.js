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
    format: 'original'
};

function drawCanvas() {
    if (!state.image) return;

    // 1. Définir une taille MAX pour éviter le crash sur iPhone
    // On limite à 1500px de large ou de haut maximum
    const MAX_SIZE = 1500;
    let scale = 1;
    
    if (state.image.width > MAX_SIZE || state.image.height > MAX_SIZE) {
        scale = Math.min(MAX_SIZE / state.image.width, MAX_SIZE / state.image.height);
    }

    // Dimensions réelles de l'image (redimensionnée ou non)
    const trueWidth = state.image.width * scale;
    const trueHeight = state.image.height * scale;

    // 2. Calcul du Crop (Recadrage) basé sur ces nouvelles dimensions
    let dWidth, dHeight, dx, dy; // Dimensions de destination et position sur le canvas

    if (state.format === 'square') {
        // Carré 1:1
        const side = Math.min(trueWidth, trueHeight);
        canvas.width = side;
        canvas.height = side;
        
        // Calcul du centrage
        dWidth = trueWidth; // On garde la proportion
        dHeight = trueHeight;
        dx = (side - trueWidth) / 2;
        dy = (side - trueHeight) / 2;

    } else if (state.format === 'story') {
        // Story 9:16
        const targetRatio = 9 / 16;
        // On fixe la largeur du canvas sur la largeur de l'image (ou hauteur adaptée)
        // Pour simplifier : on définit la taille du canvas selon le ratio cible
        
        // Si l'image est plus "large" que le format story
        if ((trueWidth / trueHeight) > targetRatio) {
            canvas.height = trueHeight;
            canvas.width = trueHeight * targetRatio;
        } else {
            canvas.width = trueWidth;
            canvas.height = trueWidth / targetRatio;
        }

        // On dessine l'image pour qu'elle couvre tout (object-fit: cover)
        // C'est un peu complexe, on simplifie : on centre l'image
        dWidth = trueWidth;
        dHeight = trueHeight;
        dx = (canvas.width - trueWidth) / 2;
        dy = (canvas.height - trueHeight) / 2;

    } else {
        // Original
        canvas.width = trueWidth;
        canvas.height = trueHeight;
        dWidth = trueWidth;
        dHeight = trueHeight;
        dx = 0;
        dy = 0;
    }

    // 3. Nettoyage et Sauvegarde du contexte (Important pour iOS)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); // On sauvegarde l'état avant d'appliquer les filtres

    // 4. Application des Filtres
    let filterString = `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%) sepia(${state.sepia}%)`;
    if (state.grayscale) filterString += ' grayscale(100%)';
    ctx.filter = filterString;

    // 5. Dessin de l'image
    ctx.drawImage(state.image, dx, dy, dWidth, dHeight);

    // 6. Restauration (On enlève les filtres pour le texte)
    ctx.restore(); 

    // 7. Texte
    ctx.fillStyle = state.textColor;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = canvas.width / 100; // Contour un peu plus fin
    ctx.lineJoin = 'round'; // Coins arrondis pour le texte
    ctx.textAlign = 'center';
    
    // Taille responsive
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

// EVENT LISTENERS OPTIMISÉS (input pour Desktop, change pour compatibilité max)
const updateState = () => requestAnimationFrame(drawCanvas); // Fluidité

topTextInput.addEventListener('input', (e) => { state.topText = e.target.value; updateState(); });
bottomTextInput.addEventListener('input', (e) => { state.bottomText = e.target.value; updateState(); });

brightnessSlider.addEventListener('input', (e) => { state.brightness = e.target.value; updateState(); });
contrastSlider.addEventListener('input', (e) => { state.contrast = e.target.value; updateState(); });

grayscaleToggle.addEventListener('change', (e) => { state.grayscale = e.target.checked; updateState(); });
fontSelect.addEventListener('change', (e) => { state.fontFamily = e.target.value; updateState(); });
textColorInput.addEventListener('input', (e) => { state.textColor = e.target.value; updateState(); });

presetButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const presetName = e.target.dataset.preset;
        const newSettings = presets[presetName];
        state = { ...state, ...newSettings };
        
        // Update sliders visuellement
        brightnessSlider.value = newSettings.brightness;
        contrastSlider.value = newSettings.contrast;
        grayscaleToggle.checked = newSettings.grayscale;
        
        drawCanvas();
    });
});

formatButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        formatButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
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
    
    topTextInput.value = ''; bottomTextInput.value = '';
    brightnessSlider.value = 100; contrastSlider.value = 100;
    grayscaleToggle.checked = false;
    fontSelect.value = 'Anton'; textColorInput.value = '#ffffff';
    
    formatButtons.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-format="original"]').classList.add('active');

    drawCanvas();
});

downloadBtn.addEventListener('click', () => {
    if (!state.image) return alert("Charge une image d'abord !");
    const link = document.createElement('a');
    link.download = `kromaflow-${state.format}.png`;
    // Qualité max pour le JPEG/PNG
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
});
