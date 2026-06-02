import * as helpers from "./helpers.js";
import { useSources } from "../stores/sources";
import { useMonsters } from "../stores/monsters.js";

function parseNDNumeric(nd) {
  if (typeof nd === "number") return nd;
  if (nd === "S+") return 21;
  if (nd === "S") return 20.5;
  if (nd === "1/4") return 0.25;
  if (nd === "1/2") return 0.5;
  return parseFloat(nd) || 0;
}

export default class MonsterT20 {
  constructor(attributes) {
    this.attributes = attributes;

    const ndNumeric = parseNDNumeric(attributes.nd);
    this.cr = {
      numeric: ndNumeric,
      string: attributes.nd?.toString() ?? "0",
    };

    this.name = attributes.name;
    this.type = attributes.type;
    this.size = attributes.size;
    this.hp = attributes.hp;
    this.defense = attributes.defense;
    this.resistances = attributes.resistances ?? "";
    this.init = attributes.init ?? 0;
    this.role = Array.isArray(attributes.role) ? attributes.role : [];
    this.section = attributes.section ?? "";

    this.slug = helpers.slugify(
      attributes.name + "-" + attributes.sources + "-nd" + this.cr.string
    );

    this.tags = attributes.tags
      ? attributes.tags.split(/\s*,\s*/).filter(Boolean)
      : [];

    this.experience = Math.round(Math.min(ndNumeric, 20) * 1000);
    this.environment = [];
    this.alignment = { string: "", bits: 0 };
    this.lair = false;
    this.legendary = this.role.includes("Especial");
    this.unique = this.role.includes("Solo");
    this.special = this.role.includes("Especial");

    this.searchable = [
      attributes.name,
      attributes.type,
      attributes.size,
      this.cr.string,
    ]
      .concat(this.tags)
      .concat(this.role)
      .join("|")
      .toLowerCase();

    const sources = useSources();
    this.sources = attributes.sources.split(", ").map((str) => {
      let book = str;
      let location = "";
      let hasPageNumber = false;

      if (str.includes(": ")) {
        const colonIndex = str.lastIndexOf(": ");
        const afterColon = str.slice(colonIndex + 2);
        hasPageNumber = !isNaN(afterColon);
        if (hasPageNumber) {
          book = str.slice(0, colonIndex);
          location = afterColon;
        }
      }

      const reference = sources.find(book) ?? { name: book, shortname: book, enabled: true };
      return {
        actual_source: reference,
        reference,
        fullText: reference.name + (hasPageNumber ? " p." + location : ""),
      };
    });

    this.sources.sort((a, b) =>
      a.fullText.localeCompare(b.fullText, "pt", { sensitivity: "base" })
    );
  }

  static make(attributes) {
    const ndStr = attributes.nd?.toString() ?? "0";
    const slug = helpers.slugify(
      attributes.name + "-" + attributes.sources + "-nd" + ndStr
    );
    if (useMonsters().lookup[slug]) return useMonsters().lookup[slug];
    return new MonsterT20(attributes);
  }

  copy() {
    return new MonsterT20(this.attributes);
  }

  get sourceEnabled() {
    return this.sources.find((source) => source.actual_source.enabled);
  }

  get isUnique() {
    return this.role.includes("Solo");
  }

  get sizeOrder() {
    const order = { "Minúsculo": 0, "Pequeno": 1, "Médio": 2, "Grande": 3, "Enorme": 4, "Colossal": 5 };
    return order[this.size] ?? 2;
  }

  get isMinion() {
    return this.role.includes("Lacaio");
  }

  get isSolo() {
    return this.role.includes("Solo");
  }

  get isEnxame() {
    return this.role.includes("Enxame");
  }

  get isBando() {
    return this.role.includes("Bando");
  }

  get isLeader() {
    return this.role.includes("Especial");
  }

  filter(key, filters) {
    if (Array.isArray(this[key])) return this.filterArray(key, filters);
    const val = (this[key] ?? "").toString().toLowerCase();
    const positiveFilters = filters.filter((f) => !f.startsWith("not-"));
    const negativeFilters = filters.filter((f) => f.startsWith("not-"));
    let result = positiveFilters.length ? positiveFilters.includes(val) : true;
    if (negativeFilters.length) {
      result = result && !negativeFilters.map((f) => f.split("-")[1]).includes(val);
    }
    return result;
  }

  filterArray(key, filters) {
    const arr = this[key] ?? [];
    const positiveFilters = filters.filter((f) => !f.startsWith("not-"));
    const negativeFilters = filters.filter((f) => f.startsWith("not-"));
    let result = positiveFilters.length
      ? positiveFilters.find((f) => arr.map((v) => v.toLowerCase()).includes(f.toLowerCase()))
      : true;
    if (negativeFilters.length) {
      return (
        result &&
        !negativeFilters
          .map((f) => f.split("-")[1])
          .find((f) => arr.map((v) => v.toLowerCase()).includes(f.toLowerCase()))
      );
    }
    return result;
  }
}
