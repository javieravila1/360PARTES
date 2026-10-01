const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'pages');

const replacements = [
  {
    find: /className="bg-white p-6 rounded-xl w-full/g,
    replace: 'className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full transition-colors"'
  },
  {
    find: /className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"/g,
    replace: 'className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-md transition-colors"'
  },
  {
    find: /<h2 className="text-xl font-bold mb-4">/g,
    replace: '<h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">'
  },
  {
    find: /<h2 className="text-xl font-bold mb-1">/g,
    replace: '<h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">'
  },
  {
    find: /<label className="block text-sm font-medium text-slate-700">/g,
    replace: '<label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">'
  },
  {
    find: /className="mt-1 block w-full rounded-lg border-slate-300 border p-2"/g,
    replace: 'className="block w-full rounded-xl border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3 text-sm transition-all outline-none"'
  },
  {
    find: /className="mt-1 block w-full rounded-lg border-slate-300 border p-2.5"/g,
    replace: 'className="block w-full rounded-xl border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3.5 text-sm transition-all outline-none"'
  },
  {
    find: /className="mt-1 block w-full rounded-lg border-slate-300 border p-2 bg-white"/g,
    replace: 'className="block w-full rounded-xl border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3 text-sm transition-all outline-none"'
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
        console.log('Updated Modals/Forms in ' + file);
      }
    }
  });
  console.log('Done resolving modals');
});
