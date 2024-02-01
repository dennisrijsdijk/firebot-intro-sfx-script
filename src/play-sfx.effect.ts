import {Effects} from "@crowbartools/firebot-custom-scripts-types/types/effects";
import template from './play-sfx.html'
import {TwitchUserSfx} from "./@types/UserSfx";
import {sfxManager} from "./userSfxManager";
import {modules, settings} from "./main";
import EffectType = Effects.EffectType;

interface EffectModel {
    audioOutputDevice: {
        deviceId: string;
        label: string;
    };
    overlayInstance: string;
    activeUser: string;
}

const effect: EffectType<EffectModel> = {
    definition: {
        id: "dennisontheinternet:sfx:play-sfx",
        name: "Play User SFX",
        description: "play user SFX",
        icon: "fad fa-waveform",
        // @ts-ignore
        categories: ["twitch"]
    },
    optionsTemplate: template,
    optionsController: ($scope, utilityService: any, backendCommunicator: any, $q: any, $timeout: any) => {
        $scope.sliderTranslate = (value: number) => Math.round(value * 10) + '%';

        $scope.volumeUpdated = (id: string, value: number) => {
            backendCommunicator.fireEvent("user-sfx:set-user-volume", {id: id, volume: value});
        }

        $scope.pathUpdated = (id: string, path: string) => {
            backendCommunicator.fireEvent("user-sfx:set-user-path", {id: id, path: path});
        };

        $scope.selectionChanged = (id: string) => {
            if ($scope.activeUser === id) {
                return;
            }
            $scope.activeUser = id;
            $scope.effect.activeUser = id;

            $timeout(function () {
                $scope.$broadcast('rzSliderForceRender');
            }, 30);
        };

        $scope.addUser = () => {
            utilityService.openViewerSearchModal(
                {
                    label: "Add Viewer",
                    saveText: "Add",
                    validationFn: (user: any) => {
                        return new Promise(resolve => {
                            if (user == null) {
                                return resolve(false);
                            }

                            // @ts-ignore
                            if (Object.keys($scope.users).some((id: string) => {
                                return id === user.id;
                            })) {
                                return resolve(false);
                            }
                            resolve(true);
                        });
                    },
                    validationText: "Viewer already has an intro SFX."
                },
                (user: any) => {
                    $q.when(backendCommunicator.fireEventAsync("user-sfx:get-twitch-username", user.id))
                        .then((result: string) => {
                            let username: string;
                            //const username = result ?? user.username;
                            if (user.username.toLowerCase() !== result.toLowerCase()) {
                                username = `${user.username} (${result})`;
                            } else {
                                username = user.username;
                            }
                            // @ts-ignore 😠
                            $scope.users[user.id] = {name: username, icon: user.avatarUrl, volume: 5, path: ""};
                            backendCommunicator.fireEvent("user-sfx:add-user", user.id);
                        });
                    // @ts-ignore 😠
                    $scope.selectionChanged(user.id);
                });
        }

        $scope.deleteUser = (id: string) => {
            backendCommunicator.fireEvent("user-sfx:delete-user", id);
            // @ts-ignore 😠
            delete $scope.users[id];
            if ($scope.activeUser === id) {
                $scope.activeUser = null;
            }
        }

        $scope.activeUser = null;

        $scope.effect.activeUser = null;

        $scope.status = 'fetching';

        if ($scope.effect.audioOutputDevice == null) {
            $scope.effect.audioOutputDevice = {
                deviceId: "overlay",
                label: "Send To Overlay"
            };
            $scope.effect.overlayInstance = null;
        }

        $scope.users = {};

        $q.when(backendCommunicator.fireEventAsync("user-sfx:initial-fetch"))
            .then((result: Record<string, TwitchUserSfx>) => {
                $scope.users = result;
                $scope.status = $scope.users != null ? 'fetched' : 'error';
                $timeout(function () {
                    $scope.$broadcast('rzSliderForceRender');
                }, 30);
            });
    },
    // @ts-ignore
    optionsValidator: (effect) => {
        const errors: string[] = [];
        return errors;
    },
    onTriggerEvent: async (scope) => {
        let userId = '';
        switch (scope.trigger.type) {
            case "command":
                userId = scope.trigger.metadata.chatMessage.userId;
                break;
            case "event":
                if (scope.trigger.metadata.event.id === "chat-message") {
                    // @ts-ignore
                    userId = scope.trigger.metadata.eventData.chatMessage.userId;
                }
                break;
            case "manual":
                if (scope.effect.activeUser == null || scope.effect.activeUser === "") {
                    return;
                }
                userId = scope.effect.activeUser;
                break;
            default:
                modules.logger.error("user-sfx script: got trigger " + scope.trigger.type + ", expected 'command' or 'event'.");
                return false;
        }

        const user = sfxManager.getUser(userId);
        if (user == null) {
            return;
        }

        if (scope.trigger.type !== "manual") {
            if (user.lastRedemption >= sfxManager.getLastReset()) {
                return;
            }

            sfxManager.setUserRedemptionTime(userId);
        }

        const data: {
            filepath: string;
            volume: number;
            audioOutputDevice: EffectModel["audioOutputDevice"];
            overlayInstance: string;
            resourceToken?: string
        } = {
            filepath: user.path,
            volume: user.volume,
            audioOutputDevice: scope.effect.audioOutputDevice,
            overlayInstance: scope.effect.overlayInstance,
        }

        if (data.audioOutputDevice == null || data.audioOutputDevice.label === "App Default") {
            data.audioOutputDevice = settings.getAudioOutputDevice();
            if (data.audioOutputDevice.deviceId == "overlay") {
                data.overlayInstance = null;
            }
        }

        const duration = await modules.frontendCommunicator.fireEventAsync("getSoundDuration", {
            path: "file://" + data.filepath
        });

        // @ts-ignore
        const durationMs = (Math.round(duration) || 0) * 1000;

        // Generate token if going to overlay, otherwise send to gui.
        if (scope.effect.audioOutputDevice.deviceId === "overlay") {
            // @ts-ignore
            data.resourceToken = modules.resourceTokenManager.storeResourcePath(
                data.filepath,
                durationMs
            );
            modules.httpServer.sendToOverlay("sound", data)
            // send event to the overlay
        } else {
            // Send data back to media.js in the gui.
            renderWindow.webContents.send("playsound", data);
        }

        // @ts-ignore
        await modules.utils.wait(durationMs);
    }
}

export default effect;
