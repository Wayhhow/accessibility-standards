/**
 * 橙光队无障碍督导标准查询 - 主应用逻辑
 * Copyright © 2025 Wayhhow
 * Licensed under MIT
 * https://github.com/Wayhhow/accessibility-standards
 */

/**
 * app.js
 * Main Application - initialization, data loading, PDF helper
 */

(function () {
  'use strict';

  /**
   * Open PDF at a specific page in a new tab
   * @param {string} pdfFile - relative path to the PDF file
   * @param {number} page - page number (1-based)
   */
  window.openPdf = function (pdfFile, page) {
    // pdfFile is like "pdf/gb55019-2021.pdf"
    // viewer.html is at "pdf/lib/web/viewer.html"
    // From viewer.html, pdf/gb55019-2021.pdf is at "../../gb55019-2021.pdf" (go up 2 levels: web/ -> lib/ -> pdf/)
    // Or we can use absolute path: "/pdf/gb55019-2021.pdf"
    let fileParam;
    if (pdfFile.startsWith('pdf/')) {
      // Convert "pdf/xxx.pdf" to "../../xxx.pdf" relative to viewer.html
      fileParam = '../../' + pdfFile.substring(4);
    } else {
      fileParam = '../' + pdfFile;
    }
    const viewerUrl = `pdf/lib/web/viewer.html?file=${encodeURIComponent(fileParam)}#page=${page}`;
    window.open(viewerUrl, '_blank', 'noopener,noreferrer');
  };

  /**
   * Load JSON data from a URL
   * @param {string} url
   * @returns {Promise<Object>}
   */
  async function loadJson(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to load ${url}:`, error);
      return null;
    }
  }

  /**
   * Show loading state in outline tree
   */
  function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
          <p style="margin-top: 12px;">正在加载数据...</p>
        </div>
      `;
    }
  }

  /**
   * Show error state
   */
  function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="search-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <p>${message || '数据加载失败，请刷新页面重试'}</p>
        </div>
      `;
    }
  }

  /**
   * Initialize the application
   */
  async function init() {
    // Show loading state
    showLoading('outline-tree');

    // Load data files in parallel
    const [standardsData, searchIndexData] = await Promise.all([
      loadJson('data/standards.json'),
      loadJson('data/search-index.json')
    ]);

    // Store standards data globally for other modules
    if (standardsData) {
      window.standardsData = standardsData;
    }

    // Initialize modules
    if (searchIndexData && searchIndexData.entries) {
      Search.init(searchIndexData.entries);
    } else {
      console.warn('Search index not loaded, search will be unavailable.');
      Search.init([]);
    }

    if (standardsData && standardsData.standards) {
      Outline.init(standardsData);
    } else {
      showError('outline-tree', '标准数据加载失败，请检查网络连接后刷新页面');
    }

    // Common issues module uses embedded data, no async loading needed
    CommonIssues.init();

    // Set up keyboard shortcut: Ctrl+K or Cmd+K to focus search
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // Escape to clear search
      if (e.key === 'Escape') {
        const searchInput = document.getElementById('search-input');
        const resultsSection = document.getElementById('search-results-section');
        if (document.activeElement === searchInput && resultsSection && resultsSection.style.display !== 'none') {
          Search.clearSearch();
        }
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
