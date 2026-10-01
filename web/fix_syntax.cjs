const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'pages');

const replacements = [
  {
    find: /transition-colors" max-w-md">/g,
    replace: 'transition-colors max-w-md">'
  }
];

fs.readdir(directoryPath, function (err, files) {
  if (err) return console.log('Unable to scan directory: ' + err); 
  
  files.forEach(function (file) {
    if (file.endsWith('.tsx')) {
      const filePath = path.join(directoryPath, file);
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      
      replacements.forEach(r => {
        content = content.replace(r.find, r.replace);
      });
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed syntax in ' + file);
      }
    }
  });
  console.log('Done fixing syntax');
});
