import { useNotifications } from "../stores/notifications.js";
import { useMonsters } from "../stores/monsters.js";
import CONST from "./constants.js";
import { useFilters } from "../stores/filters.js";
import * as helpers from "./helpers.js";
import { useParty } from "../stores/party.js";
import { useEncounter } from "../stores/encounter.js";

class EncounterStrategy {

  static insaneDifficultyStrings = [
    "uma péssima ideia",
    "suicídio tático",
    "o Narrador está de mau humor",
    "fim de campanha",
    "alguém esqueceu o lanche",
    "pedras caem, todos morrem",
    "o BBEG escreveu esse encontro",
    "vingança do Narrador",
    "o grupo provocou o deus errado",
    "a Tormenta está com raiva hoje",
  ];

  static encounterExpPerCharacter = {};
  static difficulties = [];
  static difficultyClassColors = {};

  static getTotalExp() {
    return useEncounter().monsterGroups.reduce((acc, group) => {
      return acc + group.monster.experience * group.count;
    }, 0);
  }

  static getBudget() {
    return {};
  }

  static getEncounterTemplate(encounterType) {
    let template = helpers.clone(CONST.ENCOUNTER_TYPES[encounterType]);
    template = helpers.randomArrayElement(template.samples);

    const players = Number(useParty().totalPlayers);
    template.groups = template.groups.map((group) => {
      if (typeof group.count === "string") {
        const parts = group.count.split("-").map((part) => {
          part = part.replaceAll("players", players);
          return eval(part);
        });
        group.count =
          parts.length > 1 ? helpers.randomIntBetween(...parts) : parts[0];
      }
      return group;
    });

    template.total = template.groups.reduce(
      (acc, group) => acc + group.count,
      0
    );

    return template;
  }

  static monsterFilter(monster, groupTemplate, encounter) {
    return (
      !encounter.some((group) => group.monster.slug === monster.slug) &&
      !(groupTemplate.count > 1 && monster.isUnique)
    );
  }

  static pickRandomMonster(monsterList) {
    return helpers.randomArrayElement(monsterList);
  }

  static getMonstersFromCR(
    monsterCRIndex,
    encounter,
    groupTemplate,
    encounterType,
    additionalFilters = () => true
  ) {
    const monsterTargetCR = CONST.CR[CONST.CR.LIST[monsterCRIndex]];
    const monsters = useMonsters();

    let monsterList = monsters.filterBy(
      useFilters().overriddenCopy({
        minCr: monsterTargetCR.numeric,
        maxCr: monsterTargetCR.numeric,
      }),
      (monster) =>
        this.monsterFilter(monster, groupTemplate, encounter, encounterType) &&
        additionalFilters(monster)
    );

    let monsterCRNewIndex = monsterCRIndex;
    let down = true;
    while (!monsterList.length) {
      if (down) {
        monsterCRNewIndex--;
        if (monsterCRNewIndex < 0) {
          monsterCRNewIndex = monsterCRIndex;
          down = false;
        }
      } else {
        monsterCRNewIndex++;
        if (monsterCRNewIndex === CONST.CR.LIST.length - 1) {
          return false;
        }
      }

      const monsterTargetCRNew = CONST.CR[CONST.CR.LIST[monsterCRNewIndex]];
      monsterList = monsters.filterBy(
        useFilters().overriddenCopy({
          minCr: monsterTargetCRNew.numeric,
          maxCr: monsterTargetCRNew.numeric,
        }),
        (monster) =>
          this.monsterFilter(monster, groupTemplate, encounter, encounterType) &&
          additionalFilters(monster)
      );
    }

    return this.pickRandomMonster(monsterList, groupTemplate, encounterType);
  }

  static getNewMonster(monsterGroup, encounter) {
    const monsterList = useMonsters().filterBy(
      useFilters().overriddenCopy({
        maxCr: monsterGroup.monster.cr.numeric,
        minCr: monsterGroup.monster.cr.numeric,
      }),
      (monster) => {
        return !encounter.some((group) => group.monster.slug === monster.slug);
      }
    );
    if (!monsterList.length) return;
    return helpers.randomArrayElement(monsterList);
  }

