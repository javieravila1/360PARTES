const fs = require('fs');
const transcriptPath = "C:\\Users\\javie\\.gemini\\antigravity-ide\\brain\\5433a426-f228-4c8b-b4b6-e809ce0414fd\\.system_generated\\logs\\transcript_full.jsonl";
let lines = fs.readFileSync(transcriptPath, 'utf-8').split('\n');

let latestWrite = {};
let latestView = {};
let markerFound = false;

for (let line of lines) {
    if (!line.trim()) continue;
    try {
        const entry = JSON.parse(line);
        if (entry.type === "USER_INPUT" && entry.content && entry.content.includes("Quiero que rediseñes por completo el frontend")) {
            markerFound = true;
            break;
        }

        if (entry.tool_calls) {
            for (let call of entry.tool_calls) {
                if (call.name === "write_to_file" && call.args && call.args.TargetFile) {
                    let target = call.args.TargetFile.toLowerCase();
                    if (target.includes('postcss.config.js') || target.includes('tailwind.config.js') || target.includes('package.json')) {
                        latestWrite[target] = call.args.CodeContent;
                    }
                }
            }
        }
        if (entry.type === "TOOL_RESPONSE") {
            for (let res of entry.tool_responses) {
                if (res.name === "view_file" && res.content) {
                    let match = res.content.match(/File Path: `file:\/\/\/(.+?)`/);
                    if (match) {
                        let filePath = match[1].replace(/\//g, '\\').toLowerCase();
                        if (filePath.includes('postcss.config.js') || filePath.includes('tailwind.config.js') || filePath.includes('package.json')) {
                            latestView[filePath] = res.content;
                        }
                    }
                }
            }
        }
    } catch (e) {}
}

function cleanViewFile(output) {
    let lines = output.split('\n');
    let cleaned = [];
    let started = false;
    for (let l of lines) {
        if (!started && l.match(/^1: /)) started = true;
        if (started) {
            let m = l.match(/^\d+: (.*)$/);
            if (m) cleaned.push(m[1]);
            else if (l.match(/^\d+:$/)) cleaned.push("");
        }
    }
    return cleaned.join('\n');
}

for (let k of Object.keys(latestWrite)) {
    fs.writeFileSync('restore_' + k.split('\\').pop(), latestWrite[k]);
}
for (let k of Object.keys(latestView)) {
    if (!latestWrite[k]) {
        fs.writeFileSync('restore_' + k.split('\\').pop(), cleanViewFile(latestView[k]));
    }
}
