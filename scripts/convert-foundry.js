// Converts Foundry VTT T20 NPC JSON files to t20_monsters.json format
// Usage: node scripts/convert-foundry.js [inputDir] [outputFile]
//   inputDir:   default = ./Foundry
//   outputFile: default = ./public/json/t20_monsters.json

const fs   = require("fs");
const path = require("path");

// ── Mappings ─────────────────────────────────────────────────────────────────

const TIPO = {
  hum: "Humanoide",
  mon: "Monstro",
  ani: "Animal",
  con: "Construto",
  esp: "Espírito",
  mor: "Morto-Vivo",
  dra: "Monstro",   // dragões são monstros
  abo: "Monstro",   // abissais
  ele: "Espírito",  // elementais
  fei: "Espírito",  // fadas
  geo: "Monstro",
  mec: "Construto",
  pla: "Animal",    // plant-like
};

const TAMANHO = {
  min: "Minúsculo",
  peq: "Pequeno",
  med: "Médio",
  gra: "Grande",
  eno: "Enorme",
  col: "Colossal",
};

const ROLE = {
  solo:     "Solo",
  lacaio:   "Lacaio",
  lackey:   "Lacaio",
  special:  "Especial",
  especial: "Especial",
  enxame:   "Enxame",
  swarm:    "Enxame",
  bando:    "Bando",
  horde:    "Bando",
};

const DAMAGE_PT = {
  perda:       "necrótico",
  acido:       "ácido",
  corte:       "corte",
  eletricidade:"eletricidade",
  essencia:    "essência",
  fogo:        "fogo",
  frio:        "frio",
  impacto:     "impacto",
  luz:         "luz",
  psiquico:    "psíquico",
  perfuracao:  "perfuração",
  trevas:      "trevas",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseRole(str) {
  if (!str) return [];
  return str
    .split(/[,;\/\s]+/)
    .map((r) => ROLE[r.trim().toLowerCase()])
    .filter(Boolean);
}

function buildResistances(detTextRaw, tracosRes) {
  const parts = [];

  // Human-readable text from detalhes (highest priority, already in Portuguese)
  const detText = (detTextRaw || "").trim();
  if (detText) parts.push(detText);

  // Parse structural damage resistances from tracos.resistencias
  if (tracosRes) {
    for (const [key, data] of Object.entries(tracosRes)) {
      if (key === "dano") {
        // General damage reduction
        const rd = (data.base || 0) + (data.value || 0);
        if (rd > 0 && !detText.includes("redução de dano")) {
          parts.push(`redução de dano ${rd}`);
        }
        continue;
      }

      const ptName = DAMAGE_PT[key] || key;

      if (data.imunidade && !detText.includes("imun") && !detText.includes(ptName)) {
        parts.push(`imunidade a ${ptName}`);
      } else if (data.vulnerabilidade && !detText.includes("vulnerab") && !detText.includes(ptName)) {
        parts.push(`vulnerabilidade a ${ptName}`);
      } else {
        const val = (data.value || 0) + (data.base || 0);
        if (val > 0 && !detText.includes(ptName)) {
          parts.push(`resistência a ${ptName} ${val}`);
        }
      }
    }
  }

  return parts.join(", ");
}

function convert(data) {
  if (data.type !== "npc") return null;

  const sys      = data.system || {};
  const atrs     = sys.atributos   || {};
  const attrs    = sys.attributes  || {};
  const detalhes = sys.detalhes    || {};
  const tracos   = sys.tracos      || {};
  const pericias = sys.pericias    || {};

  // Defense = defesa.base + relevant attribute base
  const defAttr   = (attrs.defesa && attrs.defesa.atributo) || "des";
  const attrBase  = (atrs[defAttr] && atrs[defAttr].base) || 0;
  const defense   = ((attrs.defesa && attrs.defesa.base) || 0) + attrBase;

  // ND
  const nd = attrs.nd ?? detalhes.nd ?? "0";

  return {
    name:        data.name,
    nd:          isNaN(Number(nd)) ? nd : Number(nd),
    type:        TIPO[detalhes.tipo] || detalhes.tipo || "Monstro",
    tags:        detalhes.raca || "",
    size:        TAMANHO[tracos.tamanho] || tracos.tamanho || "Médio",
    role:        parseRole(detalhes.role),
    init:        (pericias.inic && pericias.inic.value) || 0,
    defense:     defense,
    resistances: buildResistances(detalhes.resistencias, tracos.resistencias),
    hp:          (attrs.pv && attrs.pv.max) || 0,
    sources:     "Ameaças de Arton",
  };
}

// ── Source from path ─────────────────────────────────────────────────────────

function sourceFromPath(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  if (/Ameaças \(Livro Básico\)/i.test(normalized)) return "Livro Básico";
  if (/\/(Abissais|Avatares dos Deuses)\//i.test(normalized)) return "Deuses de Arton";
  return "Ameaças de Arton";
}

// ── Walk directory recursively ────────────────────────────────────────────────

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, cb);
    else if (entry.isFile() && entry.name.endsWith(".json")) cb(full);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

const inputDir   = process.argv[2] || path.join(__dirname, "..", "Foundry");
const outputFile = process.argv[3] || path.join(__dirname, "..", "public", "json", "t20_monsters.json");

const monsters = [];
const errors   = [];

walk(inputDir, (filePath) => {
  try {
    const raw  = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    const m    = convert(data);
    if (m) {
      m.sources = sourceFromPath(filePath);
      monsters.push(m);
    }
  } catch (err) {
    errors.push({ file: filePath, error: err.message });
  }
});

// Sort by ND
monsters.sort((a, b) => {
  const numA = typeof a.nd === "number" ? a.nd : 99;
  const numB = typeof b.nd === "number" ? b.nd : 99;
  return numA - numB || a.name.localeCompare(b.name, "pt");
});

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(monsters, null, 2), "utf8");

console.log(`✓ ${monsters.length} monstros convertidos → ${outputFile}`);
if (errors.length) {
  console.error(`✗ ${errors.length} erros:`);
  errors.forEach((e) => console.error(`  ${e.file}\n    ${e.error}`));
}
