const state = {
    screen: "cover",
    selectedDistance: null,
    currentCategoryId: null,
    currentArticle: null,
    currentPageIndex: 0,

    walkGoal: null,
    walkedMeters: 0,
    afterWalk: null
};

const screens = document.querySelectorAll("[data-screen]");
const permissionOverlay = document.querySelector("#permissionOverlay");
const permissionButton = document.querySelector("#permissionButton");
const permissionStatus = document.querySelector("#permissionStatus");

const globalStatus = document.querySelector("#globalStatus");
const coverMeters = document.querySelector("#coverMeters");
const transitionMeters = document.querySelector("#transitionMeters");
const walkingAnimation = document.querySelector("#walkingAnimation");

const articleEyebrow = document.querySelector("#articleEyebrow");
const articleTitle = document.querySelector("#articleTitle");
const articlePage = document.querySelector("#articlePage");
const pageCurrent = document.querySelector("#pageCurrent");
const pageTotal = document.querySelector("#pageTotal");

const mainTocOptions = document.querySelector("#mainTocOptions");
const categoryTitle = document.querySelector("#categoryTitle");
const categoryIntro = document.querySelector("#categoryIntro");
const categoryCompassTitle = document.querySelector("#categoryCompassTitle");
const categoryArticleOptions = document.querySelector("#categoryArticleOptions");

const globalCategoryTitle = document.querySelector(".nav-bar .category-title h2");

function showScreen(name) {
    state.screen = name;

    screens.forEach((screen) => {
        screen.classList.toggle("is-active", screen.dataset.screen === name);
    });

    globalStatus.textContent = `Aktueller Screen: ${name}`;

    setGlobalCompassTitle("");

    if (name === "calibration-compass") {
        setCompassInstruction("Drehe dich so, dass ein Punkt oben einrastet.");

        startCompassInteraction({
            options: [
                { key: "north", title: "Auswahl 1" },
                { key: "east", title: "Auswahl 2" },
                { key: "south", title: "Auswahl 3" },
                { key: "west", title: "Auswahl 4" }
            ],
            onLock: () => {
                showScreen("calibration-page-turn");
            }
        });
    }

    if (name === "distance-select") {
        startCompassInteraction({
            options: [
                { key: "north", title: "100 m", value: 100 },
                { key: "east", title: "200 m", value: 200 },
                { key: "south", title: "500 m", value: 500 },
                { key: "west", title: "1 km", value: 1000 }
            ],
            onLock: (option) => {
                state.selectedDistance = option.value;

                setTimeout(() => {
                    startWalkGoal(50, () => {
                        renderArticle(READER_CONTENT.introArticle, {
                            eyebrow: "Einleitung"
                        });
                    }, "Gehe 50m bis zur ersten Seite.");
                }, 800);
            }
        });
    }

    if (name === "main-toc") {
        startCompassInteraction({
            options: READER_CONTENT.categories.slice(0, 4).map((category, index) => {
                const keys = ["north", "east", "south", "west"];

                return {
                    key: keys[index],
                    title: category.title,
                    value: category.id
                };
            }),
            onLock: (option) => {
                setTimeout(() => {
                    selectCategory(option.value);
                }, 800);
            }
        });
    }

    if (name === "category-compass") {
        const category = findCategory(state.currentCategoryId);
        if (!category) return;

        const keys = ["north", "east", "south"];

        const articleOptions = category.articles.slice(0, 3).map((article, index) => ({
            key: keys[index],
            title: article.title,
            value: article.id
        }));

        articleOptions.push({
            key: "west",
            title: "Zurück",
            value: "back"
        });

        startCompassInteraction({
            options: articleOptions,
            onLock: (option) => {
                setTimeout(() => {
                    if (option.value === "back") {
                        renderMainToc();
                        showScreen("main-toc");
                    } else {
                        selectArticle(option.value);
                    }
                }, 800);
            }
        });
    }
}

function startWalkGoal(meters, callback, label = "Gehe weiter.") {
    state.walkGoal = meters;
    state.walkedMeters = 0;
    state.afterWalk = callback;

    document.querySelector("#walkTransitionTitle").textContent = label;
    updateMetersUI();

    showScreen("walk-transition");
}