  static getDifficultyFromCr(cr, budget) {
    throw new Error("Not Implemented");
  }

  static getDifficultyClassColorFromCr(cr, budget) {
    const difficulty = this.getDifficultyFromCr(cr, budget);
    return this.difficultyClassColors[difficulty];
  }
}

class Tormenta20 extends EncounterStrategy {
  static key = "t20";
  static label = "Tormenta 20";
  static description =
    "Sistema de encontros para Tormenta 20. Calcula o ND do encontro baseado nas regras do livro básico (grupos de 4 personagens). Ajusta automaticamente para grupos maiores ou menores.";
  static difficulties = [
    { key: "facil", label: "Fácil" },
    { key: "moderado", label: "Moderado" },
    { key: "dificil", label: "Difícil" },
  ];
  static difficultyClassColors = {
    Trivial: "text-indigo-300 dark:text-indigo-600",
    Fácil: "text-green-300 dark:text-green-600",
    Moderado: "text-yellow-300 dark:text-yellow-600",
    Difícil: "text-amber-300 dark:text-orange-600",
    Épico: "text-rose-300 dark:text-rose-600",
  };
  static defaultDifficulty = "moderado";
  static measurementUnit = "ND";
  static tableHeader = "ND Alvo";
  static encounterExpPerCharacter = {};

  // ND do Grupo = soma de todos os níveis de todos os jogadores ÷ 4
  static getGroupND() {
    const party = useParty();
    if (!party.totalPlayers) return 1;
    const totalLevels =
      party.groups.reduce(
        (acc, group) =>
          acc + Math.floor(group.level) * Math.max(1, Math.floor(group.players)),
        0
      ) +
      party.activePlayers.reduce(
        (acc, player) => acc + Math.floor(player.level),
        0
      );
    return Math.max(0.25, totalLevels / 4);
  }

  static calculateGroupND(ndNumeric, count) {
    if (count <= 0) return 0;
    if (ndNumeric < 1) return ndNumeric * count;
    return ndNumeric + 2 * Math.floor(Math.log2(count));
  }

