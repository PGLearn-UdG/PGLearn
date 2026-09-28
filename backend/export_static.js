const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database('./quiz.db');

// Get all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

// Get modules ordered by sort_order
const modules = db.prepare('SELECT * FROM modules ORDER BY sort_order ASC, id ASC').all();

// Get quizzes
const quizzes = {};
modules.forEach(m => {
    const q = db.prepare('SELECT json_structure FROM quiz_schema WHERE module_id = ?').get(m.id);
    quizzes[m.id] = q || { json_structure: '[]' };
});

// Get theory if table exists
const theories = {};
const hasTheory = tables.some(t => t.name === 'theory');
if (hasTheory) {
    modules.forEach(m => {
        const t = db.prepare('SELECT content_html FROM theory WHERE module_id = ?').get(m.id);
        theories[m.id] = t || { content_html: '' };
    });
}

// Get settings if table exists
const hasSettings = tables.some(t => t.name === 'settings');
let settings = {};
if (hasSettings) {
    const allSettings = db.prepare('SELECT key, value FROM settings').all();
    allSettings.forEach(s => { settings[s.key] = s.value; });
}

const data = { modules, quiz: quizzes, theory: theories, ...settings };

// Write to public folder (both root and data/ subfolder for compatibility)
const publicDir = path.join(__dirname, '..', 'frontend', 'public');
const dataSubdir = path.join(publicDir, 'data');
if (!fs.existsSync(dataSubdir)) fs.mkdirSync(dataSubdir, { recursive: true });

const content = 'window.LIPPSO_QUIZ_DATA = ' + JSON.stringify(data) + ';';
fs.writeFileSync(path.join(publicDir, 'data.js'), content);
fs.writeFileSync(path.join(dataSubdir, 'data.js'), content);

// Also write to repo root for GitHub Pages
const rootDir = path.join(__dirname, '..');
const rootDataSubdir = path.join(rootDir, 'data');
if (!fs.existsSync(rootDataSubdir)) fs.mkdirSync(rootDataSubdir, { recursive: true });
fs.writeFileSync(path.join(rootDir, 'data.js'), content);
fs.writeFileSync(path.join(rootDataSubdir, 'data.js'), content);

console.log('Static data exported to public/ and root data.js / data/data.js');

// Also copy uploads folder to public and root
const uploadsSource = path.join(__dirname, 'uploads');
const uploadsDest = path.join(publicDir, 'uploads');
const rootUploadsDest = path.join(rootDir, 'uploads');

[uploadsDest, rootUploadsDest].forEach(dest => {
    if (fs.existsSync(uploadsSource)) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        const files = fs.readdirSync(uploadsSource);
        files.forEach(f => {
            fs.copyFileSync(path.join(uploadsSource, f), path.join(dest, f));
        });
        console.log('Copied', files.length, 'upload files to', dest);
    }
});