function simulateWalk(amount = 10) {
    if (!state.walkGoal) return;

    state.walkedMeters = Math.min(state.walkedMeters + amount, state.walkGoal);
    updateMetersUI();

    if (state.walkedMeters >= state.walkGoal) {
        const callback = state.afterWalk;
        state.walkGoal = null;
        state.walkedMeters = 0;
        state.afterWalk = null;
        if (callback) callback();
    }
}

function updateMetersUI() {
    const remaining = Math.max(0, Math.ceil((state.walkGoal || 0) - state.walkedMeters));
    const progress = state.walkGoal ? state.walkedMeters / state.walkGoal : 0;

    coverMeters.textContent = state.screen === "cover" ? remaining || 50 : coverMeters.textContent;
    transitionMeters.textContent = remaining;

    walkingAnimation.style.setProperty("--walk-progress", `${progress * 100}%`);
}

function renderArticle(article, options = {}) {
    state.currentArticle = article;
    state.currentPageIndex = 0;

    articleEyebrow.textContent = options.eyebrow || article.category || "Artikel";
    articleTitle.textContent = article.title;

    showScreen("article-reader");
    renderCurrentPage();
}

function renderCurrentPage() {
    const article = state.currentArticle;
    if (!article) return;

    articlePage.textContent = article.pages[state.currentPageIndex];
    pageCurrent.textContent = state.currentPageIndex + 1;
    pageTotal.textContent = article.pages.length;
}

function pageTurn() {
    const article = state.currentArticle;
    if (!article) return;

    const isLastPage = state.currentPageIndex >= article.pages.length - 1;

    if (!isLastPage) {
        state.currentPageIndex += 1;
        renderCurrentPage();
        return;
    }

    handleArticleFinished();
}

function handleArticleFinished() {
    if (state.currentArticle.id === "introduction") {
        startWalkGoal(state.selectedDistance || 100, () => {
            renderMainToc();
            showScreen("main-toc");
        }, "Laufpause bis zum Inhaltsverzeichnis.");
        return;
    }

    startWalkGoal(state.selectedDistance || 100, () => {
        renderCategoryCompass(state.currentCategoryId);
        showScreen("category-compass");
    }, "Laufpause zurück zur Artikelübersicht.");
}

function renderMainToc() {
    mainTocOptions.innerHTML = "";

    READER_CONTENT.categories.forEach((category) => {
        const button = document.createElement("button");
        button.textContent = category.title;
        button.dataset.action = "select-category";
        button.dataset.categoryId = category.id;
        mainTocOptions.appendChild(button);
    });
}

function setGlobalCompassTitle(text = "") {
    if (globalCategoryTitle) {
        globalCategoryTitle.textContent = text;
    }
}

function setCompassInstruction(text = "") {
    const instruction = document.querySelector(
        '[data-screen="calibration-compass"] .compass-instruction'
    );

    if (instruction) {
        instruction.textContent = text;
    }
}

function selectCategory(categoryId) {
    const category = findCategory(categoryId);
    if (!category) return;

    state.currentCategoryId = category.id;
    categoryTitle.textContent = category.title;
    categoryIntro.textContent = category.intro;

    showScreen("category-intro");
}

function renderCategoryCompass(categoryId) {
    const category = findCategory(categoryId);
    if (!category) return;

    categoryCompassTitle.textContent = category.title;
    categoryArticleOptions.innerHTML = "";

    category.articles.forEach((article) => {
        const button = document.createElement("button");
        button.textContent = article.title;
        button.dataset.action = "select-article";
        button.dataset.articleId = article.id;
        categoryArticleOptions.appendChild(button);
    });

    const backButton = document.createElement("button");
    backButton.textContent = "Zurück zum Inhaltsverzeichnis";
    backButton.dataset.action = "back-to-main-toc";
    categoryArticleOptions.appendChild(backButton);
}

function selectArticle(articleId) {
    const category = findCategory(state.currentCategoryId);
    if (!category) return;

    const article = category.articles.find((item) => item.id === articleId);
    if (!article) return;

    const articleWithCategory = {
        ...article,
        category: category.title
    };

    startWalkGoal(50, () => {
        renderArticle(articleWithCategory, { eyebrow: category.title });
    }, `Gehe 50m bis zum Artikel „${article.title}“.`);
}

function findCategory(categoryId) {
    return READER_CONTENT.categories.find((category) => category.id === categoryId);
}

let compassHeading = 0;
let compassActiveConfig = null;
let compassHoveredOption = null;
let compassHoverStartTime = null;
let compassLockedOption = null;
let compassLockHeading = null;

