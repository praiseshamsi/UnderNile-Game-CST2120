//selecting the form
const signupForm = document.querySelector("#signupForm");
const feedback = document.querySelector("#FeedbackError");

//connecting form to signup handler 
signupForm.addEventListener("submit", handleSignup);

//function to validate the entered details in the form
function handleSignup(event) {
    event.preventDefault();

    feedback.textContent = "";
    feedback.classList.remove("success");

    const name = document.querySelector("#nameInput").value.trim();
    const email = document.querySelector("#emailInput")
        .value.trim().toLowerCase();
    const password = document.querySelector("#passwordInput").value;
    const confirmPassword =
        document.querySelector("#confirmPasswordInput").value;

    if (
        name === "" &&
        email === "" &&
        password.trim() === "" &&
        confirmPassword.trim() === ""
    ) {
        showError("Please fill in all fields.");
        return;
    }

    //format for email and passwords
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (name === "") {
        showError("Please enter your name.");
        return;
    }

    if (!emailRegex.test(email)) {
        showError("Please enter a valid email address.");
        return;
    }

    if (!passwordRegex.test(password)) {
        showError(
            "Password needs at least 8 characters, uppercase and lowercase " +
            "letters, a number, and a special character."
        );
        return;
    }

    if (password !== confirmPassword) {
        showError("Passwords do not match.");
        return;
    }

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

    const emailExists = users.some(user =>
        (user.email || "").toLowerCase() === email
    );

    if (emailExists) {
        showError("This email is already registered.");
        return;
    }

    users.push({
        name: name,
        email: email,
        password: password,
        highScore: 0
    });

    try {
        localStorage.setItem("undernileUsers", JSON.stringify(users));
    } catch {
        showError("Could not save the account. Please try again.");
        return;
    }

    feedback.textContent =
        "Account created successfully! You can now log in.";
    feedback.classList.add("success");
    signupForm.reset();
}

//display error message to the user function
function showError(message) {
    feedback.textContent = message;
}