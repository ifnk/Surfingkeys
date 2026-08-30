import {
    extractTableMatrix,
    formatCsvFilename,
    rowsToMatrix,
    serializeCsv,
} from 'src/content_scripts/common/table.js';

describe('table CSV extraction', () => {
    test('extracts a native table and expands merged cells', () => {
        document.body.innerHTML = `
            <table id="native">
                <thead><tr><th rowspan="2">Name</th><th colspan="2">Score</th></tr><tr><th>A</th><th>B</th></tr></thead>
                <tbody><tr><td>Tom</td><td>1</td><td>2</td></tr></tbody>
            </table>`;

        expect(extractTableMatrix(document.querySelector('#native'))).toEqual({
            adapter: 'html',
            matrix: [
                ['Name', 'Score', ''],
                ['Name', 'A', 'B'],
                ['Tom', '1', '2']
            ]
        });
    });

    test('joins Ant Design header and body tables and skips measure rows', () => {
        document.body.innerHTML = `
            <div class="ant-table-container" id="ant">
                <div class="ant-table-header"><table><thead><tr><th>ID</th><th>Name</th></tr></thead></table></div>
                <div class="ant-table-body"><table><tbody>
                    <tr class="ant-table-measure-row"><td>ID</td><td>Name</td></tr>
                    <tr><td>1</td><td>Alice</td></tr>
                </tbody></table></div>
            </div>`;

        expect(extractTableMatrix(document.querySelector('#ant'))).toEqual({
            adapter: 'ant-design',
            matrix: [['ID', 'Name'], ['1', 'Alice']]
        });
    });

    test('extracts an Ant Design content table used in dialogs', () => {
        document.body.innerHTML = `
            <div class="ant-table-container" id="ant-dialog">
                <div class="ant-table-content"><table>
                    <thead><tr><th>ID</th><th>Type</th></tr></thead>
                    <tbody><tr><td>1</td><td>SAI2404D-1</td></tr></tbody>
                </table></div>
            </div>`;

        expect(extractTableMatrix(document.querySelector('#ant-dialog'))).toEqual({
            adapter: 'ant-design',
            matrix: [['ID', 'Type'], ['1', 'SAI2404D-1']]
        });
    });

    test('joins Element Plus header and body tables', () => {
        document.body.innerHTML = `
            <div class="el-table" id="element">
                <div class="el-table__header-wrapper"><table class="el-table__header"><thead><tr><th>Date</th></tr></thead></table></div>
                <div class="el-table__body-wrapper"><table class="el-table__body"><tbody><tr><td>2026-08-30</td></tr></tbody></table></div>
            </div>`;

        expect(extractTableMatrix(document.querySelector('#element'))).toEqual({
            adapter: 'element-plus',
            matrix: [['Date'], ['2026-08-30']]
        });
    });

    test('serializes commas, quotes and newlines as CSV', () => {
        expect(serializeCsv([['a,b', 'say "hi"', 'line1\nline2']]))
            .toBe('"a,b","say ""hi""","line1\nline2"');
    });

    test('formats a local timestamp CSV filename', () => {
        expect(formatCsvFilename(new Date(2026, 7, 30, 15, 4, 5)))
            .toBe('table-20260830-150405.csv');
    });

    test('reads form control values inside cells', () => {
        document.body.innerHTML = '<table><tbody><tr><td><input value="edited"></td></tr></tbody></table>';
        expect(rowsToMatrix(document.querySelectorAll('tr'))).toEqual([['edited']]);
    });
});
