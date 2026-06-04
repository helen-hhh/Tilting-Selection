const textElement = document.querySelector(".wordsOnWalk");
const svg = document.getElementById("connections");

const originalText = textElement.textContent.trim();
const words = originalText.split(/\s+/);

const targetDistance = 100; // Meter bis zum vollständig lesbaren Text

let wordObjects = [];
let startPosition = null;
let walkedDistance = 0;
let watchId = null;

textElement.innerHTML = "";

createWords();
draw();

const savedStartLocation = localStorage.getItem("startLocation");

if (savedStartLocation) {
    startPosition = JSON.parse(savedStartLocation);
    startWalkingTracking();
} else {
    alert("Bitte zuerst auf der Startseite Location Access erlauben.");
}

function createWords() {
    words.forEach((word, index) => {
        const wrapper = document.createElement("span");
        const beforeDot = document.createElement("span");
        const wordSpan = document.createElement("span");
        const afterDot = document.createElement("span");

        wrapper.classList.add("word-wrapper");
        beforeDot.classList.add("word-dot");
        afterDot.classList.add("word-dot");
        wordSpan.classList.add("floating-word");

        wordSpan.textContent = word;

        wrapper.appendChild(beforeDot);
        wrapper.appendChild(wordSpan);
        wrapper.appendChild(afterDot);

        textElement.appendChild(wrapper);

        wordObjects.push({
            wrapper,
            beforeDot,
            afterDot,
            wordSpan,
            randomX: 0,
            randomY: 0,
            randomRotation: 0,
            targetX: 0,
            targetY: 0
        });
    });

    calculateTargetPositions();
    scatterWords();
}

function calculateTargetPositions() {
    textElement.classList.add("measuring");

    wordObjects.forEach((obj) => {
        obj.wrapper.style.position = "static";
        obj.wrapper.style.transform = "none";
    });

    const containerRect = textElement.getBoundingClientRect();

    wordObjects.forEach((obj) => {
        const rect = obj.wrapper.getBoundingClientRect();

        obj.targetX = rect.left - containerRect.left;
        obj.targetY = rect.top - containerRect.top;
    });

    textElement.classList.remove("measuring");
}

function scatterWords() {
    const margin = 60;

    wordObjects.forEach((obj, index) => {
        if (index === 0) {
            obj.randomX = obj.targetX;
            obj.randomY = obj.targetY;
            obj.randomRotation = 0;
            return;
        }

        obj.randomX =
            margin + Math.random() * (window.innerWidth - margin * 2);

        obj.randomY =
            margin + Math.random() * (window.innerHeight - margin * 2);

        obj.randomRotation = Math.random() * 360 - 180;
    });
}

function startWalkingTracking() {
    if (!navigator.geolocation) {
        alert("Geolocation wird von diesem Browser nicht unterstützt.");
        return;
    }

    watchId = navigator.geolocation.watchPosition(
        handlePosition,
        handleGeoError,
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 20000
        }
    );
}

function handlePosition(position) {
    const currentPosition = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
    };

    walkedDistance = distanceInMeters(startPosition, currentPosition);

    draw();
}

function handleGeoError(error) {
    console.error(error);

    if (error.code === 1) {
        alert("Standortzugriff wurde verweigert.");
    } else if (error.code === 2) {
        alert("Standort konnte nicht bestimmt werden.");
    } else if (error.code === 3) {
        alert("Standort-Abfrage hat zu lange gedauert.");
    } else {
        alert("Standort konnte nicht gelesen werden.");
    }
}

function draw() {
    const progress = Math.min(walkedDistance / targetDistance, 1);

    wordObjects.forEach((obj) => {
        const x = lerp(obj.randomX, obj.targetX, progress);
        const y = lerp(obj.randomY, obj.targetY, progress);
        const rotation = lerp(obj.randomRotation, 0, progress);

        obj.wrapper.style.position = "absolute";
        obj.wrapper.style.left = x + "px";
        obj.wrapper.style.top = y + "px";
        obj.wrapper.style.transform = `rotate(${rotation}deg)`;
    });

    drawConnections(progress);
}

function drawConnections(progress) {
    svg.innerHTML = "";

    if (progress > 0.97) return;

    for (let i = 0; i < wordObjects.length - 1; i++) {
        const currentAfter = wordObjects[i].afterDot;
        const nextBefore = wordObjects[i + 1].beforeDot;

        const p1 = getCenter(currentAfter);
        const p2 = getCenter(nextBefore);

        const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

        line.setAttribute("x1", p1.x);
        line.setAttribute("y1", p1.y);
        line.setAttribute("x2", p2.x);
        line.setAttribute("y2", p2.y);

        svg.appendChild(line);
    }
}

function getCenter(element) {
    const rect = element.getBoundingClientRect();

    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

function distanceInMeters(a, b) {
    const R = 6371000;

    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);

    const h =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

    return R * c;
}

function toRad(value) {
    return value * Math.PI / 180;
}

function lerp(start, end, amount) {
    return start + (end - start) * amount;
}