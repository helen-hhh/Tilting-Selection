const overlay = document.getElementById("motion-overlay");
const menu = document.getElementById("menu");

async function enableAccess() {
    if (!overlay || !menu) return;

    try {
        await requestMotionAccess();
        await requestLocationAccess();

        localStorage.setItem("motionAccess", "granted");
        localStorage.setItem("locationAccess", "granted");

        overlay.remove();
        menu.classList.add("visible");
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

async function requestMotionAccess() {
    if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
        const permission = await DeviceOrientationEvent.requestPermission();

        if (permission !== "granted") {
            throw new Error("Motion access denied.");
        }
    }
}

function requestLocationAccess() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation wird von diesem Browser nicht unterstützt."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                localStorage.setItem(
                    "startLocation",
                    JSON.stringify({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    })
                );

                resolve(position);
            },
            () => {
                reject(new Error("Location access denied."));
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 20000
            }
        );
    });
}

overlay?.addEventListener("click", enableAccess);
overlay?.addEventListener("touchstart", enableAccess, { once: true });