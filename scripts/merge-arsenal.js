// Enriquece public/json/t20_monsters.json com a ficha completa do Arsenal (github.com/nicholemos/arsenal):
// ataques, habilidades, atributos, perícias, equipamento, tesouro e imagem — e acrescenta os monstros
// que só existem lá (Guia de NPCs, aspectos dos deuses…). Roda de novo quando o arsenal atualizar.
// Usage: node scripts/merge-arsenal.js [caminho/ameacas_db.js]   (default: ../arsenal/ameacas/ameacas_db.js)
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = process.argv[2] || path.join(__dirname, "..", "..", "arsenal", "ameacas", "ameacas_db.js");
const out = path.join(__dirname, "..", "public", "json", "t20_monsters.json");
const db = vm.runInNewContext(fs.readFileSync(src, "utf8") + "\n;AMEACAS_DB;", {});
const monsters = JSON.parse(fs.readFileSync(out, "utf8"));

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const texto = (s) => String(s || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const lista = (x) => x == null ? "" : Array.isArray(x)
  ? x.map((i) => typeof i === "string" ? i : [i.nome || i.name, i.bonus ?? i.valor, i.desc].filter((v) => v != null && v !== "").join(" ")).join(", ")
  : String(x);
const numero = (s) => { const n = parseInt(String(s ?? "").replace(/[^\d-]/g, ""), 10); return isNaN(n) ? 0 : n; };
const TAMANHOS = ["Minúsculo", "Pequeno", "Médio", "Grande", "Enorme", "Colossal"];
const TIPOS = { humanoide: "Humanoide", monstro: "Monstro", animal: "Animal", espirito: "Espírito", mortovivo: "Morto-Vivo", construto: "Construto" };
const COLETIVOS = { bando: "Bando", enxame: "Enxame" }; // subtipo no livro, mas o app filtra como papel de combate

// "Morto-vivo (bando) Grande" → { type, tags, size, coletivo }. Fonte da verdade pra tipo/subtipo/tamanho:
// o compêndio do Foundry trazia raça no lugar do tipo (Zumbi = "Humanoide"), lixo ("o", "???") e caixa mista.
function parseTipo(tipoStr) {
  const m = String(tipoStr || "").trim().match(/^([^\s(]+(?:\s[^\s(]+)*?)\s*(?:\(([^)]*)\))?\s*(Minúsculo|Pequeno|Médio|Grande|Enorme|Colossal)?$/);
  if (!m) return null;
  const type = TIPOS[Object.keys(TIPOS).find((k) => norm(m[1]).startsWith(k))];
  if (!type) return null;
  const subs = (m[2] || "").split(/\s*,\s*/).map((x) => x.trim().toLowerCase()).filter(Boolean);
  return {
    type, size: m[3] || null,
    tags: subs.filter((x) => !COLETIVOS[x]).join(", "),
    roles: subs.map((x) => COLETIVOS[x]).filter(Boolean),
  };
}
const limparTags = (tags) => String(tags || "").split(/\s*,\s*/).map((x) => x.trim().toLowerCase()).filter((x) => x.length > 1 && x !== "???").join(", ");


function ficha(a) {
  const img = a.imagem || a.img || "";
  return {
    img: /^https?:\/\//.test(img) ? img : "",
    iniciativa: texto(a.iniciativa), percepcao: texto(a.percepcao), percepcaoObs: texto(a.percepcaoObs),
    defesa: texto(a.defesa), defesaObs: texto(a.defesaObs), fort: texto(a.fort), ref: texto(a.ref), von: texto(a.von),
    pv: texto(a.pv), pm: texto(a.pm), desl: texto(a.desl),
    atributos: a.atributos || {},
    ataques: (a.ataques || []).map((x) => ({ nome: texto(x.nome), tipo: texto(x.tipo), bonus: texto(x.bonus), dano: texto(x.dano), desc: texto(x.desc) })),
    habilidades: [...(a.habilidades || []), ...(a.habilities || [])].map((h) => typeof h === "string"
      ? { nome: "", tipo: "", custo: "", desc: texto(h) }
      : { nome: texto(h.nome), tipo: texto(h.tipo), custo: texto(h.custo), desc: texto(h.desc) }),
    pericias: texto(lista(a.pericias)),
    equipamento: texto([lista(a.equipamento), a.equipamentoObs].filter(Boolean).join(" ")),
    tesouro: texto(a.tesouro), observacao: texto(a.observacao), fonte: a.fonte || "",
  };
}

const porNome = new Map(monsters.map((m) => [norm(m.name), m]));
let casados = 0, novos = 0, pulados = [], naoParseados = [];
for (const a of db) {
  if (!a.nome) continue;
  const m = porNome.get(norm(a.nome));
  const tipoStr = String(a.tipo || "").trim();
  const t = parseTipo(tipoStr);
  if (!t) naoParseados.push(`${a.nome}: "${tipoStr}"`);
  // habilidade "Enxame"/"Bando" é a mecânica de verdade (Nuvem de Estirges, Horda Goblin não trazem o subtipo)
  for (const h of [...(a.habilidades || []), ...(a.habilities || [])]) { const r = COLETIVOS[norm(h?.nome)]; if (r && t && !t.roles.includes(r)) t.roles.push(r); }
  if (m) {
    m.ficha = ficha(a); casados++;
    if (t) { m.type = t.type; m.tags = t.tags; if (t.size) m.size = t.size; }
    else m.tags = limparTags(m.tags);
    m.role = [...new Set([...(m.role || []).filter((r) => !COLETIVOS[r.toLowerCase()]), ...(t?.roles || [])])];
    continue;
  }
  const tipo = t?.type || "Monstro";
  const ndStr = String(a.nd ?? "").trim();
  const nd = /^\d+$/.test(ndStr) ? Number(ndStr) : ndStr;
  if (typeof nd !== "number" && !["S", "S+", "1/4", "1/2"].includes(nd)) { pulados.push(`${a.nome} (ND ${ndStr || "?"})`); continue; }
  const novo = {
    name: a.nome, nd, type: tipo, tags: t ? t.tags : limparTags((tipoStr.match(/\(([^)]+)\)/) || [])[1]),
    size: t?.size || TAMANHOS.find((x) => tipoStr.endsWith(x)) || "Médio",
    role: t?.roles || [], // solo/lacaio/especial é ícone no livro e não vem do arsenal; a estratégia cai no "qualquer papel"
    init: numero(a.iniciativa), defense: numero(a.defesa), resistances: texto(a.defesaObs), hp: numero(a.pv),
    sources: a.fonte || "Ameaças de Arton", ficha: ficha(a),
  };
  monsters.push(novo);
  porNome.set(norm(a.nome), novo);
  novos++;
}
for (const m of monsters) if (!m.ficha) m.tags = limparTags(m.tags); // sem arsenal: só tira lixo
fs.writeFileSync(out, JSON.stringify(monsters, null, 1) + "\n");
console.log(`ficha completa em ${casados} monstros, ${novos} novos, total ${monsters.length}` + (pulados.length ? `\npulados (ND inválido): ${pulados.join("; ")}` : ""));
