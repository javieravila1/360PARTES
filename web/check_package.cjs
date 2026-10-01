const fs = require('fs');

const transcriptPath = "C:\\Users\\javie\\.gemini\\antigravity-ide\\brain\\5433a426-f228-4c8b-b4b6-e809ce0414fd\\.system_generated\\logs\\transcript_full.jsonl";

let lines = fs.readFileSync(transcriptPath, 'utf-8').split('\n');

let packages = [];
let markerFound = false;

for (let line of lines) {
    if (!line.trim()) continue;
    try {
        const entry = JSON.parse(line);
        if (entry.type === "USER_INPUT" && entry.content && entry.content.includes("Quiero que rediseñes por completo el frontend")) {
            markerFound = true;
        }

        if (markerFound && entry.tool_calls) {
            for (let call of entry.tool_calls) {
                if (call.name === "run_command" && call.args && call.args.CommandLine && call.args.CommandLine.includes("npm install")) {
                    console.log("NPM install ran after marker:", call.args.CommandLine);
                }
                if ((call.name === "write_to_file" || call.name === "replace_file_content") && call.args && call.args.TargetFile && call.args.TargetFile.includes("package.json")) {
                    console.log("package.json was modified after marker!");
                }
            }
        }
    } catch (e) { }
}

if (!markerFound) console.log("Marker not found!");
