const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'pages');

const replacements = [
  {
    find: /className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"/g,
    replace: 'className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors"'
  },
  {
    find: /className="p-4 border-b border-slate-100 bg-slate-50"/g,
    replace: 'className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"'
  },
  {
    find: /className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"/g,
    replace: 'className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white transition-colors"'
  },
  {
    find: /className="border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition bg-white flex flex-col justify-between"/g,
    replace: 'className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition bg-white dark:bg-slate-700 flex flex-col justify-between"'
  },
  {
    find: /<h3 className="font-semibold text-slate-800 leading-tight">/g,
    replace: '<h3 className="font-semibold text-slate-800 dark:text-white leading-tight">'
  },
  {
    find: /className="w-full md:w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"/g,
    replace: 'className="w-full md:w-96 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors"'
  },
  {
    find: /className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between"/g,
    replace: 'className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between"'
  },
  {
    find: /className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"/g,
    replace: 'className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800/50"'
  },
  {
    find: /className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm"/g,
    replace: 'className="bg-white dark:bg-slate-700 p-3 rounded-xl border border-slate-200 dark:border-slate-600 flex justify-between items-center shadow-sm"'
  },
  {
    find: /<h4 className="font-semibold text-slate-800 text-sm">/g,
    replace: '<h4 className="font-semibold text-slate-800 dark:text-white text-sm">'
  },
  {
    find: /className="flex items-center bg-slate-100 rounded-lg p-1"/g,
    replace: 'className="flex items-center bg-slate-100 dark:bg-slate-600 rounded-lg p-1"'
  },
  {
    find: /className="p-1 hover:bg-white rounded text-slate-600"/g,
    replace: 'className="p-1 hover:bg-white dark:hover:bg-slate-500 rounded text-slate-600 dark:text-slate-300"'
  },
  {
    find: /className="p-6 bg-white border-t border-slate-200"/g,
    replace: 'className="p-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700"'
  },
  {
    find: /className="flex justify-between font-bold text-2xl text-slate-800 mb-6"/g,
    replace: 'className="flex justify-between font-bold text-2xl text-slate-800 dark:text-white mb-6"'
  },
  
  // Purchases fixes
  {
    find: /className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"/g,
    replace: 'className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"'
  },
  {
    find: /<h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">/g,
    replace: '<h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">'
  },
  {
    find: /className="block text-sm font-medium text-slate-700 mb-1"/g,
    replace: 'className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"'
  },
  {
    find: /className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col"/g,
    replace: 'className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 flex flex-col transition-colors"'
  }
];

fs.readdir(directoryPath, function (err, files) {
  if (err) return console.log('Unable to scan directory: ' + err); 
  
  files.forEach(function (file) {
    if (file.endsWith('.tsx') && (file === 'Sales.tsx' || file === 'Purchases.tsx')) {
      const filePath = path.join(directoryPath, file);
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      
      replacements.forEach(r => {
        content = content.replace(r.find, r.replace);
      });
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated POS UI in ' + file);
      }
    }
  });
  console.log('Done POS tables');
});
