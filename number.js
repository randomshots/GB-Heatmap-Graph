// User mapping - same as in other files
const defaultAtCoderUsers = [
  "jalaluddin420",
  "sonu24",
  "manichandana",
  "lrv",
  "shiva_karthik121",
  "advaithchaitanya",
  "bharathkumarbilakanti",
  "jakkalaramu",
  "manojvakiti",
];

const defaultCodeforcesUsers = [
  "jalaluddin420",
  "_soma_shekar_",
  "manichandanaa",
  "lrvkausthubh",
  "shiva_karthik121",
  "advaithchaitanya",
  "bharathkumarbilakanti",
  "codercp",
  "manojvakiti",
];

const userNames = {
  jalaluddin420: "Jalaluddin",
  sonu24: "Sonu",
  manichandana: "Mani Chandana",
  lrv: "LRV Kausthubh",
  shiva_karthik121: "Shiva Karthik",
  advaithchaitanya: "Advaith Chaitanya",
  bharathkumarbilakanti: "Bharath",
  jakkalaramu: "Jakkala Ramu",
  manojvakiti: "Manoj Vakiti",
};

const userMapping = {};
defaultAtCoderUsers.forEach((atcoderHandle, index) => {
  userMapping[atcoderHandle] = defaultCodeforcesUsers[index];
});

// Global variables
let allHeatMapData = [];
let currentYear = new Date().getFullYear();

// Fetch AtCoder submissions for heat map

// ...existing code...
async function fetchAtCoderSubmissions(user) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(
      `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${user}&from_second=0`,
      { signal: controller.signal },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`AtCoder API returned ${response.status} for ${user}`);
      return [];
    }

    const submissions = await response.json();
    // Filter only accepted submissions
    return submissions
      .filter((sub) => sub.result === "AC")
      .map((sub) => ({
        date: new Date(sub.epoch_second * 1000).toISOString().split("T")[0],
        platform: "atcoder",
        result: sub.result,
      }));
  } catch (err) {
    if (err.name === "AbortError") {
      console.error(`Timeout fetching AtCoder data for ${user}`);
    } else {
      console.error(`Error fetching AtCoder data for ${user}:`, err);
    }
    return [];
  }
}
// ...existing code...

// Fetch Codeforces submissions for heat map

