/**
 * Export utility functions for downloading data as CSV/PDF
 */

/**
 * Export data to CSV
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file
 * @param {Array} headers - Array of header objects with label and key
 */
export const exportToCSV = (data, filename, headers) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create CSV header row
  const headerRow = headers.map(h => h.label).join(',');
  
  // Create CSV data rows
  const dataRows = data.map(item => {
    return headers.map(header => {
      const value = header.key.split('.').reduce((obj, key) => obj?.[key], item);
      // Escape commas and quotes in CSV
      const stringValue = value != null ? String(value) : '';
      return `"${stringValue.replace(/"/g, '""')}"`;
    }).join(',');
  });

  // Combine header and data
  const csvContent = [headerRow, ...dataRows].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Export analytics data to CSV
 * @param {Object} analyticsData - Analytics data object
 * @param {string} filename - Name of the file
 */
export const exportAnalyticsToCSV = (analyticsData, filename = 'analytics') => {
  if (!analyticsData) return;

  const data = [];
  
  // Add overview stats
  if (analyticsData.overview) {
    Object.entries(analyticsData.overview).forEach(([key, value]) => {
      data.push({
        Metric: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        Value: value
      });
    });
  }

  // Add time series data
  if (analyticsData.combinedTimeSeries) {
    analyticsData.combinedTimeSeries.forEach(item => {
      data.push({
        Date: item.date,
        Blogs: item.blogs || 0,
        Discussions: item.discussions || 0,
        News: item.news || 0
      });
    });
  }

  const headers = [
    { label: 'Metric/Date', key: 'Metric' },
    { label: 'Value', key: 'Value' },
    { label: 'Blogs', key: 'Blogs' },
    { label: 'Discussions', key: 'Discussions' },
    { label: 'News', key: 'News' }
  ];

  exportToCSV(data, filename, headers);
};

/**
 * Export table data to CSV
 * @param {Array} rows - Array of row objects
 * @param {string} filename - Name of the file
 */
export const exportTableToCSV = (rows, filename) => {
  if (!rows || rows.length === 0) return;

  // Auto-detect headers from first row
  const firstRow = rows[0];
  const headers = Object.keys(firstRow).map(key => ({
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
    key: key
  }));

  exportToCSV(rows, filename, headers);
};

/**
 * Print or save as PDF (opens print dialog)
 * @param {HTMLElement} element - Element to print
 * @param {string} title - Title for the print
 */
export const printAsPDF = (element, title = 'Document') => {
  if (!element) return;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};


