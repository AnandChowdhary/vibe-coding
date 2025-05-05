## LinkedIn Search Results Scraper Script ([`linkedin-sales-navigator-scraper.js`](./linkedin-sales-navigator-scraper.js))

This script automates the process of scrolling through LinkedIn search result pages (specifically for "People" searches), extracting profile data, and saving it.

### ✨ Features

- **📜 Automated Scrolling:** Scrolls down result pages automatically to load all profiles.
- **📄 Multi-Page Navigation:** Automatically clicks the "Next" page button to process multiple pages of results until the end is reached.
- **📊 Data Extraction:** Extracts key information for each profile found:
  - Name
  - Company
  - Job Title
  - Location
  - Job Tenure (cleaned format)
  - Profile Image URL
  - Profile URL (Sales Navigator lead URL)
- **💾 Persistence:** Saves scraped profile data to the browser's `localStorage` periodically (every 10 pages by default). This allows you to resume scraping if the script is interrupted.
- **🔄 Resume Functionality:** Automatically loads previously saved data from `localStorage` when the script starts.
- **🚫 Deduplication:** Ensures that the same profile is not added multiple times, even if it appears across different pages or reloads.
- **📥 JSON Download:** Automatically triggers a download of all collected profile data as a `profiles.json` file when the script finishes processing all available pages or is stopped.
- **⚙️ Configurable:** Key parameters like scroll speed, delays, and save intervals can be adjusted within the script's configuration section.
- ** Emojis:** Uses emojis in console logs for better readability! 🚀

### 🚀 How to Use

1.  **Navigate:** Open LinkedIn and perform a "People" search. Ensure you are on the first page of the search results.
2.  **Open Console:** Open your browser's Developer Tools (usually by pressing `F12` or right-clicking the page and selecting "Inspect" or "Inspect Element", then navigating to the "Console" tab).
3.  **Copy Script:** Copy the entire content of the `scroll-linkedin.js` file.
4.  **Paste & Run:** Paste the copied script into the developer console and press `Enter`.
5.  **Observe:** The script will start logging its progress in the console. It will:
    - Wait for the page elements to load.
    - Scroll down the current page.
    - Extract profile data.
    - Navigate to the next page.
    - Repeat until no more pages are found.
    - Save progress to `localStorage` every 10 pages.
6.  **Download:** Once finished, it will automatically trigger the download of a `profiles.json` file containing all the unique profiles collected.

### 🔧 Configuration (Optional)

The script includes several constants at the top that you can modify:

- `SCROLL_DELAY`: Time (ms) between scroll attempts. Higher values are slower but potentially more reliable.
- `SCROLL_AMOUNT`: Pixels scrolled per attempt. Smaller values are slower.
- `NO_NEW_PROFILES_THRESHOLD`: How many consecutive scroll attempts without finding new profiles before stopping the current page.
- `STORAGE_KEY`: The key used for `localStorage`.
- `DOWNLOAD_FILENAME`: The name of the downloaded JSON file.
- `SAVE_INTERVAL_PAGES`: How many pages to process before saving progress to `localStorage`.
- Other timeouts and delays related to page loading and element checking.

### ⚠️ Important Notes

- **LinkedIn Changes:** LinkedIn frequently updates its website structure. This script relies on specific HTML element selectors (`data-*` attributes, class names). If LinkedIn changes its site design, the script may stop working and will need to be updated.
- **Rate Limiting/Blocking:** Excessive or rapid scraping can potentially lead to temporary restrictions or warnings from LinkedIn. Use the script responsibly. The current delays are intended to mimic human-like interaction to some extent, but adjust as needed.
- **Browser Tab:** Keep the browser tab with the LinkedIn search results active and visible while the script is running.
- **localStorage:** Data is stored in your browser's `localStorage`. Clearing your browser data will remove saved progress.
