// Util taken from stackoverflow answer
// https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
module.exports = function toTitleCase(str) {
  return str.replace(/\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};
