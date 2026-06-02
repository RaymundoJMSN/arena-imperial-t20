// Maps Livro Básico / Jogo do Ano index against t20_monsters.json
// Usage: node scripts/map-toc-livrobasico.js

const fs   = require("fs");
const path = require("path");

// Entries that are creatures (skip perigos/doenças/rules topics/category headers)
const TOC = [
  { name: "aparição",                page: 297 },
  { name: "aranha gigante",          page: 286 },
  { name: "arauto de Thwor",         page: 300 },
  { name: "bandido",                 page: 289 },
  { name: "basilisco",               page: 289 },
  { name: "cão do inferno",          page: 289 },
  { name: "capelão de guerra",       page: 295 },
  { name: "capitão-baluarte",        page: 295 },
  { name: "cascavel",                page: 304 },
  { name: "cavaleiro do Leopardo",   page: 295 },
  { name: "centauro",                page: 290 },
  { name: "centopeia-dragão",        page: 286 },
  { name: "cobra",                   page: 304 },
  { name: "cultista de Sszzaas",     page: 305 },
  { name: "devorador de medos",      page: 300 },
  { name: "dragão",                  page: 310 },
  { name: "engenho de guerra goblin",page: 301 },
  { name: "esqueleto",               page: 297 },
  { name: "falange",                 page: 297 },
  { name: "finntroll",               page: 307 },
  { name: "ganchador",               page: 308 },
  { name: "gárgula",                 page: 286 },
  { name: "geraktril",               page: 314 },
  { name: "glop",                    page: 286 },
  { name: "gnoll",                   page: 290 },
  { name: "goblin engenhoqueiro",    page: 301 },
  { name: "goblin salteador",        page: 302 },
  { name: "golem de ferro",          page: 287 },
  { name: "gorlogg",                 page: 291 },
  { name: "grifo",                   page: 291 },
  { name: "guarda",                  page: 292 },
  { name: "guerreiro de chifres",    page: 287 },
  { name: "hidra",                   page: 305 },
  { name: "hobgoblin",               page: 303 },
  { name: "jiboia",                  page: 304 },
  { name: "kobold",                  page: 312 },
  { name: "lagash",                  page: 306 },
  { name: "lefeu",                   page: 314 },
  { name: "lobo",                    page: 292 },
  { name: "lobo-das-cavernas",       page: 292 },
  { name: "maníaco lefou",           page: 315 },
  { name: "mantícora",               page: 287 },
  { name: "nagah",                   page: 306 },
  { name: "naja",                    page: 304 },
  { name: "necromante",              page: 298 },
  { name: "ogro",                    page: 292 },
  { name: "orc",                     page: 287 },
  { name: "otyugh",                  page: 315 },
  { name: "rato gigante",            page: 288 },
  { name: "recruta purista",         page: 294 },
  { name: "sacerdote de Aharadak",   page: 316 },
  { name: "sargento da guarda",      page: 292 },
  { name: "sargento-mor",            page: 294 },
  { name: "soldado purista",         page: 294 },
  { name: "sombra de Thwor",         page: 303 },
  { name: "sucuri",                  page: 290 },
  { name: "thuwarokk",               page: 315 },
  { name: "tirano do terceiro",      page: 313 },
  { name: "trog",                    page: 293 },
  { name: "troll",                   page: 308 },
  { name: "troll das cavernas",      page: 309 },
  { name: "turba de zumbi",          page: 299 },
  { name: "uktril",                  page: 314 },
  { name: "urso-coruja",             page: 293 },
  { name: "vampiro",                 page: 298 },
  { name: "vrakoll",                 page: 309 },
  { name: "serpe",                   page: 293 },
  { name: "zumbi",                   page: 299 },
];

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matches(monsterName, tocName) {
  const mn = normalize(monsterName);
  const tn = normalize(tocName);
  if (mn === tn) return true;
  if (mn.startsWith(tn + " ") || mn.startsWith(tn)) return true;
  if (tn.startsWith(mn)) return true;
  return false;
}

const monstersPath = path.join(__dirname, "..", "public", "json", "t20_monsters.json");
const monsters = JSON.parse(fs.readFileSync(monstersPath, "utf8"));

const lbMonsters = monsters.filter(m => m.sources === "Livro Básico" || m.sources.startsWith("Livro Básico:"));

const matched = [];
const missing = [];

for (const entry of TOC) {
  const found = lbMonsters.filter(m => matches(m.name, entry.name));
  if (found.length > 0) {
    matched.push({ toc: entry.name, page: entry.page, db: found.map(m => m.name) });
    found.forEach(m => { m.sources = `Livro Básico: ${entry.page}`; });
  } else {
    // Also search ALL monsters (might be in AdA or no source match)
    const anyFound = monsters.filter(m => matches(m.name, entry.name));
    missing.push({
      name: entry.name,
      book: "Livro Básico",
      page: entry.page,
      note: anyFound.length ? `(DB tem: ${anyFound.map(m => `"${m.name}" [${m.sources}]`).join(", ")})` : ""
    });
  }
}

fs.writeFileSync(monstersPath, JSON.stringify(monsters, null, 2), "utf8");
console.log(`✓ ${matched.length} entradas mapeadas → sources atualizados`);
if (matched.length) {
  matched.forEach(m => console.log(`  ${m.toc} (p.${m.page}) → ${m.db.join(", ")}`));
}

console.log(`\n── FALTANDO NO BANCO (${missing.length}) ──`);
missing.forEach(m => console.log(`  ${m.name} | Livro Básico: ${m.page}${m.note ? "  " + m.note : ""}`));
