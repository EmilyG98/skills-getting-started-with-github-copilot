document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select to avoid duplicate options on re-fetch
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = (details.max_participants || 0) - (details.participants?.length || 0);

        // Basic info
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsHeader = document.createElement('p');
        participantsHeader.innerHTML = '<strong>Participants:</strong>';
        activityCard.appendChild(participantsHeader);

        const participantsListEl = document.createElement('ul');
        participantsListEl.className = 'participants-list';
        participantsListEl.style.listStyle = 'none';
        participantsListEl.style.paddingLeft = '0';
        participantsListEl.style.marginLeft = '0';

        const participants = details.participants || [];
        if (participants.length > 0) {
          participants.forEach(p => {
            const li = document.createElement('li');
            const text = typeof p === 'string' ? p : (p.email || p.name || JSON.stringify(p));

            const participantText = document.createElement('span');
            participantText.textContent = text;
            li.appendChild(participantText);

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-participant-btn';
            removeButton.textContent = '×';
            removeButton.title = `Remove ${text}`;
            removeButton.setAttribute('aria-label', `Remove ${text}`);
            removeButton.style.marginLeft = '12px';
            removeButton.style.display = 'inline-block';
            removeButton.addEventListener('click', () => {
              unregisterParticipant(name, text);
            });

            li.appendChild(removeButton);
            participantsListEl.appendChild(li);
          });
        } else {
          const li = document.createElement('li');
          li.textContent = 'No participants yet';
          li.className = 'no-participants';
          participantsListEl.appendChild(li);
        }

        activityCard.appendChild(participantsListEl);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Unable to remove participant";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error removing participant:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