// ...existing code...
async function fetchCodeforcesSubmissions(user) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(
      `https://codeforces.com/api/user.status?handle=${user}`,
      { signal: controller.signal },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Codeforces API returned ${response.status} for ${user}`);
      return [];
    }

    const data = await response.json();
    if (data.status !== "OK") {
      console.warn(
        `Codeforces API error for ${user}: ${data.comment || "Unknown error"}`,
      );
      return [];
    }

    // Filter only accepted submissions
    return data.result
      .filter((sub) => sub.verdict === "OK")
      .map((sub) => ({
        date: new Date(sub.creationTimeSeconds * 1000)
          .toISOString()
          .split("T")[0],
        platform: "codeforces",
        result: sub.verdict,
      }));
  } catch (err) {
    if (err.name === "AbortError") {
      console.error(`Timeout fetching Codeforces data for ${user}`);
    } else {
      console.error(`Error fetching Codeforces data for ${user}:`, err);
    }
    return [];
  }
}
// ...existing code...

// Get activity level based on submission count
function getActivityLevel(count) {
  if (count === 0) return 0;
  if (count <= 5) return 1;
  if (count <= 10) return 2;
  if (count <= 20) return 3;
  return 4;
}

// Create heat map for a user
function createHeatMap(submissions, year) {
  const container = document.createElement("div");
  container.className = "user-heatmap";

  // Group submissions by date
  const submissionsByDate = {};
  submissions.forEach((sub) => {
    const subYear = new Date(sub.date).getFullYear();
    if (subYear === year) {
      if (!submissionsByDate[sub.date]) {
        submissionsByDate[sub.date] = 0;
      }
      submissionsByDate[sub.date]++;
    }
  });

  // Create month labels
  const monthLabels = document.createElement("div");
  monthLabels.className = "month-labels";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  months.forEach((month) => {
    const label = document.createElement("span");
    label.textContent = month;
    monthLabels.appendChild(label);
  });
  container.appendChild(monthLabels);

  // Create grid container
  const gridContainer = document.createElement("div");
  gridContainer.className = "heatmap-grid";

  // Create day labels
  const dayLabels = document.createElement("div");
  dayLabels.className = "day-labels";
  const days = ["", "Mon", "", "Wed", "", "Fri", ""];
  days.forEach((day) => {
    const label = document.createElement("span");
    label.textContent = day;
    dayLabels.appendChild(label);
  });
  gridContainer.appendChild(dayLabels);

  // Create weeks container
  const weeksContainer = document.createElement("div");
  weeksContainer.className = "heatmap-weeks";

  // Start from first day of the year
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  // Adjust to start from Sunday
  const startDay = startDate.getDay();
  if (startDay !== 0) {
    startDate.setDate(startDate.getDate() - startDay);
  }

  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const count = submissionsByDate[dateStr] || 0;
    const level = getActivityLevel(count);

    const cell = document.createElement("div");
    cell.className = "day-cell";
    cell.setAttribute("data-level", level);
    cell.setAttribute("data-date", dateStr);
    cell.setAttribute("data-count", count);

    // Tooltip on hover
    cell.addEventListener("mouseenter", (e) => {
      showTooltip(e, dateStr, count);
    });

    cell.addEventListener("mouseleave", () => {
      hideTooltip();
    });

    weeksContainer.appendChild(cell);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  gridContainer.appendChild(weeksContainer);
  container.appendChild(gridContainer);

  return container;
}

// Create user card with dropdown

// ...existing code...

// ...existing code...
function createUserCard(
  userName,
  atcoderHandle,
  codeforcesHandle,
  submissions,
  year,
) {
  const card = document.createElement("div");
  card.className = "user-card";
  card.setAttribute("data-username", userName.toLowerCase());

  // Calculate stats for this user
  const stats = calculateStats(submissions, year);

  // Card Header
  const header = document.createElement("div");
  header.className = "user-card-header";

  const titleSection = document.createElement("div");
  titleSection.className = "user-card-title";

  const title = document.createElement("h2");
  title.textContent = userName;

  // Add graph icon button
  const graphButton = document.createElement("button");
  graphButton.className = "graph-icon-button";
  graphButton.innerHTML = '<i class="fas fa-chart-line"></i>';
  graphButton.title = "View Graph";
  graphButton.addEventListener("click", (e) => {
    e.stopPropagation();
    // Store user data in localStorage
    const userData = {
      userName,
      atcoderHandle,
      codeforcesHandle,
      year,
    };
    localStorage.setItem("graphUserData", JSON.stringify(userData));
    // Redirect to graph page
    window.location.href = "graph.html";
  });

  const toggleIcon = document.createElement("i");
  toggleIcon.className = "fas fa-chevron-down toggle-icon";

  titleSection.appendChild(title);
  titleSection.appendChild(graphButton);
  titleSection.appendChild(toggleIcon);

  // Stats Section
  const statsSection = document.createElement("div");
  statsSection.className = "user-card-stats";

  const statsData = [
    { label: "Accepted", value: stats.totalSubmissions },
    { label: "Active Days", value: stats.activeDays },
    { label: "Current Streak", value: stats.currentStreak },
    { label: "Longest Streak", value: stats.longestStreak },
  ];

  statsData.forEach((stat) => {
    const statItem = document.createElement("div");
    statItem.className = "stat-item";
    statItem.innerHTML = `
            <div class="stat-value">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
        `;
    statsSection.appendChild(statItem);
  });

  header.appendChild(titleSection);
  header.appendChild(statsSection);

  // Card Content (Heat Map)
  const content = document.createElement("div");
  content.className = "user-card-content";

  const heatMap = createHeatMap(submissions, year);
  content.appendChild(heatMap);

  // Toggle functionality
  header.addEventListener("click", (e) => {
    // Don't toggle if clicking the graph button
    if (e.target.closest(".graph-icon-button")) return;

    const isExpanded = header.classList.contains("expanded");

    if (isExpanded) {
      header.classList.remove("expanded");
      content.classList.remove("expanded");
    } else {
      header.classList.add("expanded");
      content.classList.add("expanded");
    }
  });

  card.appendChild(header);
  card.appendChild(content);

  return card;
}
// ...existing code...

// Tooltip functions
let tooltip = null;

// ...existing code...
function showTooltip(event, date, count) {
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    document.body.appendChild(tooltip);
  }

  tooltip.textContent = `${date}: ${count} accepted`;
  tooltip.style.display = "block";
  tooltip.style.left = event.pageX + 10 + "px";
  tooltip.style.top = event.pageY + 10 + "px";
}
// ...existing code...

function hideTooltip() {
  if (tooltip) {
    tooltip.style.display = "none";
  }
}

// Calculate statistics
function calculateStats(submissions, year) {
  const yearSubmissions = submissions.filter((sub) => {
    const subYear = new Date(sub.date).getFullYear();
    return subYear === year;
  });

  const uniqueDates = new Set(yearSubmissions.map((sub) => sub.date));
  const activeDays = uniqueDates.size;

  // Calculate streaks
  const sortedDates = Array.from(uniqueDates).sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date().toISOString().split("T")[0];
  let lastDate = null;

  sortedDates.forEach((date, index) => {
    if (lastDate) {
      const daysDiff =
        (new Date(date) - new Date(lastDate)) / (1000 * 60 * 60 * 24);
      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }

    lastDate = date;

    // Check if streak continues to today
    if (index === sortedDates.length - 1) {
      const daysFromToday =
        (new Date(today) - new Date(date)) / (1000 * 60 * 60 * 24);
      if (daysFromToday <= 1) {
        currentStreak = tempStreak;
      }
    }
  });

  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    totalSubmissions: yearSubmissions.length,
    activeDays,
    currentStreak,
    longestStreak,
  };
}

// Load and render heat maps with batch fetching for better performance
// Load and render heat maps with batch fetching and detailed progress
async function loadAndRenderHeatMaps() {
  const loading = document.getElementById("loading");
  const error = document.getElementById("error");
  const statsSummary = document.getElementById("stats-summary");
  const heatmapContainer = document.getElementById("heatmap-container");
  const legend = document.getElementById("legend");

  loading.classList.remove("hidden");
  error.classList.add("hidden");
  statsSummary.classList.add("hidden");
  heatmapContainer.classList.add("hidden");
  legend.classList.add("hidden");

  try {
    allHeatMapData = [];

    // Clear container before starting
    heatmapContainer.innerHTML = "";

    const totalUsers = defaultAtCoderUsers.length;
    let processedCount = 0;

    console.log(`Processing ${totalUsers} users...`);

    // Update initial loading message
    updateLoadingProgress("Initializing...", 0, totalUsers);

    // Process users one by one to show progress for each user
    for (let i = 0; i < defaultAtCoderUsers.length; i++) {
      const atcoderHandle = defaultAtCoderUsers[i];
      const codeforcesHandle = userMapping[atcoderHandle];
      const userName = userNames[atcoderHandle] || atcoderHandle;

      // Update loading message with current user
      updateLoadingProgress(userName, processedCount, totalUsers);

      try {
        const [atcoderSubs, codeforcesSubs] = await Promise.all([
          fetchAtCoderSubmissions(atcoderHandle),
          fetchCodeforcesSubmissions(codeforcesHandle),
        ]);

        const allSubmissions = [...atcoderSubs, ...codeforcesSubs];

        const userData = {
          userName,
          atcoderHandle,
          codeforcesHandle,
          submissions: allSubmissions,
        };

        allHeatMapData.push(userData);

        // Render this user immediately (progressive rendering)
        renderBatch([userData]);
      } catch (err) {
        console.error(`Error fetching data for ${userName}:`, err);

        // Add user with empty data
        const userData = {
          userName,
          atcoderHandle,
          codeforcesHandle,
          submissions: [],
        };

        allHeatMapData.push(userData);
        renderBatch([userData]);
      }

      // Update processed count
      processedCount++;

      // Small delay between users to avoid rate limiting
      if (i < defaultAtCoderUsers.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // Final progress update
    updateLoadingProgress("Complete!", totalUsers, totalUsers);

    // Update global statistics after all data is loaded
    updateGlobalStats();

    // Hide loading, show content
    setTimeout(() => {
      loading.classList.add("hidden");
      statsSummary.classList.remove("hidden");
      heatmapContainer.classList.remove("hidden");
      legend.classList.remove("hidden");
    }, 500);

    console.log("All heat map data loaded successfully!");
  } catch (err) {
    console.error("Error loading heat map data:", err);
    loading.classList.add("hidden");
    error.classList.remove("hidden");
    document.getElementById("error-message").textContent =
      err.message || "Failed to load heat map data.";
  }
}

// Render a batch of users progressively
function renderBatch(batchData) {
  const heatmapContainer = document.getElementById("heatmap-container");
  const showAtCoder = document.getElementById("show-atcoder").checked;
  const showCodeforces = document.getElementById("show-codeforces").checked;
  const year = parseInt(document.getElementById("year-select").value);

  batchData.forEach((user) => {
    // Filter submissions by platform
    let submissions = user.submissions;
    if (!showAtCoder) {
      submissions = submissions.filter((sub) => sub.platform !== "atcoder");
    }
    if (!showCodeforces) {
      submissions = submissions.filter((sub) => sub.platform !== "codeforces");
    }

    const userCard = createUserCard(
      user.userName,
      user.atcoderHandle,
      user.codeforcesHandle,
      submissions,
      year,
    );

    // Add smooth fade-in animation
    userCard.style.opacity = "0";
    userCard.style.transform = "translateY(20px)";
    heatmapContainer.appendChild(userCard);

    // Trigger animation
    setTimeout(() => {
      userCard.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      userCard.style.opacity = "1";
      userCard.style.transform = "translateY(0)";
    }, 10);
  });
}

// Update loading progress message with user name and percentage - with progress bar
function updateLoadingProgress(userName, loaded, total) {
  const loading = document.getElementById("loading");
  const progressText = document.getElementById("loading-text");
  const progressFill = document.getElementById("progress-fill");
  const progressPercentage = document.getElementById("progress-percentage");

  if (progressText && progressFill && progressPercentage) {
    const percentage = Math.round((loaded / total) * 100);

    // Update progress bar width
    progressFill.style.width = `${percentage}%`;

    // Update percentage text
    progressPercentage.textContent = `${percentage}%`;

    // Update loading message based on state
    if (userName === "Initializing...") {
      progressText.innerHTML = `<strong>Initializing...</strong><br>Preparing to load ${total} users`;
    } else if (userName === "Complete!") {
      progressText.innerHTML = `<strong style="color: var(--secondary-color);">✓ Loading Complete!</strong><br>${total} / ${total} users loaded`;
      progressPercentage.style.color = "var(--secondary-color)";
    } else {
      progressText.innerHTML = `Loading data for <strong>${userName}</strong><br>${loaded} / ${total} users`;
    }
  }
}

// Update global statistics from all loaded data
function updateGlobalStats() {
  const showAtCoder = document.getElementById("show-atcoder").checked;
  const showCodeforces = document.getElementById("show-codeforces").checked;
  const year = parseInt(document.getElementById("year-select").value);

  let totalSubs = 0;
  let totalActiveDays = 0;
  let maxCurrentStreak = 0;
  let maxLongestStreak = 0;

  allHeatMapData.forEach((user) => {
    // Filter submissions by platform
    let submissions = user.submissions;
    if (!showAtCoder) {
      submissions = submissions.filter((sub) => sub.platform !== "atcoder");
    }
    if (!showCodeforces) {
      submissions = submissions.filter((sub) => sub.platform !== "codeforces");
    }

    const stats = calculateStats(submissions, year);
    totalSubs += stats.totalSubmissions;
    totalActiveDays += stats.activeDays;
    maxCurrentStreak = Math.max(maxCurrentStreak, stats.currentStreak);
    maxLongestStreak = Math.max(maxLongestStreak, stats.longestStreak);
  });

  // Update global stats with animation
  animateStatValue("total-submissions", totalSubs);
  animateStatValue("active-days", totalActiveDays);
  animateStatValue("current-streak", maxCurrentStreak);
  animateStatValue("longest-streak", maxLongestStreak);
}

// Animate stat value changes
function animateStatValue(elementId, finalValue) {
  const element = document.getElementById(elementId);
  const currentValue = parseInt(element.textContent) || 0;

  if (currentValue === finalValue) return;

  const duration = 500; // 500ms animation
  const steps = 20;
  const increment = (finalValue - currentValue) / steps;
  const stepDuration = duration / steps;

  let step = 0;
  const timer = setInterval(() => {
    step++;
    const newValue = Math.round(currentValue + increment * step);
    element.textContent = step === steps ? finalValue : newValue;

    if (step >= steps) {
      clearInterval(timer);
    }
  }, stepDuration);
}

// Render heat maps based on filters
function renderHeatMaps() {
  const heatmapContainer = document.getElementById("heatmap-container");
  const showAtCoder = document.getElementById("show-atcoder").checked;
  const showCodeforces = document.getElementById("show-codeforces").checked;
  const year = parseInt(document.getElementById("year-select").value);

  // Clear container
  heatmapContainer.innerHTML = "";

  // Render all users with current filters
  allHeatMapData.forEach((user) => {
    // Filter submissions by platform
    let submissions = user.submissions;
    if (!showAtCoder) {
      submissions = submissions.filter((sub) => sub.platform !== "atcoder");
    }
    if (!showCodeforces) {
      submissions = submissions.filter((sub) => sub.platform !== "codeforces");
    }

    const userCard = createUserCard(
      user.userName,
      user.atcoderHandle,
      user.codeforcesHandle,
      submissions,
      year,
    );
    heatmapContainer.appendChild(userCard);
  });

  // Update global statistics
  updateGlobalStats();
}

// Search functionality
function setupSearch() {
  const searchInput = document.getElementById("search-input");

  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    const userCards = document.querySelectorAll(".user-card");
    let visibleCount = 0;

    userCards.forEach((card) => {
      const userName = card.getAttribute("data-username");

      if (userName.includes(searchTerm)) {
        card.classList.remove("hidden-by-search");
        visibleCount++;
      } else {
        card.classList.add("hidden-by-search");
      }
    });

    // Show/hide no results message
    const heatmapContainer = document.getElementById("heatmap-container");
    let noResults = document.getElementById("no-results");

    if (visibleCount === 0 && searchTerm !== "") {
      if (!noResults) {
        noResults = document.createElement("div");
        noResults.id = "no-results";
        noResults.className = "no-results";
        noResults.innerHTML = `
                    <i class="fas fa-search"></i>
                    <p>No users found matching "${e.target.value}"</p>
                `;
        heatmapContainer.appendChild(noResults);
      }
    } else if (noResults) {
      noResults.remove();
    }
  });
}

// Expand/Collapse All functionality
function setupExpandCollapse() {
  const expandAllBtn = document.getElementById("expand-all-btn");
  const collapseAllBtn = document.getElementById("collapse-all-btn");

  expandAllBtn.addEventListener("click", () => {
    const headers = document.querySelectorAll(".user-card-header");
    const contents = document.querySelectorAll(".user-card-content");

    headers.forEach((header) => header.classList.add("expanded"));
    contents.forEach((content) => content.classList.add("expanded"));
  });

  collapseAllBtn.addEventListener("click", () => {
    const headers = document.querySelectorAll(".user-card-header");
    const contents = document.querySelectorAll(".user-card-content");

    headers.forEach((header) => header.classList.remove("expanded"));
    contents.forEach((content) => content.classList.remove("expanded"));
  });
}

// Initialize year selector
function initializeYearSelector() {
  const yearSelect = document.getElementById("year-select");
  const currentYear = new Date().getFullYear();

  for (let year = currentYear; year >= currentYear - 5; year--) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    if (year === currentYear) {
      option.selected = true;
    }
    yearSelect.appendChild(option);
  }

  yearSelect.addEventListener("change", renderHeatMaps);
}

// Initialize platform filters
document
  .getElementById("show-atcoder")
  .addEventListener("change", renderHeatMaps);
document
  .getElementById("show-codeforces")
  .addEventListener("change", renderHeatMaps);

// Retry button
document
  .getElementById("retry-btn")
  ?.addEventListener("click", loadAndRenderHeatMaps);

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  initializeYearSelector();
  setupSearch();
  setupExpandCollapse();
  loadAndRenderHeatMaps();
});
