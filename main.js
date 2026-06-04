const overlay = document.getElementById("motion-overlay");
const menu = document.getElementById("menu");

async function enableMotionAccess() {
    if (!overlay || !menu) return;

    try {
        if (
            typeof DeviceOrientationEvent !== "undefined" &&
            typeof DeviceOrientationEvent.requestPermission === "function"
        ) {
            const permission = await DeviceOrientationEvent.requestPermission();

            if (permission !== "granted") {
                alert("Motion access denied.");
                return;
            }
        }

        localStorage.setItem("motionAccess", "granted");

        overlay.remove();
        menu.classList.add("visible");
    } catch (error) {
        console.error(error);
        alert("Motion access could not be enabled.");
    }
}

overlay?.addEventListener("click", enableMotionAccess);
overlay?.addEventListener("touchstart", enableMotionAccess, { once: true });