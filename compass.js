const dots = {
    north: document.querySelector(".dot-north"),
    east: document.querySelector(".dot-east"),
    south: document.querySelector(".dot-south"),
    west: document.querySelector(".dot-west")
};

const oval = document.querySelector(".compass-oval");

let heading = 0;

function updateCompass() {

    const width = oval.offsetWidth;
    const height = oval.offsetHeight;

    const cx = width / 2;
    const cy = height / 2;

    const rx = width / 2;
    const ry = height / 2;

    placeDot(dots.north, heading);
    placeDot(dots.east, heading + 90);
    placeDot(dots.south, heading + 180);
    placeDot(dots.west, heading + 270);

    function placeDot(dot, angleDeg) {

        const angle = (angleDeg - 90) * Math.PI / 180;

        const x = cx + rx * Math.cos(angle);
        const y = cy + ry * Math.sin(angle);

        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
    }
}

document
    .getElementById("enable-compass")
    .addEventListener("click", async () => {

        if (
            typeof DeviceOrientationEvent !== "undefined" &&
            typeof DeviceOrientationEvent.requestPermission === "function"
        ) {

            const permission =
                await DeviceOrientationEvent.requestPermission();

            if (permission !== "granted") return;
        }

        window.addEventListener(
            "deviceorientationabsolute",
            handleOrientation,
            true
        );

        window.addEventListener(
            "deviceorientation",
            handleOrientation,
            true
        );
    });

function handleOrientation(event) {

    if (event.webkitCompassHeading) {

        heading = event.webkitCompassHeading;

    } else if (event.alpha !== null) {

        heading = 360 - event.alpha;
    }

    updateCompass();
}