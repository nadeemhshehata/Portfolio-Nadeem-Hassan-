import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requiredPages = ["index.html", "products.html", "blog.html", "strategy.html", "about.html", "privacy.html", "cart.html"];
const requiredFiles = [...requiredPages, "css/style.css", "js/main.js", "README.md", ".nojekyll"];
const errors = [];

const read = relativePath => readFileSync(join(root, relativePath), "utf8");

for (const file of requiredFiles) {
    if (!existsSync(join(root, file))) errors.push(`Missing required file: ${file}`);
}

const pages = requiredPages.filter(file => existsSync(join(root, file)));
for (const page of pages) {
    const html = read(page);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length) errors.push(`${page} has duplicate IDs: ${[...new Set(duplicates)].join(", ")}`);

    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        const target = match[1];
        if (/^(?:https?:)?\/\//.test(target)) {
            errors.push(`${page} loads a remote asset or link: ${target}`);
            continue;
        }
        if (/^(?:#|mailto:|tel:)/.test(target)) continue;
        const localTarget = target.split(/[?#]/)[0];
        if (localTarget && !existsSync(join(root, localTarget))) {
            errors.push(`${page} references missing local file: ${localTarget}`);
        }
    }

    if (!html.includes('class="skip-link"')) errors.push(`${page} is missing the skip link.`);
    if (!html.includes('id="main-content"')) errors.push(`${page} is missing the main content target.`);
    if (!html.includes('aria-current="page"')) errors.push(`${page} is missing the current-page navigation state.`);
    if (!html.includes('href="strategy.html"')) errors.push(`${page} is missing the Strategy navigation link.`);
}

const script = read("js/main.js");
try {
    new Function(script);
} catch (error) {
    errors.push(`JavaScript syntax error: ${error.message}`);
}

const productCount = (script.match(/\n\s*id:\s*\d+,/g) || []).length;
if (productCount < 5) errors.push(`Product catalog has ${productCount} products; at least 5 are required.`);
if (productCount !== 6) errors.push(`Expected 6 NovaTech products, found ${productCount}.`);

const about = read("about.html");
const roster = [
    ["Nadeem Hassan", "Hass3285", "169093285"],
    ["Elias Zubaidi", "Zuba5051", "169065051"],
    ["Awale Hussein", "Huss8976", "169038976"],
    ["Hasan Muhammad", "Hasa9724", "169099724"],
    ["Omeed Attayi", "atta0147", "169060147"]
];

for (const member of roster) {
    for (const value of member) {
        if (!about.includes(value)) errors.push(`About page is missing roster value: ${value}`);
    }
}

const blog = read("blog.html").toLowerCase();
if (!blog.includes("purpose") || !blog.includes("roadmap") && !blog.includes("going next")) {
    errors.push("Blog post must explain the website purpose and future direction.");
}

const blogSource = read("blog.html");
const blogPostCount = (blogSource.match(/class="team-blog-post"/g) || []).length;
if (blogPostCount !== 5) {
    errors.push(`Expected 5 individually authored team blog posts, found ${blogPostCount}.`);
}

const shareButtonCount = (blogSource.match(/data-share-post=/g) || []).length;
if (shareButtonCount !== 5 || !script.includes("setupShareButtons")) {
    errors.push(`Expected 5 working team-post share controls, found ${shareButtonCount}.`);
}

const strategy = read("strategy.html");
const commerceFeatureCount = (strategy.match(/data-commerce-feature=/g) || []).length;
const businessElementCount = (strategy.match(/data-business-element=/g) || []).length;
const technologyConceptCount = (strategy.match(/data-technology-concept=/g) || []).length;

if (commerceFeatureCount !== 8) {
    errors.push(`Expected all 8 e-commerce technology features, found ${commerceFeatureCount}.`);
}

if (businessElementCount !== 8) {
    errors.push(`Expected all 8 business-model elements, found ${businessElementCount}.`);
}

if (technologyConceptCount < 6) {
    errors.push(`Expected at least 6 Internet and web technology concepts, found ${technologyConceptCount}.`);
}

for (const requiredConcept of ["B2C", "sales revenue", "value chain", "client/server", "DNS", "HTTPS", "TCP/IP", "cloud hosting", "mobile-commerce"]) {
    if (!strategy.toLowerCase().includes(requiredConcept.toLowerCase())) {
        errors.push(`Strategy page is missing course concept: ${requiredConcept}`);
    }
}

for (const [name, username, studentId] of roster) {
    const authorMarker = `data-author="${name}"`;
    if (!blogSource.includes(authorMarker)) errors.push(`Blog is missing a complete post by ${name}.`);
    if (!blogSource.includes(username) || !blogSource.includes(studentId)) {
        errors.push(`Blog author details are incomplete for ${name}.`);
    }
}

const privacy = read("privacy.html");
if (!privacy.includes('id="clear-site-data"') || !script.includes("setupPrivacyControl")) {
    errors.push("Privacy controls are incomplete.");
}

const unexpectedFiles = readdirSync(root).filter(name => name === ".DS_Store");
if (unexpectedFiles.length) errors.push("Remove .DS_Store before publishing.");

if (errors.length) {
    console.error("Site validation failed:\n");
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
}

console.log(`Site validation passed: ${pages.length} pages, ${productCount} products, 5 group members, ${blogPostCount} individual blog posts with sharing, 8 e-commerce features, 8 business-model elements, technology architecture, local-only assets, and privacy controls verified.`);
