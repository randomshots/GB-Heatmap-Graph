let currentChart = null;
let allUsersData = {}; // Store data for all users
let currentYear = new Date().getFullYear();
let currentGraphType = "daily";
let currentMonth = new Date().getMonth();
let currentUser = null;

// Users data from config
// ...existing code...
// Users data from config
const USERS = [
  {
    name: "Jalaluddin",
    atcoder: "jalaluddin420",
    codeforces: "jalaluddin420",
  },
  {
    name: "Sonu",
    atcoder: "sonu24",
    codeforces: "_soma_shekar_",
  },
  {
    name: "Mani Chandana",
    atcoder: "manichandana",
    codeforces: "manichandanaa",
  },
  {
    name: "LRV Kausthubh",
    atcoder: "lrv",
    codeforces: "lrvkausthubh",
  },
  {
    name: "Shiva Karthik",
    atcoder: "shiva_karthik121",
    codeforces: "shiva_karthik121",
  },
  {
    name: "Advaith Chaitanya",
    atcoder: "advaithchaitanya",
    codeforces: "advaithchaitanya",
  },
  {
    name: "Bharath",
    atcoder: "bharathkumarbilakanti",
    codeforces: "bharathkumarbilakanti",
  },
  {
    name: "Jakkala Ramu",
    atcoder: "jakkalaramu",
    codeforces: "codercp",
  },
];
// ...existing code...

// Fetch AtCoder submissions
async function fetchAtCoderSubmissions(user) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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
    return submissions
      .filter((sub) => sub.result === "AC")
      .map((sub) => {
        const date = new Date(sub.epoch_second * 1000);
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(date.getTime() + istOffset);

        const year = istDate.getUTCFullYear();
        const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
        const day = String(istDate.getUTCDate()).padStart(2, "0");

        return {
          date: `${year}-${month}-${day}`,
          platform: "atcoder",
          result: sub.result,
        };
      });
  } catch (err) {
    console.error(`Error fetching AtCoder data for ${user}:`, err);
    return [];
  }
}

// Fetch Codeforces submissions
async function fetchCodeforcesSubmissions(user) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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
      console.warn(`Codeforces API error for ${user}`);
      return [];
    }

    return data.result
      .filter((sub) => sub.verdict === "OK")
      .map((sub) => {
        const date = new Date(sub.creationTimeSeconds * 1000);
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(date.getTime() + istOffset);

        const year = istDate.getUTCFullYear();
        const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
        const day = String(istDate.getUTCDate()).padStart(2, "0");

        return {
          date: `${year}-${month}-${day}`,
          platform: "codeforces",
          result: sub.verdict,
        };
      });
  } catch (err) {
    console.error(`Error fetching Codeforces data for ${user}:`, err);
    return [];
  }
}

