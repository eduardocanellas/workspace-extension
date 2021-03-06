import { browser } from "webextension-polyfill-ts";
import Close from "../shared/Close";
import Open from "../shared/Open";
import { NEW_TAB_URL, Tab } from "./Tab";

export interface Window extends Open, Close {
  // List of tabs in the order they appear in the window
  tabs: Array<Tab>;
  id: number | undefined;

  findTab(id: number): Tab | undefined;
  // Adds the given Tab to Window.
  addTab(tab: Tab): void;
  // Removes the tab. Returns true if the tab was removed,
  // false if the tab wasn't found.
  removeTab(id: number): boolean;
}

export class WindowImpl implements Window {
  tabs: Array<Tab> = [];
  id: number | undefined;

  findTab(id: number): Tab | undefined {
    return this.tabs.find((tab) => tab.id === id);
  }

  addTab(tab: Tab): void {
    this.tabs.push(tab);
  }

  removeTab(id: number): boolean {
    const index = this.tabs.findIndex((tab) => tab.id === id);
    if (index === -1) return false;
    this.tabs.splice(index, 1);
    return true;
  }

  async open(): Promise<void> {
    let window = await browser.windows.create();
    this.id = window.id;
    this.tabs = this.tabs.filter((tab) => !tab.url.startsWith(NEW_TAB_URL));
    let promises = this.tabs.map(async (tab) => {
      let newTab = await browser.tabs.create({
        url: tab.url,
        windowId: this.id,
      });

      tab.id = newTab.id;
      return newTab;
    });

    await Promise.all(promises);
  }

  async close(): Promise<void> {
    if (this.id) {
      await browser.windows.remove(this.id);
    }
  }
}
