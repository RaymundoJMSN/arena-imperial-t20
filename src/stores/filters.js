import { acceptHMRUpdate, defineStore } from "pinia";
import { useMonsters } from "./monsters";
import * as helpers from "../js/helpers.js";
import CONST from "../js/constants.js";

export const useFilters = defineStore("filters", {
  state: () => {
    return {
      defaults: {
        search: "",
        size: [],
        role: [],
        type: [],
        cr: {
          min: 0,
          max: 23,
        },
      },
      size: helpers.migrateLocalStorage("filtersSize", "size", []),
      sizeOptions: [
        { value: "Minúsculo", label: "Minúsculo" },
        { value: "Pequeno",   label: "Pequeno" },
        { value: "Médio",     label: "Médio" },
        { value: "Grande",    label: "Grande" },
        { value: "Enorme",    label: "Enorme" },
        { value: "Colossal",  label: "Colossal" },
        { value: "not-Minúsculo", label: "Não Minúsculo" },
        { value: "not-Pequeno",   label: "Não Pequeno" },
        { value: "not-Médio",     label: "Não Médio" },
        { value: "not-Grande",    label: "Não Grande" },
        { value: "not-Enorme",    label: "Não Enorme" },
        { value: "not-Colossal",  label: "Não Colossal" },
      ],
      role: helpers.migrateLocalStorage("filtersRole", "role", []),
      roleOptions: [
        { value: "Solo",     label: "Solo" },
        { value: "Lacaio",   label: "Lacaio" },
        { value: "Especial", label: "Especial" },
        { value: "Enxame",   label: "Enxame" },
        { value: "Bando",    label: "Bando" },
      ],
      type: helpers.migrateLocalStorage("filtersType", "type", []),
      typeOptions: [
        { value: "Animal",     label: "Animal" },
        { value: "Construto",  label: "Construto" },
        { value: "Espírito",   label: "Espírito" },
        { value: "Humanoide",  label: "Humanoide" },
        { value: "Monstro",    label: "Monstro" },
        { value: "Morto-Vivo", label: "Morto-Vivo" },
        { value: "not-Animal",     label: "Não Animal" },
        { value: "not-Construto",  label: "Não Construto" },
        { value: "not-Espírito",   label: "Não Espírito" },
        { value: "not-Humanoide",  label: "Não Humanoide" },
        { value: "not-Monstro",    label: "Não Monstro" },
        { value: "not-Morto-Vivo", label: "Não Morto-Vivo" },
      ],
      cr: helpers.migrateLocalStorage("filtersCr", "cr", {
        min: 0,
        max: 23,
      }),
      crValues: [
        { value: "1/4", label: "1/4" },
        { value: "1/2", label: "1/2" },
        { value: "1",  label: "1" },
        { value: "2",  label: "2" },
        { value: "3",  label: "3" },
        { value: "4",  label: "4" },
        { value: "5",  label: "5" },
        { value: "6",  label: "6" },
        { value: "7",  label: "7" },
        { value: "8",  label: "8" },
        { value: "9",  label: "9" },
        { value: "10", label: "10" },
        { value: "11", label: "11" },
        { value: "12", label: "12" },
        { value: "13", label: "13" },
        { value: "14", label: "14" },
        { value: "15", label: "15" },
        { value: "16", label: "16" },
        { value: "17", label: "17" },
        { value: "18", label: "18" },
        { value: "19", label: "19" },
        { value: "20", label: "20" },
        { value: "S",  label: "S" },
        { value: "S+", label: "S+" },
      ],

      search: helpers.migrateLocalStorage("filtersSearch", "search", ""),
      regexedSearch: "",
      regex: null,
      isValidRegex: false,

      perPage: helpers.migrateLocalStorage(
        "filtersMonstersPerPage",
        "monstersPerPage",
        10
      ),
    };
  },
  actions: {
    searchFor(searchable) {
      return this.isRegex
        ? searchable.match(this.regex)
        : searchable.includes(this.search.toLowerCase());
    },
    reset() {
      return Object.entries(this.defaults).forEach(
        ([field, value]) => (this[field] = JSON.parse(JSON.stringify(value)))
      );
    },
    isDefault(field) {
      return (
        JSON.stringify(this[field]) === JSON.stringify(this.defaults[field])
      );
    },
    overriddenCopy(overrides = {}) {
      return this.getNonDefault({
        ...helpers.clone({
          search: this.search,
          size: this.size,
          role: this.role,
          type: this.type,
          minCr: this.minCr,
          maxCr: this.maxCr,
        }),
        ...overrides,
      });
    },
    getNonDefault(state = this) {
      return ["search", "size", "role", "type", "cr"]
        .filter(
          (field) =>
            JSON.stringify(state[field]) !==
            JSON.stringify(this.defaults[field])
        )
        .map((filterName) => this.filterFunctions(state)[filterName]);
    },
  },
  getters: {
    filterFunctions() {
      return (state = this) => {
        return {
          search: (monster) => this.searchFor(monster.searchable),
          size: (monster) => monster.filter("size", state.size),
          role: (monster) => monster.filter("role", state.role),
          type: (monster) => monster.filter("type", state.type),
          cr: (monster) =>
            monster.cr.numeric >= state.minCr &&
            monster.cr.numeric <= state.maxCr,
        };
      };
    },
    active() {
      return this.getNonDefault();
    },
    searchPlaceholder() {
      let monsters = useMonsters();

      return monsters.all.length
        ? monsters.all[Math.floor(Math.random() * monsters.all.length)].name
        : "Search for a monster";
    },
    isRegex() {
      if (!this.search) {
        // Wait ... How'd you get here??
        this.regexedSearch = "";
        this.regex = null;
        this.isValidRegex = false;
        return false;
      }

      // We already know the answer for this search term
      if (this.search === this.regexedSearch) {
        return this.isValidRegex;
      }

      this.regexedSearch = this.search;

      // Want to determine whether something is a valid regex?
      // Try to make a regex out of it and listen for yelling.
      let checkRegex = this.search.match(/^\/(.*?)\/?$/);
      if (checkRegex) {
        try {
          this.regex = new RegExp(checkRegex[1], "i");
          this.isValidRegex = true;

          return true;
        } catch (e) {
          this.regex = null;
          this.isValidRegex = false;
          return false;
        }
      }

      // If we got this far ... it wasn't regex.
      this.regex = null;
      this.isValidRegex = false;
      return false;
    },
    ndNumeric() {
      return (val) => {
        if (val === "S+") return 21;
        if (val === "S")  return 20.5;
        return CONST.CR[val]?.numeric ?? parseFloat(val) ?? 0;
      };
    },
    minCr() {
      return this.ndNumeric(this.crValues[this.cr.min]?.value ?? "1");
    },
    maxCr() {
      return this.ndNumeric(this.crValues[this.cr.max]?.value ?? "S+");
    },
    activeCount() {
      return this.getNonDefault().length;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFilters, import.meta.hot));
}
