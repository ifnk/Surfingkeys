const getCellText = (cell) => {
    const control = cell.querySelector("input:not([type=checkbox]):not([type=radio]), textarea, select");
    if (control) {
        return control.value.trim();
    }
    const text = cell.innerText?.trim() || cell.textContent?.trim() || "";
    if (text) {
        return text;
    }
    return Array.from(cell.querySelectorAll("img[alt]"))
        .map((image) => image.alt.trim())
        .filter(Boolean)
        .join(" ");
};

const rowsToMatrix = (rows) => {
    const matrix = [];
    rows.forEach((row, rowIndex) => {
        matrix[rowIndex] ||= [];
        let columnIndex = 0;
        Array.from(row.cells).forEach((cell) => {
            while (matrix[rowIndex][columnIndex] !== undefined) {
                columnIndex += 1;
            }
            const value = getCellText(cell);
            const rowSpan = Math.max(1, cell.rowSpan || 1);
            const columnSpan = Math.max(1, cell.colSpan || 1);
            for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
                matrix[rowIndex + rowOffset] ||= [];
                for (let columnOffset = 0; columnOffset < columnSpan; columnOffset += 1) {
                    matrix[rowIndex + rowOffset][columnIndex + columnOffset] = columnOffset === 0 ? value : "";
                }
            }
            columnIndex += columnSpan;
        });
    });
    const columnCount = matrix.reduce((count, row) => Math.max(count, row.length), 0);
    return matrix.map((row) => Array.from({length: columnCount}, (_, index) => row[index] ?? ""));
};

const getVisibleRows = (table, sectionSelector) => Array.from(table?.querySelectorAll(sectionSelector) || [])
    .filter((row) => !row.matches(".ant-table-measure-row, [aria-hidden=true]"));

const extractNativeTable = (table) => ({
    adapter: "html",
    matrix: rowsToMatrix(getVisibleRows(table, "tr"))
});

const extractAntDesignTable = (container) => {
    const headerTable = container.querySelector(".ant-table-header table");
    const bodyTable = container.querySelector(".ant-table-body table");
    const contentTable = container.querySelector(".ant-table-content table");
    if (!headerTable && !bodyTable && contentTable) {
        return {
            adapter: "ant-design",
            matrix: rowsToMatrix(getVisibleRows(contentTable, "tr"))
        };
    }
    const headerRows = getVisibleRows(headerTable, "thead tr");
    const bodyRows = getVisibleRows(bodyTable, "tbody tr");
    return {
        adapter: "ant-design",
        matrix: rowsToMatrix([...headerRows, ...bodyRows])
    };
};

const extractElementPlusTable = (container) => {
    const headerTable = container.querySelector(".el-table__header-wrapper .el-table__header, .el-table__header");
    const bodyTable = container.querySelector(".el-table__body-wrapper .el-table__body, .el-table__body");
    const headerRows = getVisibleRows(headerTable, "thead tr");
    const bodyRows = getVisibleRows(bodyTable, "tbody tr");
    return {
        adapter: "element-plus",
        matrix: rowsToMatrix([...headerRows, ...bodyRows])
    };
};

const getTableCopyCandidates = () => {
    const componentTables = Array.from(document.querySelectorAll(".ant-table-container, .el-table"));
    const nativeTables = Array.from(document.querySelectorAll("table"))
        .filter((table) => !table.closest(".ant-table-container, .el-table"));
    return [...componentTables, ...nativeTables].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    });
};

const extractTableMatrix = (candidate) => {
    if (candidate.matches(".ant-table-container")) {
        return extractAntDesignTable(candidate);
    }
    if (candidate.matches(".el-table")) {
        return extractElementPlusTable(candidate);
    }
    return extractNativeTable(candidate);
};

const escapeCsvCell = (value) => {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const serializeCsv = (matrix) => matrix
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");

const formatCsvFilename = (date = new Date()) => {
    const pad = (value) => String(value).padStart(2, "0");
    return `table-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
        + `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.csv`;
};

export {
    extractTableMatrix,
    formatCsvFilename,
    getTableCopyCandidates,
    rowsToMatrix,
    serializeCsv,
};
