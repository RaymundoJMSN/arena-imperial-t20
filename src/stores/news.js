import { acceptHMRUpdate, defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core/index";

export const useNews = defineStore("news", {
  state: () => {
    return {
      open: false,
      latest: useLocalStorage("latestNewsSeen", 0),
      articles: [],
    };
  },
  actions: {
    show() {
      this.open = true;
      this.latest = this.articles.length;
    },
    hide() {
      this.open = false;
    },
    async fetch() {
      // Fetch the latest news from /articles.json, and compare the ID to the latest seen
      // If the latest news is newer than the latest seen, return true

      this.articles = await fetch("/articles.json")
        .then((response) => {
          return response.json();
        }).then((json) => {
          return json.articles;
        });
    },
  },
  getters: {
    hasUnread() {
      return (this.articles.length > this.latest);
    }
  }
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNews, import.meta.hot));
}
