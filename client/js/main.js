const API_BASE = "/api"; // Use relative path with /api prefix

// DOM Elements
const registrationForm = document.getElementById("registrationForm");
const submitButton = document.getElementById("submitButton");
const messageDiv = document.getElementById("message");
const usersContainer = document.getElementById("usersContainer");

// Form submission handler
registrationForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get form data
  const formData = {
    username: document.getElementById("username").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
  };

  // Show loading state
  setLoadingState(true);
  hideMessage();

  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    handleRegistrationResponse(result);
  } catch (error) {
    showMessage("Network error. Please try again.", "error");
    console.error("Registration error:", error);
  } finally {
    setLoadingState(false);
  }
});

// Set loading state
function setLoadingState(isLoading) {
  if (isLoading) {
    submitButton.textContent = "Registering...";
    submitButton.classList.add("loading");
  } else {
    submitButton.textContent = "Register";
    submitButton.classList.remove("loading");
  }
}

// Hide message
function hideMessage() {
  messageDiv.style.display = "none";
}

// Show message
function showMessage(text, type) {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = "block";
}

// Handle registration response
function handleRegistrationResponse(result) {
  if (result.success) {
    showMessage(result.message || "Registration successful!", "success");
    registrationForm.reset();
    loadUsers();
  } else {
    let errorMessage = result.message || "Registration failed";

    // Add validation errors if any
    if (result.errors) {
      const errorDetails = result.errors.map((error) => error.msg).join(", ");
      errorMessage += `: ${errorDetails}`;
    }

    showMessage(errorMessage, "error");
  }
}

// Load registered users
async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE}/users`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const users = await response.json();
    displayUsers(users);
  } catch (error) {
    console.error("Error loading users:", error);
    usersContainer.innerHTML =
      '<div class="user-item">Error loading users: ' + error.message + "</div>";
  }
}

// Display users in the UI
function displayUsers(users) {
  if (users.length === 0) {
    usersContainer.innerHTML =
      '<div class="user-item">No users registered yet</div>';
  } else {
    usersContainer.innerHTML = users
      .map(
        (user) => `
            <div class="user-item">
                <strong>${user.username}</strong> (${user.email})<br>
                <small>Registered: ${new Date(
                  user.created_at
                ).toLocaleDateString()}</small>
            </div>
        `
      )
      .join("");
  }
}

// Load users when page loads
document.addEventListener("DOMContentLoaded", loadUsers);
