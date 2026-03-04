import BasesTasks from "main";
import { normalizePath, TFile } from "obsidian";

export class Logger {
  plugin:BasesTasks;

  constructor(plugin:BasesTasks) {
    this.plugin = plugin;
  }

  private async addToLog(message: string) {
    const path = normalizePath(
      `${this.plugin.app.vault.configDir}/plugins/${this.plugin.manifest.id}/log.txt`
    );

    const line = `[${new Date().toISOString()}] ${message}\n`;
    const file = this.plugin.app.vault.getAbstractFileByPath(path);


    
    if (file instanceof TFile) {
      const old = await this.plugin.app.vault.read(file);
      await this.plugin.app.vault.modify(file, old + line);
    } else {
      await this.plugin.app.vault.create(path, line);
    }
  }

  log(message:string){
    this.addToLog(`LOG: ${message}`);
  }

  error(message:string){
    this.addToLog(`ERROR: ${message}`);
  }
}