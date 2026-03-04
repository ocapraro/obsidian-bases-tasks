import BasesTasks from "main";
import { normalizePath, TFile } from "obsidian";

export class Logger {
  plugin:BasesTasks;

  constructor(plugin:BasesTasks) {
    this.plugin = plugin;
  }

  private async addToLog(message: string) {
    const adapter = this.plugin.app.vault.adapter;

    const path = normalizePath(
      `${this.plugin.app.vault.configDir}/plugins/${this.plugin.manifest.id}/log.txt`
    );

    const line = `[${new Date().toISOString()}] ${message}\n`;
    
    if (await adapter.exists(path)) {
      const old = await adapter.read(path);
      await adapter.write(path, old + line);
    } else {
      await adapter.write(path, line);
    }
  }

  log(message:string){
    this.addToLog(`LOG: ${message}`);
  }

  error(message:string){
    this.addToLog(`ERROR: ${message}`);
  }
}