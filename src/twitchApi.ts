import {ScriptModules} from "@crowbartools/firebot-custom-scripts-types";
import {ApiClient, HelixUser} from "@twurple/api";

let modules: ScriptModules

let apiClient: ApiClient;

export function setupTwitchApi(scriptModules: ScriptModules): void {
    modules = scriptModules;

    // @ts-ignore 😠
    apiClient = modules.twitchApi._streamerClient;

    // @ts-ignore 😠
    modules.frontendCommunicator.onAsync("user-sfx:get-twitch-username", (id: string) => getRealUsernameForId(id));
}

async function getRealUsernameForId(id: string): Promise<string> {
    try {
        let result = await apiClient.users.getUserById(id);
        return result.name;
    } catch (err) {
        modules.logger.error("Error while trying to get username:", err);
    }
    return null;
}

export async function getTwitchUsers(ids: string[]): Promise<HelixUser[]> {
    let results: HelixUser[] = [];
    do {
        results = results.concat(await apiClient.users.getUsersByIds(ids.splice(0, 100)));
    } while (ids.length > 0);
    return results;
}