// Calculate statistics
function calculateStats(submissions, year) {
  const yearSubmissions = submissions.filter((sub) => {
    const subYear = new Date(sub.date).getFullYear();
    return subYear === year;
  });

  const uniqueDates = new Set(yearSubmissions.map((sub) => sub.date));
  const sortedDates = Array.from(uniqueDates).sort();

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date().toISOString().split("T")[0];
  let lastDate = null;

  sortedDates.forEach((date, index) => {
    if (index === 0) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(sortedDates[index - 1]);
      const currDate = new Date(date);
      const diffDays = Math.floor(
        (currDate - prevDate) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    lastDate = date;
  });

  longestStreak = Math.max(longestStreak, tempStreak);

  if (lastDate) {
    const lastDateObj = new Date(lastDate);
    const todayObj = new Date(today);
    const diffDays = Math.floor(
      (todayObj - lastDateObj) / (1000 * 60 * 60 * 24),
    );

    if (diffDays <= 1) {
      currentStreak = tempStreak;
    }
  }

  return {
    totalSubmissions: yearSubmissions.length,
    activeDays: uniqueDates.size,
    currentStreak,
    longestStreak,
  };
}

// Prepare chart data
function prepareChartData(submissions, type) {
  const atcoderSubs = submissions.filter((sub) => sub.platform === "atcoder");
  const codeforcesSubs = submissions.filter(
    (sub) => sub.platform === "codeforces",
  );

  if (type === "daily") {
    return prepareDailyData(atcoderSubs, codeforcesSubs);
  } else if (type === "weekly") {
    return prepareWeeklyData(atcoderSubs, codeforcesSubs);
  } else {
    return prepareMonthlyData(atcoderSubs, codeforcesSubs);
  }
}

// Prepare daily data
function prepareDailyData(atcoderSubs, codeforcesSubs) {
  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = endDate.getDate();

  const labels = [];
  const atcoderData = [];
  const codeforcesData = [];
  const totalData = [];

  const atcoderByDate = {};
  const codeforcesByDate = {};

  atcoderSubs.forEach((sub) => {
    atcoderByDate[sub.date] = (atcoderByDate[sub.date] || 0) + 1;
  });

  codeforcesSubs.forEach((sub) => {
    codeforcesByDate[sub.date] = (codeforcesByDate[sub.date] || 0) + 1;
  });

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(currentYear, currentMonth, day);

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(currentDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${dayStr}`;

    const atcoderCount = atcoderByDate[dateStr] || 0;
    const codeforcesCount = codeforcesByDate[dateStr] || 0;

    labels.push(day.toString());
    atcoderData.push(atcoderCount);
    codeforcesData.push(codeforcesCount);
    totalData.push(atcoderCount + codeforcesCount);
  }

  return { labels, atcoderData, codeforcesData, totalData };
}

// Prepare weekly data
function prepareWeeklyData(atcoderSubs, codeforcesSubs) {
  const labels = [];
  const atcoderData = [];
  const codeforcesData = [];
  const totalData = [];

  const atcoderByWeek = {};
  const codeforcesByWeek = {};

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  atcoderSubs.forEach((sub) => {
    const date = new Date(sub.date);
    const weekNumber = getWeekNumber(date);
    const key = `${date.getFullYear()}-W${weekNumber}`;
    atcoderByWeek[key] = (atcoderByWeek[key] || 0) + 1;
  });

  codeforcesSubs.forEach((sub) => {
    const date = new Date(sub.date);
    const weekNumber = getWeekNumber(date);
    const key = `${date.getFullYear()}-W${weekNumber}`;
    codeforcesByWeek[key] = (codeforcesByWeek[key] || 0) + 1;
  });

  const weeksInMonth = new Set();
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(currentYear, currentMonth, day);
    const weekNum = getWeekNumber(date);
    weeksInMonth.add(weekNum);
  }

  const sortedWeeks = Array.from(weeksInMonth).sort((a, b) => a - b);

  sortedWeeks.forEach((weekNum, index) => {
    const key = `${currentYear}-W${weekNum}`;
    const atcoderCount = atcoderByWeek[key] || 0;
    const codeforcesCount = codeforcesByWeek[key] || 0;

    labels.push(`Week ${index + 1}`);
    atcoderData.push(atcoderCount);
    codeforcesData.push(codeforcesCount);
    totalData.push(atcoderCount + codeforcesCount);
  });

  return { labels, atcoderData, codeforcesData, totalData };
}

// Prepare monthly data
function prepareMonthlyData(atcoderSubs, codeforcesSubs) {
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
  const labels = [];
  const atcoderData = [];
  const codeforcesData = [];
  const totalData = [];

  const atcoderByMonth = {};
  const codeforcesByMonth = {};

  atcoderSubs.forEach((sub) => {
    const date = new Date(sub.date);
    const month = date.getMonth();
    atcoderByMonth[month] = (atcoderByMonth[month] || 0) + 1;
  });

  codeforcesSubs.forEach((sub) => {
    const date = new Date(sub.date);
    const month = date.getMonth();
    codeforcesByMonth[month] = (codeforcesByMonth[month] || 0) + 1;
  });

  for (let month = 0; month < 12; month++) {
    const atcoderCount = atcoderByMonth[month] || 0;
    const codeforcesCount = codeforcesByMonth[month] || 0;

    labels.push(months[month]);
    atcoderData.push(atcoderCount);
    codeforcesData.push(codeforcesCount);
    totalData.push(atcoderCount + codeforcesCount);
  }

  return { labels, atcoderData, codeforcesData, totalData };
}

// Get week number
function getWeekNumber(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// Create chart
function createChart(submissions, type) {
  const canvas = document.getElementById("activity-chart");
  const ctx = canvas.getContext("2d");

  if (currentChart) {
    currentChart.destroy();
  }

  const yearSubmissions = submissions.filter((sub) => {
    const subYear = new Date(sub.date).getFullYear();
    return subYear === currentYear;
  });

  const chartData = prepareChartData(yearSubmissions, type);

  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const textColor = isDark ? "#e0e0e0" : "#333";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  let titleText;
  if (type === "daily") {
    titleText = `Daily Activity - ${monthNames[currentMonth]} ${currentYear}`;
  } else if (type === "weekly") {
    titleText = `Weekly Activity - ${monthNames[currentMonth]} ${currentYear}`;
  } else {
    titleText = `Monthly Activity - ${currentYear}`;
  }

  currentChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: "AtCoder",
          data: chartData.atcoderData,
          borderColor: "#ff6b35",
          backgroundColor: "rgba(255, 107, 53, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
        {
          label: "Codeforces",
          data: chartData.codeforcesData,
          borderColor: "#4285f4",
          backgroundColor: "rgba(66, 133, 244, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
        {
          label: "Total",
          data: chartData.totalData,
          borderColor: "#34a853",
          backgroundColor: "rgba(52, 168, 83, 0.05)",
          fill: false,
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: titleText,
          color: textColor,
          font: {
            size: 18,
            weight: "bold",
          },
        },
        legend: {
          display: true,
          position: "top",
          labels: {
            color: textColor,
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.parsed.y} accepted`;
            },
            title: function (context) {
              if (type === "daily") {
                const day = context[0].label;
                return `${monthNames[currentMonth]} ${day}, ${currentYear}`;
              } else if (type === "weekly") {
                return `${context[0].label} of ${monthNames[currentMonth]} ${currentYear}`;
              }
              return context[0].label;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text:
              type === "daily"
                ? "Day of Month"
                : type === "weekly"
                  ? "Week of Month"
                  : "Month",
            color: textColor,
          },
          ticks: {
            color: textColor,
            maxRotation: 45,
            minRotation: 45,
          },
          grid: {
            color: gridColor,
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: "Accepted Solutions",
            color: textColor,
          },
          ticks: {
            color: textColor,
            stepSize: 1,
          },
          grid: {
            color: gridColor,
          },
          beginAtZero: true,
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    },
  });
}

