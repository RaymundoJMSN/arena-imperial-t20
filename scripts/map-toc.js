// Maps Ameaças de Arton Table of Contents against t20_monsters.json
// Outputs: updated JSON with page numbers + missing monsters list
// Usage: node scripts/map-toc.js

const fs   = require("fs");
const path = require("path");

// ── Table of Contents ─────────────────────────────────────────────────────────
// Format: { name, page } — parent entries kept for matching (e.g. "Dragão Adulto" → page 67)
const TOC = [
  // Áreas de Tormenta
  { name: "Alma Acorrentada",            page: 18 },
  { name: "Armadilhas Vivas",            page: 19 },
  { name: "Bruxo da Tormenta",           page: 20 },
  { name: "Enxame Infernal",             page: 21 },
  { name: "Esmagador Coletivo",          page: 22 },
  { name: "Infecto",                     page: 22 },
  { name: "Veridak",                     page: 24 },
  { name: "Hurobakk",                    page: 24 },
  { name: "Burodron",                    page: 25 },
  { name: "Morgadrel",                   page: 26 },
  { name: "Ezzayn",                      page: 27 },
  { name: "Gatzvalith",                  page: 28 },
  // Brutos & Indomáveis
  { name: "Meio-Orc",                    page: 30 },
  { name: "Orc",                         page: 32 },
  { name: "Orc Mutante",                 page: 33 },
  { name: "Orc Xamã",                    page: 35 },
  { name: "Sapo Atroz",                  page: 35 },
  { name: "Tabrachi",                    page: 36 },
  { name: "Trog",                        page: 37 },
  { name: "Trog Anão",                   page: 39 },
  { name: "Ogro",                        page: 40 },
  // Capangas & Bandoleiros
  { name: "Bandido",                     page: 42 },
  { name: "Capanga",                     page: 43 },
  { name: "Chefe do Crime",              page: 44 },
  { name: "Clérigo de Hyninn",           page: 45 },
  { name: "Devoto de Hyninn",            page: 47 },
  { name: "Gatuno",                      page: 48 },
  { name: "Duplo",                       page: 50 },
  // Culto de Aharadak
  { name: "Acólito da Agonia",           page: 52 },
  { name: "Aspecto de Aharadak",         page: 53 },
  { name: "Fanático Lefou",              page: 55 },
  { name: "Reishid",                     page: 56 },
  { name: "Senhor do Gigante Rubro",     page: 57 },
  { name: "Zyrrinaz",                    page: 58 },
  { name: "Avatar de Aharadak",          page: 62 },
  // Dragões
  { name: "Dragão Menor",                page: 64 },
  { name: "Dragão Adulto",               page: 67 },
  { name: "Dragão Venerável",            page: 69 },
  { name: "Dragão Feral",                page: 72 },
  { name: "Dragão Bicéfalo",             page: 72 },
  { name: "Dragão-Real",                 page: 74 },
  { name: "Sckhar",                      page: 76 },
  // Duyshidakk
  { name: "Bugbear",                     page: 78 },
  { name: "Bruxa Goblin",                page: 79 },
  { name: "Gangue Goblin",               page: 80 },
  { name: "Goblin-Bomba",                page: 81 },
  { name: "Goblin de Ferro",             page: 82 },
  { name: "Hobgoblin Atirador",          page: 83 },
  { name: "Hobgoblin Comandante Tático", page: 84 },
  { name: "Hobgoblin Gladiador",         page: 85 },
  { name: "Sangue de Ayrrak",            page: 86 },
  // Elementais
  { name: "Aquin'ne",                    page: 88 },
  { name: "Corgann",                     page: 89 },
  { name: "Namasqall",                   page: 90 },
  { name: "T'Peel",                      page: 91 },
  { name: "Rarvnaak",                    page: 92 },
  { name: "Hallus'tir",                  page: 93 },
  { name: "Pakk",                        page: 94 },
  { name: "Ber-baram",                   page: 95 },
  { name: "Serpentaar",                  page: 95 },
  { name: "Terrier",                     page: 96 },
  { name: "Pamgra",                      page: 97 },
  { name: "Tanaloom",                    page: 98 },
  { name: "Elemental Corrompido",        page: 100 },
  // Ermos
  { name: "Bulette",                     page: 102 },
  { name: "Carrasco de Lena",            page: 103 },
  { name: "Centauro Chefe",              page: 104 },
  { name: "Centauro Xamã de Megalokk",   page: 105 },
  { name: "Ente",                        page: 106 },
  { name: "Estirge",                     page: 107 },
  { name: "Fera-Cacto",                  page: 108 },
  { name: "Lagarto Perseguidor",         page: 110 },
  { name: "Tendrículo",                  page: 111 },
  { name: "Rhandomm",                    page: 112 },
  // Gnolls
  { name: "Gnoll Caçador de Cabeças",    page: 114 },
  { name: "Gnoll Capanga",               page: 115 },
  { name: "Gnoll Líder de Alcateia",     page: 116 },
  { name: "Gnoll Xamã",                  page: 118 },
  { name: "Hiena",                       page: 119 },
  { name: "Matrona Gnoll",               page: 120 },
  { name: "Gnoll Vuul'rak",              page: 122 },
  // Golens
  { name: "Gárgula",                     page: 124 },
  { name: "Golem de Barro",              page: 125 },
  { name: "Golem de Bronze",             page: 126 },
  { name: "Golem de Carne",              page: 127 },
  { name: "Golem de Espelhos",           page: 128 },
  { name: "Golem de Ferro",              page: 129 },
  { name: "Golem de Matéria Vermelha",   page: 130 },
  { name: "Golem de Pedra",              page: 131 },
  { name: "Instrumento Divino",          page: 132 },
  { name: "Soldado Mecânico",            page: 133 },
  // Igreja de Arsenal
  { name: "Coletor de Arsenal",          page: 136 },
  { name: "Forjador Litúrgico",          page: 137 },
  { name: "Guerreiro Perpétuo",          page: 139 },
  { name: "Kishin",                      page: 139 },
  { name: "Sacerdote de Guerra",         page: 140 },
  { name: "Kishinauros",                 page: 142 },
  // Igreja de Kallyadranoch
  { name: "Cavaleiro de Kallyadranoch",  page: 144 },
  { name: "Clérigo de Kally",            page: 145 },
  { name: "Corcel de Kally",             page: 147 },
  { name: "Dracomante",                  page: 148 },
  { name: "Kallyanach",                  page: 150 },
  { name: "Avatar de Kallyadranoch",     page: 152 },
  // Império de Jade
  { name: "Kabuto",                      page: 154 },
  { name: "Kaijin",                      page: 156 },
  { name: "Kappa",                       page: 158 },
  { name: "Mashin",                      page: 159 },
  { name: "Nezumi",                      page: 160 },
  { name: "Oni",                         page: 162 },
  { name: "Tengu",                       page: 163 },
  { name: "Dragão Celestial",            page: 165 },
  // Império de Tauron
  { name: "Arqueiro Escravo",            page: 168 },
  { name: "Centurião",                   page: 169 },
  { name: "Fúria de Tauron",             page: 170 },
  { name: "Gladiador Táurico",           page: 171 },
  { name: "Legionário",                  page: 172 },
  { name: "Legionário Insano",           page: 173 },
  { name: "Minauro",                     page: 174 },
  { name: "Governador Corrupto",         page: 176 },
  // Kobolds
  { name: "Cão de Kally",                page: 179 },
  { name: "Enxame Larval",               page: 180 },
  { name: "Kobold",                      page: 180 },
  { name: "Kobold Bruto",                page: 184 },
  { name: "Kobold Explosivo",            page: 184 },
  { name: "Kobold Xamã",                 page: 185 },
  { name: "Kobold-Mãe",                  page: 186 },
  { name: "Vagalhão Kobold",             page: 188 },
  // Mascotes & Familiares
  { name: "Bogum",                       page: 190 },
  { name: "Escudeiro",                   page: 191 },
  { name: "Fofo",                        page: 192 },
  { name: "Gambá",                       page: 192 },
  { name: "Homúnculo",                   page: 193 },
  { name: "Kill'Bone",                   page: 194 },
  { name: "Tentacute",                   page: 194 },
  { name: "Verilêmur",                   page: 196 },
  { name: "Malafex",                     page: 196 },
  // Masmorras
  { name: "Asa-Assassina",               page: 198 },
  { name: "Cocatriz",                    page: 199 },
  { name: "Harpia",                      page: 200 },
  { name: "Glop",                        page: 201 },
  { name: "Glooop",                      page: 201 },
  { name: "Mamãe Glop",                  page: 202 },
  { name: "Mantor",                      page: 203 },
  { name: "Mímico",                      page: 203 },
  { name: "Quimera",                     page: 204 },
  { name: "Slark",                       page: 205 },
  { name: "Tigre-de-Hyninn",             page: 206 },
  { name: "Brawar",                      page: 208 },
  // Montarias
  { name: "Baleote",                     page: 210 },
  { name: "Capivara",                    page: 211 },
  { name: "Cavalo de Carga",             page: 212 },
  { name: "Cavalo de Montaria",          page: 212 },
  { name: "Cavalo de Guerra",            page: 212 },
  { name: "Cavalo de Namalkah",          page: 213 },
  { name: "Cavalo Glacial",              page: 213 },
  { name: "Corcel do Deserto",           page: 214 },
  { name: "Dromedário",                  page: 215 },
  { name: "Elefante",                    page: 216 },
  { name: "Gorlogg",                     page: 216 },
  { name: "Leão",                        page: 217 },
  { name: "Pantera",                     page: 218 },
  { name: "Tigre",                       page: 218 },
  { name: "Rinoceronte",                 page: 219 },
  { name: "Tatu-Montanha",               page: 220 },
  { name: "Trobo",                       page: 220 },
  { name: "Tumarkhân",                   page: 221 },
  { name: "Urso Panda",                  page: 223 },
  { name: "Urso Pardo",                  page: 223 },
  { name: "Urso das Cavernas",           page: 224 },
  { name: "Warg",                        page: 224 },
  { name: "Unicórnio",                   page: 226 },
  // Mortos-Vivos
  { name: "Carniçal",                    page: 228 },
  { name: "Esqueleto",                   page: 229 },
  { name: "Fantasma",                    page: 231 },
  { name: "Garra-Zumbi",                 page: 233 },
  { name: "Lívido",                      page: 234 },
  { name: "Mortalha",                    page: 235 },
  { name: "Múmia",                       page: 236 },
  { name: "Senhor das Múmias",           page: 236 },
  { name: "Necrodraco",                  page: 238 },
  { name: "Tarso",                       page: 240 },
  // Mundo Perdido
  { name: "Árvore-Matilha",              page: 242 },
  { name: "Burafonte",                   page: 242 },
  { name: "Deinonico",                   page: 244 },
  { name: "Espada-da-Floresta",          page: 245 },
  { name: "Galhada",                     page: 246 },
  { name: "Gali-Gali",                   page: 247 },
  { name: "Grande Battham",              page: 247 },
  { name: "Raagoran",                    page: 248 },
  { name: "Tuntram",                     page: 249 },
  { name: "Rei-Tirano",                  page: 250 },
  // Piratas & Pistoleiros
  { name: "Afogado",                     page: 252 },
  { name: "Armeiro de Tenebra",          page: 253 },
  { name: "Demônio da Pólvora",          page: 255 },
  { name: "Goblin de Sombreiro",         page: 256 },
  { name: "Homem-Piranha",               page: 256 },
  { name: "Pirata",                      page: 258 },
  { name: "Pistoleiro de Smokestone",    page: 260 },
  { name: "Sahuagin",                    page: 261 },
  { name: "Chapéu-Preto",                page: 262 },
  { name: "Lobo do Mar",                 page: 263 },
  // Povos-Trovão
  { name: "Ceratops",                    page: 264 },
  { name: "Pteros",                      page: 265 },
  { name: "Velocis",                     page: 267 },
  { name: "Voracis",                     page: 269 },
  { name: "Sarana",                      page: 271 },
  { name: "Divina Serpente",             page: 272 },
  // Puristas
  { name: "Arcano de Guerra",            page: 274 },
  { name: "Caçador de Impuros",          page: 275 },
  { name: "Carruagem de Comando",        page: 276 },
  { name: "Dançarino de Guerra",         page: 278 },
  { name: "Purificado",                  page: 279 },
  { name: "Soldado Blindado",            page: 280 },
  // Reino dos Mortos
  { name: "Alzeras",                     page: 284 },
  { name: "Cemitério Vivo",              page: 285 },
  { name: "Chacal-Zumbi",                page: 286 },
  { name: "Mercenário de Aslothia",      page: 288 },
  { name: "Morgue'raz",                  page: 289 },
  { name: "Wisphago",                    page: 290 },
  { name: "Lich",                        page: 291 },
  { name: "Arquilich Ferren Asloth",     page: 292 },
  // Reinos de Moreania
  { name: "Búfalo-de-Guerra",            page: 296 },
  { name: "Hippossauro",                 page: 297 },
  { name: "Mantícora",                   page: 298 },
  { name: "Otyugh",                      page: 299 },
  { name: "Yidishan",                    page: 299 },
  { name: "Moreau",                      page: 301 },
  // Sanguinárias
  { name: "Cerianthar",                  page: 306 },
  { name: "Grande Tachygloss",           page: 307 },
  { name: "Oxxdon",                      page: 308 },
  { name: "Razza'Kham",                  page: 309 },
  { name: "Serpe",                       page: 310 },
  { name: "Uraghian",                    page: 311 },
  { name: "Kaiju",                       page: 312 },
  // Sob as Ondas
  { name: "Canceronte",                  page: 314 },
  { name: "Elfo-do-Mar",                 page: 315 },
  { name: "Enguia Rainha",               page: 317 },
  { name: "Irukanjin",                   page: 318 },
  { name: "Nereida",                     page: 320 },
  { name: "Peixe-Recife",                page: 321 },
  { name: "Platan",                      page: 322 },
  { name: "Selako",                      page: 322 },
  // Sszzaazitas
  { name: "Adorador de Sszzaas",         page: 326 },
  { name: "Elemental do Veneno",         page: 328 },
  { name: "Górgona",                     page: 329 },
  { name: "Nagah Arcanista",             page: 330 },
  { name: "Nagah Dormente",              page: 331 },
  { name: "Nagah Defensor",              page: 332 },
  { name: "Nagah Retalhador",            page: 332 },
  { name: "Nagah Sacerdotisa",           page: 334 },
  { name: "Rival Espelho",               page: 334 },
  { name: "Zumbi Peçonha",               page: 335 },
  { name: "Sszzaazita Celebrante",       page: 336 },
  { name: "Nastarrath",                  page: 336 },
  // Trolls Nobres
  { name: "Arcanista Finntroll",         page: 338 },
  { name: "Defeituoso",                  page: 339 },
  { name: "Mycotann",                    page: 340 },
  { name: "Opressor Finntroll",          page: 341 },
  { name: "Perdigueiro Troll",           page: 343 },
  { name: "Protetor-Refém",              page: 344 },
  { name: "Cavaleiro Finntroll",         page: 344 },
  { name: "Sacerdote Finntroll",         page: 346 },
  // Uivantes
  { name: "Carcaju",                     page: 348 },
  { name: "Golem de Nor",                page: 348 },
  { name: "Mamute",                      page: 350 },
  { name: "Minotauro da Manada",         page: 351 },
  { name: "Ogro Furioso",                page: 352 },
  { name: "Soterrado",                   page: 353 },
  { name: "Stagh",                       page: 354 },
  { name: "Urso das Neves",              page: 354 },
  { name: "Verme de Gelo",               page: 356 },
];