  static calculateEncounterNDFromGroupNDs(groupNDs) {
    if (!groupNDs.length) return 0;
    const sorted = [...groupNDs].sort((a, b) => b - a);
    // T20 rule: ND < 1 creatures use additive sum (nd × count),
    // not the +1/+0.5/+0.25 different-ND formula
    if (sorted[0] < 1) {
      return sorted.reduce((sum, nd) => sum + nd, 0);
    }
    let encounterND = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      const diff = encounterND - sorted[i];
      if (diff <= 1) encounterND += 1;
      else if (diff <= 2) encounterND += 0.5;
      else if (diff <= 3) encounterND += 0.25;
    }
    return Math.floor(encounterND);
  }

  static getEncounterND() {
    const groups = useEncounter().monsterGroups;
    if (!groups.length) return 0;

    const ndMap = {};
    for (const group of groups) {
      // S/S+ count as ND 20 for encounter calculation
      const ndCapped = Math.min(group.monster.cr.numeric, 20);
      const key = ndCapped.toString();
      ndMap[key] = (ndMap[key] || 0) + group.count;
    }

    const groupNDs = Object.entries(ndMap).map(([ndStr, count]) =>
      this.calculateGroupND(parseFloat(ndStr), count)
    );

    return this.calculateEncounterNDFromGroupNDs(groupNDs);
  }

  static getTotalXP() {
    const groupND = this.getGroupND();
    return useEncounter().monsterGroups.reduce((acc, group) => {
      const nd = Math.min(group.monster.cr.numeric, 20);
      if (nd < groupND - 5) return acc;
      return acc + Math.round(nd * 1000) * group.count;
    }, 0);
  }

  static getTotalExp() {
    return this.getEncounterND();
  }

  static getBudget() {
    if (!useParty().totalPlayers) return {};
    const gnd = this.getGroupND();
    return {
      facil:    Math.max(0.25, gnd - 2),
      moderado: Math.max(0.5,  gnd),
      dificil:  Math.max(1,    gnd + 2),
    };
  }

  static getDifficultyFromCr(cr, budget) {
    if (!budget || !Object.keys(budget).length) return "N/A";
    const nd = cr.numeric ?? 0;
    if (!nd) return "Nenhum";
    if (nd < budget.facil - 2) return "Trivial";
    if (nd < budget.moderado) return "Fácil";
    if (nd <= budget.moderado) return "Moderado";
    if (nd <= budget.dificil) return "Difícil";
    return "Épico";
  }

  static getActualDifficulty() {
    const nd = this.getEncounterND();
    const budget = this.getBudget();
    return this.getDifficultyFromCr({ numeric: nd }, budget);
  }

  static getDifficultyFeel() {
    const nd = this.getEncounterND();
    if (!nd) return "";
    const budget = this.getBudget();
    if (!budget.moderado) return "";
    if (nd < budget.facil - 2) return "trivial";
    if (nd < budget.moderado) return "fácil";
    if (nd <= budget.moderado) return "moderado";
    if (nd <= budget.dificil) return "difícil";
    if (nd <= budget.dificil + 2) return "épico";
    return "como " + helpers.randomArrayElement(this.insaneDifficultyStrings);
  }

  static getSecondaryMeasurements() {
    const nd = this.getEncounterND();
    const totalXP = this.getTotalXP();
    const players = useParty().totalPlayersToGainXP;
    const xpPerPlayer = players > 0 ? Math.round(totalXP / players) : 0;

    const result = [];
    if (nd > 0) {
      result.push({ label: "ND do Encontro", rawValue: nd, value: nd.toString() });
    }
    if (totalXP > 0) {
      result.push({
        label: "XP Total",
        rawValue: totalXP,
        value: helpers.formatNumber(totalXP) +
          (players > 0 ? " (" + helpers.formatNumber(xpPerPlayer) + "/personagem)" : ""),
      });
    }
    return result;
  }

  static encounterTypes = {
    aleatorio:     { key: "aleatorio",     name: "Aleatório" },
    solo:          { key: "solo",          name: "Solo" },
    lacaios:       { key: "lacaios",       name: "Horda de Lacaios" },
    lider_lacaios: { key: "lider_lacaios", name: "Líder e Lacaios" },
    bando:         { key: "bando",         name: "Bando" },
    enxame:        { key: "enxame",        name: "Enxame" },
  };

  static defaultEncounterType = "aleatorio";

  static generateEncounter(difficulty, encounterType) {
    useParty().ensureGroup();
    const budget = this.getBudget();
    const targetND = budget[difficulty];
    if (!targetND) return false;

    let type = encounterType;
    if (!type || type === "aleatorio") {
      type = helpers.randomArrayElement(["solo", "lacaios", "lider_lacaios", "bando", "enxame"]);
    }

    switch (type) {
      case "solo":          return this._generateSolo(targetND);
      case "lacaios":       return this._generateLacaios(targetND);
      case "lider_lacaios": return this._generateLiderLacaios(targetND);
      case "bando":         return this._generateBando(targetND);
      case "enxame":        return this._generateEnxame(targetND);
      default:              return this._generateSolo(targetND);
    }
  }

  static _findMonster(targetND, role = null, exclude = []) {
    const monsters = useMonsters();
    const filters = useFilters();
    const roleOk = (m) => !role || m.role.includes(role);
    const notExcluded = (m) => !exclude.some((g) => g.monster.slug === m.slug);

    for (let delta = 0; delta <= 5; delta++) {
      for (const nd of delta === 0 ? [targetND] : [targetND - delta, targetND + delta]) {
        if (nd <= 0) continue;
        const list = monsters.filterBy(
          filters.overriddenCopy({ minCr: nd, maxCr: nd }),
          (m) => notExcluded(m) && roleOk(m)
        );
        if (list.length) return helpers.randomArrayElement(list);
      }
    }
    // fallback: any monster near targetND, no role filter
    if (role) return this._findMonster(targetND, null, exclude);
    return null;
  }

  static _generateSolo(targetND) {
    const monster = this._findMonster(targetND, "Solo") ?? this._findMonster(targetND);
    if (!monster) return this._failNotify();
    return [{ monster, count: 1 }];
  }

  static _generateLacaios(targetND) {
    // Build all valid {count, lacaioND} pairs whose encounter ND ≈ targetND
    const options = [];

    // Option A: fractional lacaioND (< 1) — formula: lacaioND * count = targetND
    for (const fnd of [0.25, 0.5]) {
      const count = targetND / fnd;
      if (Number.isInteger(count) && count >= 2 && count <= 12) {
        options.push({ count, lacaioND: fnd });
      }
    }

    // Option B: integer lacaioND — formula: targetND - 2*floor(log2(count)) >= 1
    if (targetND >= 1) {
      const maxExp = Math.floor((targetND - 1) / 2);
      const maxCount = Math.pow(2, maxExp);
      for (const c of [2, 3, 4, 6, 8]) {
        if (c <= maxCount) {
          options.push({ count: c, lacaioND: targetND - 2 * Math.floor(Math.log2(c)) });
        }
      }
    }

    if (!options.length) {
      // fallback: single monster at targetND
      const m = this._findMonster(targetND, "Lacaio") ?? this._findMonster(targetND);
      if (!m) return this._failNotify();
      return [{ monster: m, count: 1 }];
    }

    const { count, lacaioND } = helpers.randomArrayElement(options);
    const monster = this._findMonster(lacaioND, "Lacaio") ?? this._findMonster(lacaioND);
    if (!monster) return this._failNotify();
    return [{ monster, count }];
  }

  static _generateLiderLacaios(targetND) {
    let leaderND, lacaioND, lacaioCount;

    if (targetND <= 1) {
      // Sub-1 NDs: T20 usa soma aditiva, não faz sentido misturar tiers
      // Redireciona para horda de lacaios de mesmo ND
      return this._generateLacaios(targetND);
    } else if (targetND < 4) {
      // Leader at targetND-1 (min 0.5), 2 lacaios at targetND-2 (min 0.25)
      leaderND = Math.max(0.5, targetND - 1);
      lacaioND = Math.max(0.25, targetND - 2);
      lacaioCount = 2;
    } else {
      leaderND = Math.max(1, targetND - 1);
      lacaioND = Math.max(1, targetND - 3);
      lacaioCount = helpers.randomIntBetween(2, 3);
    }

    const leader = this._findMonster(leaderND, "Especial") ?? this._findMonster(leaderND);
    if (!leader) return this._failNotify();

    const lacaio = this._findMonster(lacaioND, "Lacaio", [{ monster: leader }])
      ?? this._findMonster(lacaioND, null, [{ monster: leader }]);

    const result = [{ monster: leader, count: 1 }];
    if (lacaio) result.push({ monster: lacaio, count: lacaioCount });
    return result;
  }

  static _generateBando(targetND) {
    const monster = this._findMonster(targetND, "Bando") ?? this._findMonster(targetND);
    if (!monster) return this._failNotify();
    return [{ monster, count: 1 }];
  }

  static _generateEnxame(targetND) {
    const monster = this._findMonster(targetND, "Enxame") ?? this._findMonster(targetND);
    if (!monster) return this._failNotify();
    return [{ monster, count: 1 }];
  }

  static _failNotify() {
    useNotifications().notify({
      title: "Falha ao gerar encontro!",
      body: "Ajuste os filtros para ter mais monstros disponíveis.",
      icon: "fa-circle-xmark",
      icon_color: "text-red-400",
      sticky: true,
    });
    return false;
  }
}

export default {
  [Tormenta20.key]: Tormenta20,
};
