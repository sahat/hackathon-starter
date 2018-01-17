var fs = require('fs'),
  wipeDependencies = function() {
    var file  = fs.readFileSync('package.json'),
      content = JSON.parse(file);
    for (var devDep in content.devDependencies) {
      content.devDependencies[devDep] = '*';
    }
    // for (var dep in content.dependencies) {
    //   content.dependencies[dep] = '*';
    // }
    fs.writeFileSync('package.json', JSON.stringify(content));
  };
if (require.main === module) {
  wipeDependencies();
} else {
  module.exports = wipeDependencies;
}
