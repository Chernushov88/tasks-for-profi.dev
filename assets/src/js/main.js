class SimpleTabs extends HTMLElement {
  connectedCallback() {
    this.tabs = this.querySelectorAll("[data-tab]");
    this.contents = this.querySelectorAll("[data-content]");

    this.tabs.forEach((tab) => {
      tab.addEventListener("click", () => this.switchTab(tab));
    });
  }

  switchTab(activeTab) {
    const id = activeTab.dataset.tab;

    // tabs
    this.tabs.forEach((tab) => tab.classList.remove("is-active"));
    activeTab.classList.add("is-active");

    // content
    this.contents.forEach((c) => c.classList.remove("is-active"));
    this.querySelector(`[data-content="${id}"]`)?.classList.add("is-active");
  }
}

customElements.define("simple-tabs", SimpleTabs);
