
/**
 * Converts an array of objects to a CSV string.
 * @param data The array of objects to convert.
 * @returns The CSV formatted string.
 */
function convertToCSV(data: any[]): string {
    if (!data || data.length === 0) {
        return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')]; // Header row

    for (const row of data) {
        const values = headers.map(header => {
            let cell = row[header] === null || row[header] === undefined ? '' : row[header];
            
            // If the cell is an object, stringify it
            if(typeof cell === 'object' && cell !== null) {
                cell = JSON.stringify(cell);
            } else {
                cell = String(cell);
            }

            // Escape quotes by doubling them
            cell = cell.replace(/"/g, '""');

            // If the cell contains a comma, newline, or quote, enclose it in quotes
            if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
            }
            return cell;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}


/**
 * Triggers a file download in the browser.
 * @param data The array of objects to export.
 * @param filename The name of the file to be downloaded (e.g., 'data.csv').
 */
export function exportToCSV(data: any[], filename: string): void {
    const csvString = convertToCSV(data);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
