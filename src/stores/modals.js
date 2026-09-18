import { acceptHMRUpdate, defineStore } from "pinia";

export const useModals = defineStore("modals", {
  state: () => {
    return {
      importer: false,
      encounter: false,
      strategy: false,
      sources: false,
      party: false,
      keyboard: false,
      doacao: false,
      ficha: false,
      sheet: null, // monstro cuja ficha completa está aberta
    };
  },
  actions: {
    show(modalName) {
      this[modalName] = true;
    },
    showSheet(monster) {
      this.sheet = monster;
      this.ficha = true;
    },
    hide(modalName) {
      this[modalName] = false;
    },
    toggle(modalName) {
      this[modalName] = !this[modalName];
    },
    closeAll() {
      ["importer", "encounter", "sources", "strategy", "party", "keyboard", "doacao", "ficha"].forEach(
        (modal) => {
          this.hide(modal);
        });
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useModals, import.meta.hot));
}
