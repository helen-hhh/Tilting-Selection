const articles = [
    {
        title: "Walking and Memory",
        preview:
            "Ein Text darüber, wie Bewegung Erinnerungen aktiviert und Orte als Gedächtnisräume funktionieren."
    },
    {
        title: "Walking and Knowledge",
        preview:
            "Ein Artikel über Gehen als Methode der Erkenntnisproduktion und räumliches Denken."
    },
    {
        title: "Walking and Creativity",
        preview:
            "Ein Essay darüber, wie rhythmische Bewegung kreative Prozesse beeinflusst."
    }
];

function placeTargetsRandomly() {
    const margin = 80;
    const minDistance = 130;

    const positions = [];

    targets.forEach((target, index) => {
        let x;
        let y;
        let tries = 0;
        let valid = false;

        while (!valid && tries < 1000) {
            x = margin + Math.random() * (window.innerWidth - margin * 2);
            y = margin + Math.random() * (window.innerHeight - margin * 2);

            valid = positions.every((pos) => {
                const dx = x - pos.x;
                const dy = y - pos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance > minDistance;
            });

            tries++;
        }

        positions.push({ x, y });

        target.style.left = x + "px";
        target.style.top = y + "px";

        const label = target.nextElementSibling;
        label.style.left = x + "px";
        label.style.top = y + "px";
    });
}

const cursor = document.getElementById("cursor");
const targets = document.querySelectorAll(".target");
const preview = document.getElementById("preview");
const previewTitle = document.getElementById("previewTitle");
const previewText = document.getElementById("previewText");
const progress = document.getElementById("progress");
const start = document.getElementById("start");
const button = document.getElementById("permissionButton");

let x = window.innerWidth / 2;
let y = window.innerHeight / 2;

let activeTarget = null;
let dwellStart = null;
let selected = false;

const dwellTime = 1800;
const attractionDistance = 170;

let vx = 0;
let vy = 0;
let tiltEnabled = false;

function updateCursor() {
    if (tiltEnabled) {
        x += vx;
        y += vy;

        x = Math.max(25, Math.min(window.innerWidth - 25, x));
        y = Math.max(25, Math.min(window.innerHeight - 25, y));
    }

    cursor.style.left = x + "px";
    cursor.style.top = y + "px";

    checkTargets();
    requestAnimationFrame(updateCursor);
}

function handleOrientation(event) {
    const tiltX = event.gamma || 0;
    const tiltY = event.beta || 0;

    vx += tiltX * 0.02;
    vy += tiltY * 0.02;

    vx *= 0.92;
    vy *= 0.92;
}

async function startInteraction() {
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

    tiltEnabled = true;
    window.addEventListener("deviceorientation", handleOrientation);

    start.style.display = "none";
}

function checkTargets() {
    let nearest = null;
    let nearestDistance = Infinity;

    targets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        const tx = rect.left + rect.width / 2;
        const ty = rect.top + rect.height / 2;

        const dx = x - tx;
        const dy = y - ty;
        const distance = Math.sqrt(dx * dx + dy * dy);

        target.classList.remove("active");

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = target;
        }
    });

    if (nearest && nearestDistance < attractionDistance) {
        const article = articles[nearest.dataset.id];

        nearest.classList.add("active");
        preview.classList.add("visible");
        previewTitle.textContent = article.title;
        previewText.textContent = article.preview;
    } else {
        preview.classList.remove("visible");
        progress.style.width = "0%";
        activeTarget = null;
        dwellStart = null;
        return;
    }

    const rect = nearest.getBoundingClientRect();
    const radius = rect.width / 2;
    const centerX = rect.left + radius;
    const centerY = rect.top + radius;

    const inside =
        Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) < radius;

    if (inside && !selected) {
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
        dwellStart = null;
        activeTarget = null;
    }
}

function selectArticle(id) {
    selected = true;

    targets[id].classList.add("selected");
    previewTitle.textContent = articles[id].title;
    previewText.textContent = "Artikel ausgewählt.";

    setTimeout(() => {
        alert("Ausgewählt: " + articles[id].title);

        selected = false;
        targets[id].classList.remove("selected");
        progress.style.width = "0%";
    }, 300);
}

function moveCursorTo(clientX, clientY) {
    x = clientX;
    y = clientY;
}

function startInteraction() {
    start.style.display = "none";
}

button.addEventListener("click", startInteraction);

// window.addEventListener("pointermove", (event) => {
//     moveCursorTo(event.clientX, event.clientY);
// });

// window.addEventListener("pointerdown", (event) => {
//     moveCursorTo(event.clientX, event.clientY);
// });

placeTargetsRandomly();
updateCursor();
updateCursor();