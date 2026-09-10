const XLSX = require('xlsx');
const workbook = XLSX.readFile('/Users/vimalverma/Documents/Projects/psb_survey/other-branch-dates-added.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const json = XLSX.utils.sheet_to_json(worksheet, { raw: false });
console.log(json.slice(0, 3));
