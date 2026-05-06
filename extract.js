const fs = require('fs');

function extractData(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed.tables) return parsed.tables; // For list_tables
    
    if (parsed.result) {
      const match = parsed.result.match(/<untrusted-data-[^>]+>\n([\s\S]*?)\n<\/untrusted-data-[^>]+>/);
      if (match) {
        return JSON.parse(match[1].trim());
      }
    }
  } catch (e) {
    console.error('Error parsing', filePath, e.message);
  }
  return null;
}

const baseDir = 'C:/Users/HP 2026/.gemini/antigravity/brain/a3857332-353c-4c6e-a034-f6ceef3fab4c/.system_generated/steps/';
const columns = extractData(baseDir + '251/output.txt');
const fkeys = extractData(baseDir + '252/output.txt');
const rls = extractData(baseDir + '253/output.txt');
const funcs = extractData(baseDir + '254/output.txt');
const tables = extractData(baseDir + '269/output.txt');

console.log("=== TABLES ===");
if (tables) tables.forEach(t => console.log(t.name, t.columns.map(c => c.name).join(', ')));

console.log("\n=== RLS POLICIES ===");
if (rls) rls.forEach(r => console.log(`${r.schemaname}.${r.tablename}: ${r.policyname} (${r.roles}) [${r.cmd}]`));

console.log("\n=== FUNCTIONS ===");
if (funcs) funcs.forEach(f => console.log(`${f.routine_name} () -> ${f.return_type}`));

