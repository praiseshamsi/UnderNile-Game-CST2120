//selecting ranking page elements and also the sign out button 
const rankingsBody = document.querySelector("#rankingsBody");
const noScoresMessage = document.querySelector("#noScoresMessage");
const personalBestScore = document.querySelector("#personalBestScore");
const signOutButton = document.querySelector("#signOutButton");
//reading the signed in user email from local storage
const currentUserEmail = (
    localStorage.getItem("undernileCurrentUser") || ""
).toLowerCase();

let users = [];

try {
    const savedUsers = JSON.parse(
        localStorage.getItem("undernileUsers") || "[]"
    );

    if (Array.isArray(savedUsers)) {
        users = savedUsers;
    }
} catch {
    users = [];
}
//function to display users scores
function displayRankings() {
    if (!rankingsBody || !noScoresMessage) return;

    rankingsBody.replaceChildren();

    const players = users
        .map(user => ({
            ...user,
            highScore: Number(user.highScore)
        }))
        .filter(user => Number.isFinite(user.highScore) && user.highScore > 0)
        .sort((a, b) => b.highScore - a.highScore);

    noScoresMessage.hidden = players.length > 0;

    if (players.length === 0) return;
    //creating table row for players
    players.forEach((player, index) => {
        const row = document.createElement("tr");

        if ((player.email || "").toLowerCase() === currentUserEmail) {
            row.classList.add("current-player");
        }

        const values = [
            index + 1,
            player.name || "Player",
            player.highScore
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        rankingsBody.appendChild(row);
    });
}
//function to display the signed user bes score
function displayPersonalBest() {
    if (!personalBestScore) return;

    if (!currentUserEmail) {
        personalBestScore.textContent = "Log in to view your best score.";
        return;
    }

    const player = users.find(
        user => (user.email || "").toLowerCase() === currentUserEmail
    );

    if (!player) {
        personalBestScore.textContent = "Player account not found.";
        return;
    }

    const score = Number(player.highScore) || 0;
    personalBestScore.textContent = `${player.name || "Player"}: ${score} points`;
}
//signing out back to login 
if (signOutButton) {
    signOutButton.addEventListener("click", function () {
        localStorage.removeItem("undernileCurrentUser");
        window.location.href = "login.html";
    });
}
//showing the scores.
displayRankings();
displayPersonalBest();