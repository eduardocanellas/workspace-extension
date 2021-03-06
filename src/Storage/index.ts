import { browser } from "webextension-polyfill-ts";
import { Workspace, WorkspaceImpl } from "../Workspace";
import { WindowImpl } from "../Workspace/Window";
import { TabImpl } from "../Workspace/Window/Tab";
import { WorkspaceManager, WorkspaceManagerImpl } from "../WorkspaceManager";

export default interface Storage {
  save(ws: WorkspaceManager): void;
  load(): Promise<WorkspaceManager | undefined>;
}

export class StorageImpl implements Storage {
  storage_key: string = "workspace-extension";

  async save(manager: WorkspaceManager): Promise<void> {
    console.debug("[STORAGE] Manager before being stored:", manager);
    let activeWorkspace = manager
      .workspaces()
      .findIndex((workspace) => workspace.name === manager.active().name);

    if (activeWorkspace === -1) {
      throw new Error("Active workspace must be present.");
    }

    let data: ManagerData = {
      activeWorkspace: activeWorkspace,
      workspaces: manager.workspaces().map(to_storage_data),
    };

    await browser.storage.sync.set({ [this.storage_key]: data });
    console.debug("[STORAGE] Workspace information stored: ", data);
  }

  async load(): Promise<WorkspaceManager | undefined> {
    let result = await browser.storage.sync.get(this.storage_key);
    const manager_data: ManagerData | undefined = result[this.storage_key];
    console.debug("[STORAGE] Data from storage:", manager_data);

    let manager = undefined;
    if (manager_data) {
      manager = from_storage_data(manager_data);
    }
    return manager;
  }
}

type ManagerData = {
  activeWorkspace: number;
  workspaces: WorkspaceData[];
};

type WorkspaceData = { name: string; windows: WindowData[] };

type WindowData = { id: number | undefined; tabs: TabData[] };

type TabData = { id: number | undefined; url: string };

function to_storage_data(ws: Workspace): WorkspaceData {
  return {
    name: ws.name,
    windows: ws.windows.map((window) => ({
      id: window.id,
      tabs: window.tabs.map((tab) => ({ id: tab.id, url: tab.url })),
    })),
  };
}

function from_storage_data(data: ManagerData): WorkspaceManager {
  let workspaces = data.workspaces.map((workspace_data) => {
    let workspace = new WorkspaceImpl(workspace_data.name);

    workspace.windows = workspace_data.windows.map((window_data) => {
      let window = new WindowImpl();
      window.id = window_data.id;
      window.tabs = window_data.tabs.map((tab_data) => {
        return new TabImpl(tab_data.url, tab_data.id);
      });

      return window;
    });

    return workspace;
  });

  let active = workspaces[data.activeWorkspace];
  return new WorkspaceManagerImpl(workspaces, active);
}
