(() => {
  // ⚙️ Configuration Constants ⚙️
  // --------------------------
  const SCROLL_DELAY = 300; // Milliseconds between scrolls (🐢 vs 🐇)
  const SCROLL_AMOUNT = 500; // Pixels to scroll each time (📏)
  const MAX_ATTEMPTS = 200; // Max scroll attempts per page before giving up (🛑)
  // const MAX_PAGES = 3; // Removed page limit - go until the end! (♾️)
  const PAGE_LOAD_TIMEOUT = 10000; // Max time to wait for names to appear on page load (⏱️)
  const PAGE_LOAD_CHECK_INTERVAL = 500; // How often to check for names during page load (🔍)
  const CONTAINER_HEIGHT_CHECK_DELAY = 2000; // Wait time after page load before checking height (🏗️)
  const MAX_HEIGHT_CHECK_ATTEMPTS = 10; // Max attempts to measure scroll container height (📐)
  const PAGE_TRANSITION_DELAY = 2000; // Wait time after clicking "Next" page (⏳)
  const CONTAINER_CHECK_INTERVAL = 500; // How often to check if the main container exists (👀)
  const CONTAINER_CHECK_TIMEOUT = 10000; // Max time to wait for the main container (⏱️)
  const PRE_SCROLL_DELAY = 100; // Tiny pause before starting scroll loop on a page (🤏)
  const NO_NEW_PROFILES_THRESHOLD = 15; // Stop page scroll if no new profiles found after this many attempts (📉)
  const STORAGE_KEY = "linkedInScrapedProfiles"; // Key for saving data in localStorage (🔑)
  const DOWNLOAD_FILENAME = "profiles.json"; // Filename for the final download (💾)
  const SAVE_INTERVAL_PAGES = 10; // Save progress to localStorage every X pages (📑)

  // 📦 Script State Variables 📦
  // -------------------------
  let container = null; // Reference to the main scrollable results container (DOM element)
  let lastScrollTop = 0; // Previous scroll position (used for checking scroll progress, though less critical now)
  let attempts = 0; // Current scroll attempts on the active page (🔢)
  let isScrolling = true; // Flag to control the main scroll loop (🚦)
  let processedProfiles = new Set(); // Holds names of profiles already processed (ensures uniqueness ✨)
  let allProfilesData = []; // Array storing the full data objects for all unique profiles (📊)
  let currentPage = 1; // Current page number being processed (📄)
  // let lastProcessedCount = 0; // No longer needed - using allProfilesData.length
  let noNewNamesCount = 0; // Counter for consecutive attempts finding no new profiles (🚫)
  // let lastScrollPosition = 0; // No longer needed
  let scrollContainerHeight = 0; // Measured height of the scrollable area (📏)
  let pagesProcessedCounter = 0; // Counter for periodic saving (💾➡️🔟)

  // --- 💾 localStorage Functions 💾 ---
  const loadProfilesFromStorage = () => {
    console.log("🔄 Attempting to load previous data from localStorage...");
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        allProfilesData = JSON.parse(storedData); // Parse the stored JSON
        // Repopulate the processedProfiles set from loaded data for quick checks
        allProfilesData.forEach((profile) => {
          if (profile && profile.name) {
            processedProfiles.add(profile.name);
          }
        });
        console.log(`👍 Loaded ${allProfilesData.length} profiles from localStorage.`);
      } else {
        console.log("🤷 No existing profiles found in localStorage.");
      }
    } catch (error) {
      console.error("❌ Error loading profiles from localStorage:", error);
      allProfilesData = []; // Reset on error
      processedProfiles = new Set(); // Reset the set too
    }
  };

  const saveProfilesToStorage = () => {
    // console.log(`💾 Saving ${allProfilesData.length} profiles to localStorage...`); // Optional: Log every save
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allProfilesData));
    } catch (error) {
      // Handle potential storage errors (like quota exceeded)
      console.error("❌ Error saving profiles to localStorage:", error);
    }
  };
  // --- End localStorage Functions ---

  // --- 📥 Download Function 📥 ---
  const downloadJSON = (data, filename) => {
    if (!data || data.length === 0) {
      console.log("🤷 No data collected, skipping download.");
      return;
    }
    try {
      // Ensure the absolute latest data is saved before downloading
      saveProfilesToStorage();
      console.log(`💾 Final save complete. Attempting download of ${allProfilesData.length} profiles...`);

      const jsonStr = JSON.stringify(data, null, 2); // Pretty print JSON ✨
      const blob = new Blob([jsonStr], { type: "application/json" }); // Create a data Blob
      const url = URL.createObjectURL(blob); // Create a URL for the Blob

      // Create a temporary link element to trigger the download
      const a = document.createElement("a");
      a.href = url;
      a.download = filename; // Set the desired filename
      document.body.appendChild(a); // Needs to be in the document to be clickable
      a.click(); // Simulate a click to start download

      // Cleanup: Remove the temporary link and release the Blob URL
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log(`✅ Successfully triggered download of ${filename}`);
    } catch (error) {
      console.error("❌ Error triggering JSON download:", error);
    }
  };
  // --- End Download Function ---

  // --- 🕵️ Helper Functions 🕵️ ---

  // Function to wait for the main results container to appear in the DOM
  const waitForContainer = () => {
    console.log("⏳ Waiting for search results container to appear...");
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkContainer = () => {
        const foundContainer = document.querySelector("[data-x--search-results-container]");
        if (foundContainer) {
          console.log("✅ Found search results container!");
          resolve(foundContainer);
          return;
        }
        // Timeout check
        if (Date.now() - startTime > CONTAINER_CHECK_TIMEOUT) {
          console.error("⏱️ Timeout waiting for search results container.");
          reject(new Error("Container timeout"));
          return;
        }
        // Check again shortly
        setTimeout(checkContainer, CONTAINER_CHECK_INTERVAL);
      };
      checkContainer(); // Start the check loop
    });
  };

  // Function to get current page number from the pagination indicator
  const getCurrentPage = () => {
    const activePageElement = document.querySelector(".artdeco-pagination__indicator--number.active span");
    // Use the DOM element if available, otherwise fallback to the tracked currentPage variable
    const pageNumber = activePageElement ? parseInt(activePageElement.textContent) : currentPage;
    // console.log(`(${currentPage}) Current page detected as: ${pageNumber}`); // Debug log if needed
    return pageNumber;
  };

  // Function to click the "Next" page button
  const goToNextPage = () => {
    const nextButton = document.querySelector(".artdeco-pagination__button--next");
    // Check if the button exists and is not disabled
    if (nextButton && !nextButton.disabled) {
      console.log(`(${currentPage}) Clicking next page button... ➡️`);
      nextButton.click();
      return true; // Success
    }
    console.log(`(${currentPage}) Next page button not found or disabled. Assuming end of results. 🛑`);
    return false; // Failure
  };

  // Function to get the scrollable height of the container
  const getScrollContainerHeight = () => {
    if (!container) return 0; // Safety check
    // Primarily rely on the main container's scrollHeight
    const potentialContainers = [container];
    for (const cont of potentialContainers) {
      const height = cont.scrollHeight;
      if (height > 0) {
        return height;
      }
    }
    // Fallback: Calculate height based on rendered result elements
    const resultElements = container.querySelectorAll('[data-x-search-result="LEAD"]');
    if (resultElements.length > 0) {
      console.log("⚠️ Using fallback height calculation based on element positions.");
      const firstElement = resultElements[0];
      const lastElement = resultElements[resultElements.length - 1];
      const height = lastElement.getBoundingClientRect().bottom - firstElement.getBoundingClientRect().top;
      return height;
    }
    console.log("⚠️ Could not determine scroll height.");
    return 0; // Couldn't determine height
  };

  // Function to wait until the container's height is measurable
  const waitForContainerHeight = () => {
    // console.log(`(${currentPage}) Waiting for measurable container height...`); // Debug log if needed
    return new Promise((resolve) => {
      let attempts = 0;
      const checkHeight = () => {
        const height = getScrollContainerHeight();
        if (height > 0) {
          // console.log(`(${currentPage}) Container height determined: ${height}px`); // Can be noisy
          resolve(height);
          return;
        }
        attempts++;
        // Check if max attempts reached
        if (attempts >= MAX_HEIGHT_CHECK_ATTEMPTS) {
          console.log(
            `(${currentPage}) ⚠️ Max attempts reached waiting for container height. Proceeding without known height.`,
          );
          resolve(0); // Resolve with 0 to indicate failure
          return;
        }
        // Wait and try again
        setTimeout(checkHeight, 500);
      };
      checkHeight(); // Start checking
    });
  };

  // Function to wait for initial profile names to appear on the page
  const waitForPageLoad = () => {
    currentPage = getCurrentPage(); // Update page number based on indicator
    console.log(`(${currentPage}) Waiting for initial results to load... ⏳`);
    return new Promise((resolve, reject) => {
      if (!container) {
        console.error("❌ Cannot check page load without container!");
        reject(new Error("Container not available for page load check"));
        return;
      }
      const startTime = Date.now();
      const checkForNames = () => {
        // Look for elements known to contain profile names
        const nameElements = container.querySelectorAll('[data-view-name="search-results-lead-name"]');
        if (nameElements.length > 0) {
          console.log(`(${currentPage}) ✅ Page loaded with ${nameElements.length} initial results.`);
          resolve(true); // Success!
          return;
        }
        // Check for timeout
        if (Date.now() - startTime > PAGE_LOAD_TIMEOUT) {
          console.log(`(${currentPage}) ⏱️ Timeout waiting for page results to load.`);
          reject(new Error("Page load timeout"));
          return;
        }
        // Wait and check again
        setTimeout(checkForNames, PAGE_LOAD_CHECK_INTERVAL);
      };
      checkForNames(); // Start checking
    });
  };

  // Function to extract profile data from a single result element
  const extractProfileData = (element) => {
    // Helper to clean whitespace from text
    const cleanText = (text) => {
      if (!text) return null;
      // Replace multiple whitespace chars (incl. newlines) with single space, then trim ends
      return text.replace(/\s\s+/g, " ").trim();
    };

    // Extract data using specific selectors
    const profileData = {
      name: cleanText(element.querySelector('[data-view-name="search-results-lead-name"]')?.textContent),
      company: cleanText(element.querySelector('[data-view-name="search-results-lead-company-name"]')?.textContent),
      title: cleanText(element.querySelector('[data-anonymize="title"]')?.textContent),
      location: cleanText(element.querySelector('[data-anonymize="location"]')?.textContent),
      jobTenure: cleanText(element.querySelector('[data-anonymize="job-title"]')?.textContent), // Cleaned tenure
      profileImage: element.querySelector('[data-view-name="search-results-lead-profile-image"] img')?.src,
      profileUrl: element.querySelector('[data-view-name="search-results-lead-profile-image"]')?.href,
    };

    // Basic validation: A profile must have a name
    if (!profileData.name) {
      // console.log("⚠️ Found element without a name, skipping."); // Optional debug log
      return null;
    }
    return profileData;
  };

  // --- 🔄 Core Processing Functions 🔄 ---

  // Function to find new profiles on the page and add them to our data
  const processNewProfiles = () => {
    if (!container) return 0; // Safety first
    let newProfilesFoundThisCall = 0;
    const resultElements = container.querySelectorAll('[data-x-search-result="LEAD"]'); // Get all profile elements currently in DOM
    const currentVisibleCount = resultElements.length;
    let newProfilesAdded = false; // Flag if any data was actually added

    resultElements.forEach((element) => {
      const profileData = extractProfileData(element); // Extract data from the element
      // Check if data is valid and if we haven't processed this name before
      if (profileData && !processedProfiles.has(profileData.name)) {
        processedProfiles.add(profileData.name); // Add name to Set (for fast lookups)
        allProfilesData.push(profileData); // Add the full data object to our main array
        newProfilesFoundThisCall++;
        newProfilesAdded = true;
      }
    });

    // Log if new profiles were added in this specific check
    if (newProfilesAdded) {
      console.log(
        `(${currentPage}) ✨ Found ${newProfilesFoundThisCall} new profile(s). Total unique: ${allProfilesData.length}`,
      );
      // Note: Saving to localStorage is now done periodically or at the end, not here.
    }

    // Check if we seem to be stuck (scrolling but not finding new unique profiles)
    if (newProfilesFoundThisCall === 0 && currentVisibleCount > 0) {
      noNewNamesCount++; // Increment the stuck counter
      // Log periodically to avoid flooding the console
      if (noNewNamesCount % 5 === 0 || noNewNamesCount === NO_NEW_PROFILES_THRESHOLD) {
        console.log(
          `(${currentPage}) 🤔 No new profiles found for ${noNewNamesCount}/${NO_NEW_PROFILES_THRESHOLD} attempts.`,
        );
      }
    } else {
      // Reset the stuck counter if we found new profiles
      if (newProfilesFoundThisCall > 0) {
        noNewNamesCount = 0;
      }
    }

    return newProfilesFoundThisCall; // Return how many were found in *this* call
  };

  // Function to setup and start the scrolling process for a specific page
  const startScrolling = async () => {
    try {
      // 1. Make sure the container exists for the current page
      container = document.querySelector("[data-x--search-results-container]");
      if (!container) {
        console.error(`(${currentPage}) ⚠️ Container not found when starting scroll. Waiting...`);
        container = await waitForContainer(); // Wait for it
      }

      // 2. Wait for initial content (names) to appear
      await waitForPageLoad(); // This also updates currentPage internally
      console.log(`(${currentPage}) ✅ Initial results loaded. Starting scroll setup...`);

      // 3. Wait for the container height to be measurable
      // console.log(`(${currentPage}) Determining container height...`); // Optional log
      scrollContainerHeight = await waitForContainerHeight();
      if (scrollContainerHeight === 0) {
        console.log(`(${currentPage}) ⚠️ Could not determine container height accurately.`);
      }

      // 4. Final check for container just before scrolling
      container = document.querySelector("[data-x--search-results-container]");
      if (!container) {
        console.error(`(${currentPage}) ❌ Container disappeared before scrolling! Aborting.`);
        isScrolling = false;
        downloadJSON(allProfilesData, DOWNLOAD_FILENAME); // Attempt download before exiting
        return;
      }
      console.log(
        `(${currentPage}) ✅ Container confirmed. scrollHeight: ${container.scrollHeight}, clientHeight: ${container.clientHeight}. Starting scroll loop...`,
      );

      // 5. Reset page-specific state variables
      container.scrollTop = 0; // Scroll to top
      // lastScrollPosition = 0; // Not needed
      attempts = 0; // Reset scroll attempts for the page
      noNewNamesCount = 0; // Reset stuck counter
      isScrolling = true; // Enable the scroll loop

      // 6. Tiny pause before the first scroll, helps with rendering
      await new Promise((resolve) => setTimeout(resolve, PRE_SCROLL_DELAY));

      // 7. Start the scroll loop! 🚀
      scroll();
    } catch (error) {
      // Catch errors during the setup process
      console.error(`(${currentPage}) ❌ Error during page setup:`, error);
      isScrolling = false; // Stop everything
      downloadJSON(allProfilesData, DOWNLOAD_FILENAME); // Download whatever we have
    }
  };

  // The main recursive scroll function for a single page 🔄
  const scroll = () => {
    // Double-check if we should be scrolling or if container is lost
    if (!isScrolling || !container) {
      console.log(
        `(${currentPage}) Scroll check: Stopping scroll (isScrolling=${isScrolling}, containerExists=${!!container}).`,
      );
      // If stopped unexpectedly, try to download
      if (!isScrolling) downloadJSON(allProfilesData, DOWNLOAD_FILENAME);
      return; // Exit the loop
    }

    // --- Perform Scroll ---
    const currentScrollTop = container.scrollTop;
    container.scrollTop += SCROLL_AMOUNT; // Scroll down
    const scrolledDistance = container.scrollTop - currentScrollTop;

    // Log position periodically
    if (attempts > 0 && attempts % 20 === 0) {
      console.log(
        `(${currentPage}) Scroll attempt ${attempts}/${MAX_ATTEMPTS}. Position: ${Math.round(container.scrollTop)}px.`,
      );
    }

    // --- Process Results ---
    processNewProfiles(); // Find and store any new profiles revealed by the scroll

    // --- Check Stop Conditions ---
    // Determine if scrolling should stop for the current page
    const isAtBottom =
      scrollContainerHeight > 0 && container.scrollTop + container.clientHeight >= scrollContainerHeight - 10; // Reached end?
    // const noScrollChange = scrolledDistance <= 0 && attempts > 0; // Did scroll position actually change? (Commented out as less reliable)
    const maxAttemptsReached = attempts >= MAX_ATTEMPTS; // Exceeded attempt limit?
    const noNewProfilesLimit = noNewNamesCount >= NO_NEW_PROFILES_THRESHOLD; // Stuck finding new profiles?

    let stopReason = null;
    if (isAtBottom) stopReason = "Reached bottom (calculated). 🏁";
    else if (noNewProfilesLimit)
      stopReason = `No new profiles found threshold (${NO_NEW_PROFILES_THRESHOLD} attempts). 🤷`;
    // else if (noScrollChange) stopReason = "Scroll position did not change. 🛑";
    else if (maxAttemptsReached) stopReason = `Max scroll attempts (${MAX_ATTEMPTS}) reached. 🚫`;

    // --- Handle Page End / Transition ---
    if (stopReason) {
      console.log(`(${currentPage}) Scrolling stopped: ${stopReason}`);
      console.log(`(${currentPage}) Finished page processing at scroll position ${Math.round(container.scrollTop)}px`);

      pagesProcessedCounter++; // Increment processed page count

      // Save progress periodically AND trigger download
      if (pagesProcessedCounter > 0 && pagesProcessedCounter % SAVE_INTERVAL_PAGES === 0) {
        saveProfilesToStorage();
        const periodicFilename = `profiles-page-${currentPage}.json`;
        console.log(
          `-------💾 Saving progress & triggering download (${periodicFilename}) after processing page ${currentPage} (${pagesProcessedCounter} pages processed total) 💾-------`,
        );
        downloadJSON(allProfilesData, periodicFilename); // Trigger periodic download
      }

      // Try to navigate to the next page (no page limit anymore)
      if (goToNextPage()) {
        // Successfully clicked next page button
        console.log(`(${currentPage}) -> Moving to next page... ⏳`);
        isScrolling = true; // Ensure scrolling is enabled for the next page setup
        // Wait, then start the setup process for the *new* page
        setTimeout(() => {
          startScrolling();
        }, PAGE_TRANSITION_DELAY);
        return; // Important: Exit the current scroll loop for the *old* page
      } else {
        // Failed to go to next page (likely the end of results)
        console.log(`(${currentPage}) Could not navigate to next page. Finalizing... 🛑`);
        stopReason = "Could not navigate to next page.";
      }

      // --- Stop the ENTIRE script ---
      console.log(`🏁 Finished scrolling process. Stop Reason: ${stopReason}`);
      isScrolling = false; // Explicitly stop
      // Final download uses the main filename
      downloadJSON(allProfilesData, DOWNLOAD_FILENAME);
      return; // Exit function
    }

    // --- Continue Scrolling ---
    // If no stop condition was met, increment attempt counter and schedule next scroll
    attempts++;
    setTimeout(scroll, SCROLL_DELAY);
  };

  // --- 🎉 Initialization 🎉 ---
  console.log("🚀 Initializing LinkedIn scroll script...");
  loadProfilesFromStorage(); // Load any saved data first
  waitForContainer() // Wait for the main container element
    .then((initialContainer) => {
      container = initialContainer; // Store the container reference
      console.log("✅ Container found, starting initial page setup...");
      startScrolling(); // Start processing the first page
    })
    .catch((error) => {
      // Handle error if the container is never found
      console.error("❌ Failed to find initial container:", error);
      downloadJSON(allProfilesData, DOWNLOAD_FILENAME); // Attempt download with whatever was loaded
    });
  // --- End Initialization ---
})();