// ── Matching helpers ──────────────────────────────────────────────────────────

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9\s]/g, " ")    // punctuation → space
    .replace(/\s+/g, " ")
    .trim();
}

function matches(monsterName, tocName) {
  const mn = normalize(monsterName);
  const tn = normalize(tocName);
  // Exact match
  if (mn === tn) return true;
  // DB name starts with ToC name (e.g. "Dragão Adulto da Tirania" matches "Dragão Adulto")
  if (mn.startsWith(tn)) return true;
  // ToC name is contained in DB name
  if (mn.includes(tn)) return true;
  return false;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const monstersPath = path.join(__dirname, "..", "public", "json", "t20_monsters.json");
const monsters = JSON.parse(fs.readFileSync(monstersPath, "utf8"));

const adaMonsters = monsters.filter(m => m.sources === "Ameaças de Arton");
const adaNames = adaMonsters.map(m => m.name);

const matched = [];   // ToC entries found in DB
const missing = [];   // ToC entries NOT found in DB

for (const entry of TOC) {
  const found = adaMonsters.filter(m => matches(m.name, entry.name));
  if (found.length > 0) {
    matched.push({
      toc: entry.name,
      page: entry.page,
      db: found.map(m => m.name),
    });
    // Update source with page number
    found.forEach(m => {
      m.sources = `Ameaças de Arton: ${entry.page}`;
    });
  } else {
    missing.push({ name: entry.name, book: "Ameaças de Arton", page: entry.page });
  }
}

// DB monsters from AdA not matched to any ToC entry (might be variants)
const matchedDbNames = new Set(matched.flatMap(m => m.db));
const unmatched = adaMonsters.filter(m => !matchedDbNames.has(m.name)).map(m => m.name);

// ── Output ────────────────────────────────────────────────────────────────────

// Save updated monsters.json
fs.writeFileSync(monstersPath, JSON.stringify(monsters, null, 2), "utf8");
console.log(`✓ ${matched.length} ToC entries matched → sources updated with page numbers`);

console.log(`\n── FALTANDO NO BANCO (${missing.length} ameaças) ──`);
missing.forEach(m => console.log(`  ${m.name} | Ameaças de Arton: ${m.page}`));

if (unmatched.length) {
  console.log(`\n── NO BANCO SEM PAGE (${unmatched.length} monstros) ──`);
  unmatched.forEach(n => console.log(`  ${n}`));
}
