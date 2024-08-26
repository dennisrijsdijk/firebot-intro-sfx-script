import {ScriptModules} from "@crowbartools/firebot-custom-scripts-types";
import {JsonDB} from "node-json-db";
import {TwitchUserSfx, UserSfx, UserSfxAudioSettings, UserSfxGlobalSettings} from "./@types/UserSfx";
import {getTwitchUsers} from "./twitchApi";

class UserSfxManager {
    private _db: JsonDB;
    private _modules: ScriptModules;

    public async getAllTwitchUsers(): Promise<Record<string, TwitchUserSfx>> {
        try {
            const users: Record<string, TwitchUserSfx> = JSON.parse(JSON.stringify(this._db.getData('/users/')));
            if (Object.keys(users).length === 0) {
                return {};
            }
            const twitchUsers = await getTwitchUsers(Object.keys(users));
            twitchUsers.forEach(user => {
                if (user.displayName.toLowerCase() !== user.name.toLowerCase()) {
                    users[user.id].name = `${user.displayName} (${user.name})`;
                } else {
                    users[user.id].name = user.displayName;
                }
                users[user.id].icon = user.profilePictureUrl;
            });
            return users;
        } catch (err) {
            this._modules.logger.error("user-sfx script: error while retrieving Twitch users", err);
            return null;
        }
    }

    public getUser(id: string): UserSfx {
        if (!Object.keys(this._db.getData('/users/')).includes(id)) {
            return null;
        }
        return this._db.getData(`/users/${id}`);
    }

    public addEmptyUser(id: string) {
        this._db.push(`/users/${id}`, {volume: 5, path: "", lastRedemption: 0}, true);
    }

    public deleteUser(id: string) {
        this._db.delete(`/users/${id}`);
    }

    public getUserVolume(id: string): number {
        return this._db.getData(`/users/${id}/volume`);
    }

    public setUserVolume(id: string, volume: number): void {
        this._db.push(`/users/${id}/volume`, volume, true);
    }

    public getUserPath(id: string): number {
        return this._db.getData(`/users/${id}/path`);
    }

    public setUserPath(id: string, path: string): void {
        this._db.push(`/users/${id}/path`, path, true);
    }

    public setUserRedemptionTime(id: string): void {
        this._db.push(`/users/${id}/lastRedemption`, +new Date(), true);
    }

    public getLastReset(): number {
        return this._db.getData("/lastReset");
    }

    public reset(): void {
        this._db.push("/lastReset", +new Date(), true);
    }

    constructor(path: string, modules: ScriptModules) {
        this._modules = modules;
        // @ts-ignore 😠
        // filePath, saveOnPush, humanReadable
        this._db = new modules.JsonDb(path, true, true);

        if (Object.keys(this._db.getObject('/')).length == 0) { // No data
            this._db.push('/', {lastReset: 1, users: {}}, true);
        }
        modules.frontendCommunicator.onAsync("user-sfx:get-twitch-users", _ => this.getAllTwitchUsers());
        modules.frontendCommunicator.on("user-sfx:set-user-volume", args => {
            let user = args as unknown as {id: string, volume: number}
            this.setUserVolume(user.id, user.volume);
        });
        modules.frontendCommunicator.on("user-sfx:set-user-path", args => {
            let user = args as unknown as {id: string, path: string}
            this.setUserPath(user.id, user.path);
        });
        // @ts-ignore
        modules.frontendCommunicator.on("user-sfx:add-user", (id: string) => this.addEmptyUser(id));
        // @ts-ignore
        modules.frontendCommunicator.on("user-sfx:delete-user", (id: string) => this.deleteUser(id));
    }
}

export let sfxManager: UserSfxManager;

export function createSfxManager(path: string, modules: ScriptModules) {
    if (sfxManager != null) {
        return sfxManager;
    }
    sfxManager = new UserSfxManager(path, modules);
    return sfxManager;
}