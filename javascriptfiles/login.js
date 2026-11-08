//selecting the login form and feedback error 
const loginForm = document.querySelector("#loginForm");
const feedback = document.querySelector("#FeedbackError");
//connecting form 
loginForm.addEventListener("submit", handleLogin);
//function for login and checking users entered information 
function handleLogin(event) {
    event.preventDefault();

    feedback.textContent = "";
    feedback.classList.remove("success");

    const email = document.querySelector("#emailInput")
        .value.trim().toLowerCase();
    const password = document.querySelector("#passwordInput").value;

    if (email === "") {
        showError("Please enter your email address.");
        return;
    }

    if (password === "") {
        showError("Please enter your password.");
        return;
    }
    //loading saved accounts from local storage
    let users;

    try {
        users = JSON.parse(localStorage.getItem("undernileUsers") || "[]");
    } catch {
        showError("Could not read saved accounts. Please try again.");
        return;
    }

    if (!Array.isArray(users)) {
        showError("Saved account data is invalid.");
        return;
    }

    const user = users.find(account =>
        (account.email || "").toLowerCase() === email
    );

    if (!user) {
        showError("No account found with this email address.");
        return;
    }

    if (user.password !== password) {
        showError("Incorrect password. Please try again.");
        return;
    }

    localStorage.setItem("undernileCurrentUser", user.email);

    feedback.textContent = `Login successful! Welcome back, ${user.name}.`;
    feedback.classList.add("success");

    setTimeout(function () {
        window.location.href = "game.html";
    }, 500);
}
//displaying the error message
function showError(message) {
    feedback.textContent = message;
}