// Update stats display
function updateStats(submissions) {
  const stats = calculateStats(submissions, currentYear);

  document.getElementById("total-accepted").textContent =
    stats.totalSubmissions;
  document.getElementById("active-days").textContent = stats.activeDays;
  document.getElementById("current-streak").textContent = stats.currentStreak;
  document.getElementById("longest-streak").textContent = stats.longestStreak;

  const atcoderCount = submissions.filter(
    (sub) =>
      sub.platform === "atcoder" &&
      new Date(sub.date).getFullYear() === currentYear,
  ).length;

  const codeforcesCount = submissions.filter(
    (sub) =>
      sub.platform === "codeforces" &&
      new Date(sub.date).getFullYear() === currentYear,
  ).length;

  document.getElementById("atcoder-count").textContent = atcoderCount;
  document.getElementById("codeforces-count").textContent = codeforcesCount;
}

// Populate user selector
function populateUserSelector() {
  const userSelect = document.getElementById("user-select");
  userSelect.innerHTML = "";

  USERS.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.name;
    option.textContent = user.name;
    userSelect.appendChild(option);
  });

  // Set selected user
  if (currentUser) {
    userSelect.value = currentUser;
  }
}

// Switch to different user
async function switchUser(userName) {
  currentUser = userName;
  document.getElementById("page-title").textContent =
    `${userName} - Activity Graph`;

  // Check if we already have data for this user
  if (allUsersData[userName]) {
    updateStats(allUsersData[userName]);
    createChart(allUsersData[userName], currentGraphType);
    return;
  }

  // Fetch data for the new user
  const loading = document.getElementById("loading");
  loading.classList.remove("hidden");

  try {
    const user = USERS.find((u) => u.name === userName);
    if (!user) {
      throw new Error("User not found");
    }

    const [atcoderData, codeforcesData] = await Promise.all([
      user.atcoder
        ? fetchAtCoderSubmissions(user.atcoder)
        : Promise.resolve([]),
      user.codeforces
        ? fetchCodeforcesSubmissions(user.codeforces)
        : Promise.resolve([]),
    ]);

    const submissions = [...atcoderData, ...codeforcesData];
    allUsersData[userName] = submissions;

    updateStats(submissions);
    createChart(submissions, currentGraphType);
  } catch (error) {
    console.error("Error switching user:", error);
    alert("Error loading user data. Please try again.");
  } finally {
    loading.classList.add("hidden");
  }
}