const COMPASS_LOCK_DELAY = 5000;
const COMPASS_UNLOCK_ANGLE = 45;

const compassAngles = {
    north: 0,
    east: 90,
    south: 180,
    west: 270
};

function startCompassInteraction(config) {
    compassActiveConfig = config;
    compassHoveredOption = null;
    compassHoverStartTime = null;
    compassLockedOption = null;
    compassLockHeading = null;

    updateCompass();
}

function getActiveCompassElements() {
    const container = document.querySelector(
        `[data-screen="${state.screen}"] .compass-container`
    );

    if (!container) return null;

    return {
        container,
        oval: container.querySelector(".compass-oval"),
        target: container.querySelector(".target-compass"),
        dots: {
            north: container.querySelector(".dot-north"),
            east: container.querySelector(".dot-east"),
            south: container.querySelector(".dot-south"),
            west: container.querySelector(".dot-west")
        }
    };
}

function getCompassOptions() {
    if (!compassActiveConfig) return [];

    return compassActiveConfig.options.map((option) => ({
        ...option,
        angle: compassAngles[option.key]
    }));
}

function placeCompassDot(option, elements) {
    const dot = elements.dots[option.key];
    if (!dot) return;

    const width = elements.oval.offsetWidth;
    const height = elements.oval.offsetHeight;

    const cx = width / 2;
    const cy = height / 2;

    const rx = width / 2;
    const ry = height / 2;

    const angleDeg = compassHeading + option.angle;
    const angle = (angleDeg - 90) * Math.PI / 180;

    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);

    dot.style.display = "block";
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
}

function isCompassDotInsideTarget(dot, target) {
    const dotRect = dot.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const dotCenterX = dotRect.left + dotRect.width / 2;
    const dotCenterY = dotRect.top + dotRect.height / 2;

    return (
        dotCenterX >= targetRect.left &&
        dotCenterX <= targetRect.right &&
        dotCenterY >= targetRect.top &&
        dotCenterY <= targetRect.bottom
    );
}

function compassAngleDifference(a, b) {
    let diff = Math.abs(a - b);

    if (diff > 180) {
        diff = 360 - diff;
    }

    return diff;
}

function clearCompassDotStates(elements) {
    Object.values(elements.dots).forEach((dot) => {
        dot.classList.remove("is-active");
        dot.classList.remove("is-locked");
        dot.style.display = "none";
    });
}

function getCompassOptionInsideTarget(options, elements) {
    return options.find((option) => {
        const dot = elements.dots[option.key];
        return dot && isCompassDotInsideTarget(dot, elements.target);
    }) || null;
}

function updateCompassLockState(options, elements) {
    clearCompassDotStates(elements);

    options.forEach((option) => {
        const dot = elements.dots[option.key];
        if (dot) dot.style.display = "block";
    });

    if (compassLockedOption) {
        const diff = compassAngleDifference(compassHeading, compassLockHeading);

        if (diff > COMPASS_UNLOCK_ANGLE) {
            compassLockedOption = null;
            compassLockHeading = null;
            compassHoveredOption = null;
            compassHoverStartTime = null;

            setGlobalCompassTitle("");

            if (state.screen === "calibration-compass") {
                setCompassInstruction("Drehe dich so, dass ein Punkt oben einrastet.");
            }

            options.forEach((option) => placeCompassDot(option, elements));
            return;
        }

        elements.dots[compassLockedOption.key].classList.add("is-locked");
        setGlobalCompassTitle(compassLockedOption.title);

        if (state.screen === "calibration-compass") {
            setCompassInstruction(
                "Diese Option ist jetzt ausgewählt – gehe 10m geradeaus, um deine Auswahl zu bestätigen."
            );
        }

        return;
    }

    const optionInsideTarget = getCompassOptionInsideTarget(options, elements);

    if (!optionInsideTarget) {
        compassHoveredOption = null;
        compassHoverStartTime = null;

        setGlobalCompassTitle("");

        if (state.screen === "calibration-compass") {
            setCompassInstruction("Drehe dich so, dass ein Punkt oben einrastet.");
        }

        return;
    }

    elements.dots[optionInsideTarget.key].classList.add("is-active");
    setGlobalCompassTitle(optionInsideTarget.title);

    if (state.screen === "calibration-compass") {
        setCompassInstruction(
            "Diese Option ist jetzt ausgewählt – gehe 10m geradeaus, um deine Auswahl zu bestätigen."
        );
    }

    if (compassHoveredOption !== optionInsideTarget) {
        compassHoveredOption = optionInsideTarget;
        compassHoverStartTime = Date.now();
        return;
    }

    const hoverDuration = Date.now() - compassHoverStartTime;

    if (hoverDuration >= COMPASS_LOCK_DELAY) {
        compassLockedOption = optionInsideTarget;
        compassLockHeading = compassHeading;

        compassHoveredOption = null;
        compassHoverStartTime = null;

        elements.dots[compassLockedOption.key].classList.remove("is-active");
        elements.dots[compassLockedOption.key].classList.add("is-locked");

        setGlobalCompassTitle(compassLockedOption.title);

        if (typeof compassActiveConfig.onLock === "function") {
            compassActiveConfig.onLock(compassLockedOption);
        }
    }
}

