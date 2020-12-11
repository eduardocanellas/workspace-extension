import Close from "../shared/Close";
import Open from "../shared/Open";
import { Tab } from "./Tab";

export interface Window extends Open, Close {
    // List of tabs in the order they appear in the window
    tabs: Array<Tab>;
    id: number | undefined;
    // Adds the given Tab to Window.
    addTab(tab: Tab): void;
    // Removes the tab. Returns true if the tab was removed, 
    // false if the tab wasn't found.
    removeTab(id: number): boolean;
}

export class WindowImpl implements Window {
    tabs: Array<Tab> = [];
    id: number | undefined;

    addTab(tab: Tab): void {
        this.tabs.push(tab);
    }

    removeTab(id: number): boolean {
        const index = this.tabs.findIndex(tab => tab.id === id);
        if (index === -1) return false;
        this.tabs.splice(index, 1);
        return true;
    }

    open(): void {
        chrome.windows.create(window => {
            if (window === undefined) {
                throw new Error("Couldn't create window");
            }

            this.id = window.id;
            for (const tab of this.tabs) {
                chrome.tabs.create({ url: tab.url, windowId: this.id })
            }
        });
    }

    close(): void {
        if (this.id !== undefined) {
            chrome.windows.remove(this.id);
        }
    }
}
