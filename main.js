const articles = [
    {
        title: "Creativity",
        preview: "Ein Essay darüber, wie Bewegung kreative Prozesse beeinflusst."
    },
    {
        title: "Knowledge Production",
        preview: "Ein Artikel über Gehen als Methode der Erkenntnisproduktion."
    },
    {
        title: "Bodies in the digital age",
        preview: "Ein Essay darüber, wie sich das Verhältnis zu unseren Körper im digitalen Zeitalter verschiebt."
    }
];

const cursor = document.getElementById("cursor");
const targets = document.querySelectorAll(".target");
const preview = document.getElementById("preview");
const previewTitle = document.getElementById("previewTitle");
const previewText = document.getElementById("previewText");
const progress = document.getElementById("progress");

let x = window.innerWidth / 2;
let y = window.innerHeight / 2;

let vx = 0;
let vy = 0;

let tiltEnabled = false;
let activeTarget = null;
let dwellStart = null;
let selected = false;

const dwellTime = 1500;
const previewDistance = 120;
const targetRadius = 25;
const cursorRadius = 21;

function placeTargetsRandomly() {
    const margin = 90;
    const minDistance = 160;
    const positions = [];

    targets.forEach((target) => {
        let tx, ty, valid;

        do {
            tx = margin + Math.random() * (window.innerWidth - margin * 2);
            ty = margin + Math.random() * (window.innerHeight - margin * 2);

            valid = positions.every((pos) => {
                const dx = tx - pos.x;
                const dy = ty - pos.y;
                return Math.sqrt(dx * dx + dy * dy) > minDistance;
            });
        } while (!valid);

        positions.push({ x: tx, y: ty });

        target.style.left = tx + "px";
        target.style.top = ty + "px";

        const label = target.nextElementSibling;
        label.style.left = tx + "px";
        label.style.top = ty + "px";
    });
}

async function enableTilt() {
    if (tiltEnabled) return;

    if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
        const permission = await DeviceOrientationEvent.requestPermission();

        if (permission !== "granted") {
            alert("Bewegungssensor wurde nicht erlaubt.");
            return;
        }
    }

    window.addEventListener("deviceorientation", handleTilt);
    tiltEnabled = true;

    document.getElementById("hint")?.remove();
    console.log("Tilt aktiviert");
}

function handleTilt(event) {
    const gamma = event.gamma || 0; // links/rechts
    const beta = event.beta || 0;   // vor/zurück

    vx += gamma * 0.02;
    vy += beta * 0.02;

    vx *= 0.92;
    vy *= 0.92;
}

function updateCursor() {
    x += vx;
    y += vy;

    x = Math.max(cursorRadius, Math.min(window.innerWidth - cursorRadius, x));
    y = Math.max(cursorRadius, Math.min(window.innerHeight - cursorRadius, y));

    cursor.style.left = x + "px";
    cursor.style.top = y + "px";

    checkTargets();

    requestAnimationFrame(updateCursor);
}

function checkTargets() {
    let nearest = null;
    let nearestDistance = Infinity;

    targets.forEach((target) => {
        target.classList.remove("active");

        const rect = target.getBoundingClientRect();
        const tx = rect.left + rect.width / 2;
        const ty = rect.top + rect.height / 2;

        const dx = x - tx;
        const dy = y - ty;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = target;
        }
    });

    if (!nearest || nearestDistance > previewDistance) {
        preview.classList.remove("visible");
        progress.style.width = "0%";
        activeTarget = null;
        dwellStart = null;
        return;
    }

    const article = articles[nearest.dataset.id];

    nearest.classList.add("active");
    preview.classList.add("visible");
    previewTitle.textContent = article.title;
    previewText.textContent = article.preview;

    const insideTarget = nearestDistance < targetRadius + cursorRadius * 0.3;

    if (insideTarget && !selected) {
        if (activeTarget !== nearest) {
            activeTarget = nearest;
            dwellStart = performance.now();
        }

        const elapsed = performance.now() - dwellStart;
        const percent = Math.min(elapsed / dwellTime, 1) * 100;

        progress.style.width = percent + "%";

        if (elapsed >= dwellTime) {
            selectArticle(nearest.dataset.id);
        }
    } else {
        progress.style.width = "0%";
        activeTarget = null;
        dwellStart = null;
    }
}

function selectArticle(id) {
    selected = true;

    targets[id].classList.add("selected");
    previewTitle.textContent = articles[id].title;
    previewText.textContent = "Artikel ausgewählt.";

    setTimeout(() => {
        selected = false;
        targets[id].classList.remove("selected");
        progress.style.width = "0%";
    }, 1200);
}

document.addEventListener("click", enableTilt);
document.addEventListener("touchstart", enableTilt, { once: true });

placeTargetsRandomly();
updateCursor();