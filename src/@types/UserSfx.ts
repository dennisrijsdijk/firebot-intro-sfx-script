export interface UserSfxGlobalSettings {
    audio: UserSfxAudioSettings;
    users: Record<string, UserSfx>;
}

export interface UserSfxAudioSettings {
    deviceLabel: string;
    deviceId: string;
    overlayInstance: string;
}

export interface UserSfx {
    path: string;
    volume: number;
    lastRedemption: number;
}

export interface TwitchUserSfx extends UserSfx {
    name: string;
    icon: string;
}
