# 🌈 Vibe coding scripts

This repository contains a collection of utility scripts for various one-time tasks. Each script is designed to be self-contained and well-documented.

## Table of contents

- [LinkedIn search results scraper](#linkedin-search-results-scraper)
- [Database migration](#database-migration)

## LinkedIn search results scraper ([`linkedin-sales-navigator-scraper.js`](./linkedin-sales-navigator-scraper.js))

This script automates the process of scrolling through LinkedIn search result pages (specifically for "People" searches), extracting profile data, and saving it.

### ✨ Features

- **📜 Automated scrolling:** Scrolls down result pages automatically to load all profiles.
- **📄 Multi-page navigation:** Automatically clicks the "Next" page button to process multiple pages of results until the end is reached.
- **📊 Data extraction:** Extracts key information for each profile found:
  - Name
  - Company
  - Job Title
  - Location
  - Job Tenure (cleaned format)
  - Profile Image URL
  - Profile URL (Sales Navigator lead URL)
- **💾 Persistence:** Saves scraped profile data to the browser's `localStorage` periodically (every 10 pages by default). This allows you to resume scraping if the script is interrupted.
- **🔄 Resume functionality:** Automatically loads previously saved data from `localStorage` when the script starts.
- **🚫 Deduplication:** Ensures that the same profile is not added multiple times, even if it appears across different pages or reloads.
- **📥 JSON download:** Automatically triggers a download of all collected profile data as a `profiles.json` file when the script finishes processing all available pages or is stopped.
- **⚙️ Configurable:** Key parameters like scroll speed, delays, and save intervals can be adjusted within the script's configuration section.
- ** Emojis:** Uses emojis in console logs for better readability! 🚀

### 🚀 How to use

1.  **Navigate:** Open LinkedIn and perform a "People" search. Ensure you are on the first page of the search results.
2.  **Open console:** Open your browser's Developer Tools (usually by pressing `F12` or right-clicking the page and selecting "Inspect" or "Inspect Element", then navigating to the "Console" tab).
3.  **Copy script:** Copy the entire content of the `scroll-linkedin.js` file.
4.  **Paste & run:** Paste the copied script into the developer console and press `Enter`.
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

### ⚠️ Important notes

- **LinkedIn changes:** LinkedIn frequently updates its website structure. This script relies on specific HTML element selectors (`data-*` attributes, class names). If LinkedIn changes its site design, the script may stop working and will need to be updated.
- **Rate limiting/blocking:** Excessive or rapid scraping can potentially lead to temporary restrictions or warnings from LinkedIn. Use the script responsibly. The current delays are intended to mimic human-like interaction to some extent, but adjust as needed.
- **Browser tab:** Keep the browser tab with the LinkedIn search results active and visible while the script is running.
- **localStorage:** Data is stored in your browser's `localStorage`. Clearing your browser data will remove saved progress.

## Database migration ([`.github/workflows/database-migration.yml`](./.github/workflows/database-migration.yml))

This GitHub Actions workflow automates the process of migrating a PostgreSQL database from Supabase to Azure Database for PostgreSQL.

### ✨ Features

- **🔄 Database migration:** Transfers data from Supabase to Azure PostgreSQL
- **🔍 Dry run support:** Can perform a dry run without actually migrating data
- **💾 Backup creation:** Creates a timestamped backup of the Supabase database
- **✅ Verification steps:** Verifies both the backup and restore operations
- **🧹 Automatic cleanup:** Cleans up temporary files after the operation
- **⏱️ Timeout protection:** Includes a 60-minute timeout to prevent hanging jobs

### 🚀 How to use

1. **Set up secrets:** Add the following secrets to your GitHub repository:

   - `SUPABASE_DB_HOST`
   - `SUPABASE_DB_NAME`
   - `SUPABASE_DB_USER`
   - `SUPABASE_DB_PASSWORD`
   - `AZURE_DB_HOST`
   - `AZURE_DB_NAME`
   - `AZURE_DB_USER`
   - `AZURE_DB_PASSWORD`

2. **Run the workflow:**
   - Go to the "Actions" tab in your GitHub repository
   - Select "Database Migration" from the workflows list
   - Click "Run workflow"
   - Choose whether to perform a dry run (recommended for first-time use)
   - Click "Run workflow" to start the migration

### ⚠️ Important notes

- **Dry run:** Always start with a dry run to verify the connection and backup process
- **Database size:** The workflow has a 60-minute timeout. For very large databases, you may need to adjust this
- **Backup files:** Each run creates a timestamped backup file in the format `supabase_backup_YYYYMMDD_HHMMSS.dump`
- **Error handling:** The workflow includes verification steps and will fail if any critical operation fails
- **Cleanup:** Temporary files are automatically cleaned up after the workflow completes or fails
