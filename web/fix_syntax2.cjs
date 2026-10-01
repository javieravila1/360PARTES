const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'pages');

fs.readdir(directoryPath, function (err, files) {
  if (err) return console.log('Unable to scan directory: ' + err); 
  
  files.forEach(function (file) {
    if (file.endsWith('.tsx')) {
      const filePath = path.join(directoryPath, file);
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      
      // Fix cases where a trailing quote was inserted before other classes
      // transition-colors" max-w-2xl ... -> transition-colors max-w-2xl ...
      content = content.replace(/transition-colors" /g, 'transition-colors ');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed syntax in ' + file);
      }
    }
  });
  console.log('Done fixing syntax');
});
