const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'pages');

const replacements = [
  {
    find: /className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"/g,
    replace: 'className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors"'
  },
  {
    find: /<thead className="bg-slate-50 border-b border-slate-200">/g,
    replace: '<thead className="bg-slate-50 dark:bg-slate-700\/50 border-b border-slate-200 dark:border-slate-700 transition-colors">'
  },
  {
    find: /className="px-6 py-4 text-sm font-semibold text-slate-600"/g,
    replace: 'className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300"'
  },
  {
    find: /className="px-6 py-4 text-sm font-semibold text-slate-600 text-right"/g,
    replace: 'className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right"'
  },
  {
    find: /className="border-b border-slate-100 hover:bg-slate-50"/g,
    replace: 'className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700\/50 transition-colors"'
  },
  {
    find: /<td className="px-6 py-4 font-medium text-slate-800">/g,
    replace: '<td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">'
  },
  {
    find: /<td className="px-6 py-4 text-slate-800 font-bold">/g,
    replace: '<td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-bold">'
  },
  {
    find: /<td className="px-6 py-4 text-sm text-slate-500">/g,
    replace: '<td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">'
  },
  {
    find: /<h1 className="text-2xl font-bold text-slate-800">/g,
    replace: '<h1 className="text-2xl font-bold text-slate-800 dark:text-white">'
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
        console.log('Updated ' + file);
      }
    }
  });
  console.log('Done resolving tables');
});
