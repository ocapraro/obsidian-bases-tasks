import BasesTasks from "main";
import { normalizePath } from "obsidian";

export class Logger {
  plugin:BasesTasks;
  queue:(()=>Promise<void>)[] = [];

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
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const filteredOld = old.split("\n").filter(l=>l.length<1||(new Date(l.slice(1,l.indexOf("]"))) > oneDayAgo)).join("\n");
      await adapter.write(path, filteredOld + line);
    } else {
      await adapter.write(path, line);
    }
  }

  private async execute(promise:()=>Promise<void>){
    this.queue.push(promise);
    if(this.queue.length > 1)
      return;
    while (this.queue.length) {
      const currentPromise = this.queue[0];
      void await currentPromise?.();
      this.queue.shift();
    }
  }

  log(message:string){
    void this.execute(()=>this.addToLog(`LOG: ${message}`));
  }

  error(message:string){
    void this.execute(()=>this.addToLog(`ERROR: ${message}`));
  }
}