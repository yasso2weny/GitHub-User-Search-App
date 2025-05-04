// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const themeText = document.getElementById('theme-text');
const themeIcon = document.getElementById('theme-icon');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchError = document.getElementById('search-error');
const loadingIndicator = document.getElementById('loading-indicator');
const mainContainer = document.querySelector('.main_container');

// Social elements
const websiteElement = document.getElementById('website');
const twitterElement = document.getElementById('twitter');
const locationContainer = document.getElementById('location-container');
const websiteContainer = document.getElementById('website-container');
const twitterContainer = document.getElementById('twitter-container');
const companyContainer = document.getElementById('company-container');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadDefaultUser();
  setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);
  
  // Search form submission
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = searchInput.value.trim();
    if (username) {
      searchUser(username);
    } else {
      showError('Please enter a username');
    }
  });
  
  // Input validation - clear error on typing
  searchInput.addEventListener('input', () => {
    searchError.textContent = '';
    searchError.classList.add('hidden');
  });
  
  // Enable pressing Enter to search
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchBtn.click();
    }
  });
}

// Theme functions
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    updateThemeUI(true);
  }
}

function toggleTheme() {
  const isDarkMode = document.body.classList.toggle('dark-mode');
  updateThemeUI(isDarkMode);
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

function updateThemeUI(isDarkMode) {
  themeText.textContent = isDarkMode ? 'Light' : 'Dark';
  themeIcon.src = isDarkMode ? 'images/sun.svg' : 'images/moon.svg';
  themeIcon.alt = isDarkMode ? 'Light mode icon' : 'Dark mode icon';
}

// API Interaction
async function searchUser(username) {
  try {
    showLoading(true);
    searchError.classList.add('hidden');
    
    const response = await fetchWithTimeout(`https://api.github.com/users/${username}`);
    
    if (response.status === 404) {
      showError('No results found');
      return;
    }
    
    if (!response.ok) {
      if (response.status === 403) {
        showError('API rate limit exceeded. Try again later.');
      } else {
        showError(`Error: ${response.status}`);
      }
      return;
    }
    
    const data = await response.json();
    updateUI(data);
    
  } catch (error) {
    console.error('Error fetching data:', error);
    showError('Failed to fetch user data');
  } finally {
    showLoading(false);
  }
}

// Fetch with timeout to handle slow connections
async function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

// UI Functions
function loadDefaultUser() {
  // Default to Octocat as initial user
  getUserData('octocat');
}

async function getUserData(username) {
  try {
    showLoading(true);
    const response = await fetchWithTimeout(`https://api.github.com/users/${username}`);
    
    if (!response.ok) {
      showError('Failed to load default user');
      return;
    }
    
    const data = await response.json();
    updateUI(data);
    
  } catch (error) {
    console.error('Error loading default user:', error);
    showError('Failed to load default user');
  } finally {
    showLoading(false);
  }
}

function updateUI(data) {
  // Update user info
  document.getElementById('name').textContent = data.name || data.login;
  document.getElementById('username').textContent = `@${data.login}`;
  
  // Format date to readable format
  const joinDate = new Date(data.created_at);
  const formattedDate = joinDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  document.getElementById('date_joined').textContent = `Joined ${formattedDate}`;
  
  // Bio
  const bioElement = document.getElementById('bio');
  bioElement.textContent = data.bio || 'This profile has no bio';
  
  // Stats
  const detailsInfo = document.querySelectorAll('.details_info');
  detailsInfo[0].textContent = data.public_repos.toLocaleString();
  detailsInfo[1].textContent = data.followers.toLocaleString();
  detailsInfo[2].textContent = data.following.toLocaleString();
  
  // Update social info with availability check
  updateSocialInfo(locationContainer, document.getElementById('location'), data.location);
  updateWebsiteInfo(websiteContainer, websiteElement, data.blog);
  updateTwitterInfo(twitterContainer, twitterElement, data.twitter_username);
  updateSocialInfo(companyContainer, document.getElementById('company'), data.company);
  
  // Set avatar
  const avatarImg = document.getElementById('avatar');
  avatarImg.src = data.avatar_url;
  avatarImg.alt = `${data.name || data.login}'s avatar`;
  
  // Show the container
  mainContainer.classList.remove('hidden');
}

function updateSocialInfo(container, element, value) {
  if (!value) {
    element.textContent = 'Not Available';
    container.classList.add('not-available');
  } else {
    element.textContent = value;
    container.classList.remove('not-available');
  }
}

function updateWebsiteInfo(container, element, value) {
  if (!value || value === '') {
    element.textContent = 'Not Available';
    element.removeAttribute('href');
    container.classList.add('not-available');
  } else {
    element.textContent = value;
    // Add https:// if not present
    let url = value;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    element.href = url;
    container.classList.remove('not-available');
  }
}

function updateTwitterInfo(container, element, value) {
  if (!value) {
    element.textContent = 'Not Available';
    element.removeAttribute('href');
    container.classList.add('not-available');
  } else {
    element.textContent = `@${value}`;
    element.href = `https://twitter.com/${value}`;
    container.classList.remove('not-available');
  }
}

function showError(message) {
  searchError.textContent = message;
  searchError.classList.remove('hidden');
}

function showLoading(isLoading) {
  if (isLoading) {
    loadingIndicator.classList.remove('hidden');
    searchBtn.disabled = true;
  } else {
    loadingIndicator.classList.add('hidden');
    searchBtn.disabled = false;
  }
}