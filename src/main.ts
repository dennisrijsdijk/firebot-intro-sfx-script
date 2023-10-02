import {Firebot, ScriptModules} from "@crowbartools/firebot-custom-scripts-types";
import { autoload } from "./autoload";
import { EventSource } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-manager";
import path from "path";
import {createSfxManager, sfxManager} from "./userSfxManager";
import {setupTwitchApi} from "./twitchApi";
import {FirebotSettings} from "@crowbartools/firebot-custom-scripts-types/types/settings";

interface Params {

}

const script: Firebot.CustomScript<Params> = {
  getScriptManifest: () => {
    return {
      name: "Intro SFX",
      description: "Intro SFX Script for Firebot",
      author: "DennisOnTheInternet",
      version: "1.0",
      firebotVersion: "5",
    };
  },
  getDefaultParameters: () => {
    return {

    };
  },
  run: async (runRequest) => {
    const { logger } = runRequest.modules;
    const eventSource: EventSource = {
      id: "user-sfx",
      name: "Example",
      events: []
    };
    autoload(runRequest.modules, eventSource);
    modules = runRequest.modules;
    settings = runRequest.firebot.settings;
    try {
      createSfxManager(modules.path.join(SCRIPTS_DIR, '..', 'db', 'userSfx.db'), modules);
    } catch (error) {
      debugger;
    }
    setupTwitchApi(modules);
    console.log(JSON.stringify(await sfxManager.getAllTwitchUsers(), null, 4));
  },
};

export let modules: ScriptModules;

export let settings: FirebotSettings;

export default script;
