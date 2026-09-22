const XLSX = require('xlsx');
const fs = require('fs');

const fileBuffer = fs.readFileSync('/Users/vimalverma/Documents/Projects/psb_survey/public/other-branch-dates-added.xlsx');
const workbook = XLSX.read(fileBuffer, { type: "buffer" });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const json = XLSX.utils.sheet_to_json(worksheet, { raw: false });
console.log(Object.keys(json[0]));
