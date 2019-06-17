import fs from "fs";
import { promisify } from "util";

interface Contexts {
  [index: string]: Context;
}

interface Context {
  installedAppId: string;
  authToken: string;
  refreshToken: string;
}

export class SingleContextStore {
  private readFile: (path: string) => Promise<Buffer>;
  private writeFile: (file: string, data: string) => Promise<void>;
  private unlinkFile: (path: string) => Promise<void>;

  constructor(private path: string) {
    this.readFile = promisify(fs.readFile);
    this.writeFile = promisify(fs.writeFile);
    this.unlinkFile = promisify(fs.unlink);
  }

  async get(id: string): Promise<Context | undefined> {
    const context = await this.readContext();
    if (context === undefined || context.installedAppId !== id) {
      return undefined;
    }
    return context;
  }

  async put(params: Context): Promise<void> {
    await this.writeContext(params);
  }

  async update(_installedAppId: string, params: Context): Promise<void> {
    await this.writeContext(params);
  }

  async delete(_installedAppId: string): Promise<void> {
    await this.unlinkFile(this.path);
  }

  async readContext(): Promise<Context | undefined> {
    if (!fs.existsSync(this.path)) {
      return undefined;
    }

    const data = await this.readFile(this.path);
    const json = await JSON.parse(data.toString());
    return json;
  }

  private async writeContext(context: Context): Promise<void> {
    await this.writeFile(this.path, JSON.stringify(context));
  }
}

export default class FileContextStore {
  private readFile: (path: string) => Promise<Buffer>;
  private writeFile: (file: string, data: string) => Promise<void>;

  constructor(private path: string) {
    this.readFile = promisify(fs.readFile);
    this.writeFile = promisify(fs.writeFile);
  }

  async get(id: string): Promise<Context> {
    const contexts = await this.readContexts();
    return contexts[id];
  }

  async put(params: Context): Promise<void> {
    const contexts = await this.readContexts();
    contexts[params.installedAppId] = params;
    await this.writeContexts(contexts);
  }

  async update(installedAppId: string, params: Context): Promise<void> {
    const contexts = await this.readContexts();
    contexts[installedAppId].authToken = params.authToken;
    contexts[installedAppId].refreshToken = params.refreshToken;
    await this.writeContexts(contexts);
  }

  async delete(installedAppId: string): Promise<void> {
    const contexts = await this.readContexts();
    delete contexts[installedAppId];
    await this.writeContexts(contexts);
  }

  private async readContexts(): Promise<Contexts> {
    if (!fs.existsSync(this.path)) {
      return {};
    }

    const data = await this.readFile(this.path);
    const json = await JSON.parse(data.toString());
    return json;
  }

  private async writeContexts(contexts: Contexts): Promise<void> {
    await this.writeFile(this.path, JSON.stringify(contexts));
  }
}
