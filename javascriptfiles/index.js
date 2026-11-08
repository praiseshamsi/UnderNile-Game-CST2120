//selecting the buttons and message 
const levelButtons = document.querySelectorAll(".level-button");
const startButton = document.querySelector("#startGameButton");
const signOutButton = document.querySelector("#signOutButton");
const levelMessage = document.querySelector("#levelMessage");
// setting the local storage keys for level progress.
const selectedLevelKey = "undernileSelectedLevel";
const unlockedLevelKey = "undernileUnlockedLevel";

let unlockedLevel = Number(localStorage.getItem(unlockedLevelKey)) || 1;
let selectedLevel = Number(localStorage.getItem(selectedLevelKey)) || 1;

//keeping the selected level within the unlocked range
if (selectedLevel > unlockedLevel) {
    selectedLevel = unlockedLevel;
}
// function for updating each level button to show whether it is unlocked or selected.
function updateLevelButtons() {
    levelButtons.forEach(button => {
        const level = Number(button.dataset.level);
        const isUnlocked = level <= unlockedLevel;
        const isSelected = level === selectedLevel;

        button.disabled = !isUnlocked;
        button.classList.toggle("selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));

        if (!isUnlocked) {
            button.textContent = `Level ${level} — Locked`;
        } else {
            button.textContent = `Level ${level}`;
        }
    });
}

//saving a level when the player selects it
levelButtons.forEach(button => {
    button.addEventListener("click", function () {
        const level = Number(button.dataset.level);

        if (level > unlockedLevel) {
            return;
        }

        selectedLevel = level;
        localStorage.setItem(selectedLevelKey, String(selectedLevel));

        if (levelMessage) {
            levelMessage.textContent = `Level ${selectedLevel} selected.`;
        }

        updateLevelButtons();
    });
});

// Opening the gamescen epage with the selected level saved
if (startButton) {
    startButton.addEventListener("click", function (event) {
        event.preventDefault();

        localStorage.setItem(selectedLevelKey, String(selectedLevel));
        window.location.href = "gamescene.html";
    });
}

// Sign out and return to the login page.
if (signOutButton) {
    signOutButton.addEventListener("click", function () {
        localStorage.removeItem("undernileCurrentUser");
        window.location.href = "login.html";
    });
}

updateLevelButtons();