// Load initial data
async function loadData() {
  const userData = JSON.parse(localStorage.getItem("graphUserData"));

  if (!userData) {
    // Default to first user if no data
    currentUser = USERS[0].name;
  } else {
    currentUser = userData.userName;
    currentYear = userData.year;
    document.getElementById("year-select").value = currentYear;
  }

  // Set current month
  const now = new Date();
  if (currentYear === now.getFullYear()) {
    currentMonth = now.getMonth();
  }

  // Populate user selector
  populateUserSelector();

  // Load data for current user
  await switchUser(currentUser);

  // Create month selector
  createMonthSelector();
  toggleMonthSelector(true);
}

// Toggle theme
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  const themeIcon = document.querySelector("#theme-toggle i");
  themeIcon.className = newTheme === "dark" ? "fas fa-sun" : "fas fa-moon";

  if (currentChart && allUsersData[currentUser]) {
    createChart(allUsersData[currentUser], currentGraphType);
  }
}

// Create month selector
function createMonthSelector() {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  let monthSelector = document.getElementById("month-selector");

  if (!monthSelector) {
    monthSelector = document.createElement("div");
    monthSelector.id = "month-selector";
    monthSelector.className = "month-selector";

    const label = document.createElement("label");
    label.textContent = "Select Month: ";
    label.style.marginRight = "10px";
    label.style.fontWeight = "500";

    const select = document.createElement("select");
    select.id = "month-select";
    select.className = "month-select";

    months.forEach((month, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = month;
      if (index === currentMonth) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    select.addEventListener("change", (e) => {
      currentMonth = parseInt(e.target.value);
      if (allUsersData[currentUser]) {
        createChart(allUsersData[currentUser], currentGraphType);
      }
    });

    monthSelector.appendChild(label);
    monthSelector.appendChild(select);

    const graphSelector = document.querySelector(".graph-selector");
    graphSelector.parentNode.insertBefore(monthSelector, graphSelector);
  } else {
    document.getElementById("month-select").value = currentMonth;
  }
}

// Toggle month selector visibility
function toggleMonthSelector(show) {
  const monthSelector = document.getElementById("month-selector");
  if (monthSelector) {
    monthSelector.style.display = show ? "flex" : "none";
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  const themeIcon = document.querySelector("#theme-toggle i");
  themeIcon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";

  document
    .getElementById("theme-toggle")
    .addEventListener("click", toggleTheme);

  document.getElementById("back-button").addEventListener("click", () => {
    window.location.href = "number.html";
  });

  // User selector
  document.getElementById("user-select").addEventListener("change", (e) => {
    switchUser(e.target.value);
  });

  // Year selector
  document.getElementById("year-select").addEventListener("change", (e) => {
    currentYear = parseInt(e.target.value);
    const now = new Date();
    if (currentYear === now.getFullYear()) {
      currentMonth = now.getMonth();
    } else if (currentYear < now.getFullYear()) {
      currentMonth = 11;
    } else {
      currentMonth = 0;
    }

    const monthSelect = document.getElementById("month-select");
    if (monthSelect) {
      monthSelect.value = currentMonth;
    }

    if (allUsersData[currentUser]) {
      updateStats(allUsersData[currentUser]);
      createChart(allUsersData[currentUser], currentGraphType);
    }
  });

  // Graph type buttons
  document.querySelectorAll(".graph-type-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".graph-type-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentGraphType = btn.getAttribute("data-type");

      if (currentGraphType === "daily" || currentGraphType === "weekly") {
        createMonthSelector();
        toggleMonthSelector(true);
      } else {
        toggleMonthSelector(false);
      }

      if (allUsersData[currentUser]) {
        createChart(allUsersData[currentUser], currentGraphType);
      }
    });
  });

  loadData();
});