function updateCompass() {
    const elements = getActiveCompassElements();
    if (!elements || !compassActiveConfig) return;

    const options = getCompassOptions();

    if (!compassLockedOption) {
        options.forEach((option) => placeCompassDot(option, elements));
    }

    updateCompassLockState(options, elements);
}

function handleOrientation(event) {
    if (event.webkitCompassHeading !== undefined) {
        compassHeading = event.webkitCompassHeading;
    } else if (event.alpha !== null) {
        compassHeading = 360 - event.alpha;
    }

    updateCompass();
}

window.addEventListener("deviceorientation", handleOrientation, true);

async function requestPermissions() {
    permissionStatus.textContent = "Berechtigungen werden angefragt …";

    try {
        if (
            typeof DeviceMotionEvent !== "undefined" &&
            typeof DeviceMotionEvent.requestPermission === "function"
        ) {
            const motionPermission = await DeviceMotionEvent.requestPermission();

            if (motionPermission !== "granted") {
                throw new Error("Motion access denied.");
            }
        }

        if (
            typeof DeviceOrientationEvent !== "undefined" &&
            typeof DeviceOrientationEvent.requestPermission === "function"
        ) {
            const orientationPermission = await DeviceOrientationEvent.requestPermission();

            if (orientationPermission !== "granted") {
                throw new Error("Orientation access denied.");
            }
        }

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    localStorage.setItem("motionAccess", "granted");
                    localStorage.setItem("locationAccess", "granted");

                    localStorage.setItem(
                        "startLocation",
                        JSON.stringify({
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        })
                    );

                    permissionOverlay.classList.remove("is-visible");
                    startCoverWalk();
                },
                () => {
                    permissionStatus.textContent =
                        "Standort konnte nicht gelesen werden. Bitte erlaube den Standortzugriff auf der Startseite.";

                    localStorage.removeItem("locationAccess");
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 20000
                }
            );
        } else {
            throw new Error("Geolocation wird von diesem Browser nicht unterstützt.");
        }
    } catch (error) {
        console.error(error);

        permissionStatus.textContent =
            "Berechtigungen konnten nicht vollständig angefragt werden. Bitte gehe zurück zur Startseite und erlaube den Zugriff dort.";
    }
}

function startCoverWalk() {
    state.walkGoal = 50;
    state.walkedMeters = 0;
    state.afterWalk = () => showScreen("calibration-intro");
    showScreen("cover");
    updateMetersUI();
}

function handleClick(event) {
    const button = event.target.closest("button");
    if (!button) return;

    const action = button.dataset.action;

    if (button.id === "permissionButton") {
        requestPermissions();
        return;
    }

    if (action === "next") {
        showScreen(button.dataset.next);
    }

    if (action === "simulate-walk") {
        simulateWalk(10);
    }

    if (action === "page-turn") {
        pageTurn();
    }

    if (action === "select-category") {
        selectCategory(button.dataset.categoryId);
    }

    if (action === "open-category-compass") {
        renderCategoryCompass(state.currentCategoryId);
        showScreen("category-compass");
    }

    if (action === "select-article") {
        selectArticle(button.dataset.articleId);
    }

    if (action === "back-to-main-toc") {
        renderMainToc();
        showScreen("main-toc");
    }
}

document.addEventListener("click", handleClick);

showScreen("cover");

permissionOverlay?.classList.add("is-visible");