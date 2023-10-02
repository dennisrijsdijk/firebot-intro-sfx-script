import {Effects} from "@crowbartools/firebot-custom-scripts-types/types/effects";
import {sfxManager} from "./userSfxManager";
import EffectType = Effects.EffectType;

const effect: EffectType<null> = {
    definition: {
        id: "dennisontheinternet:sfx:reset-sfx",
        name: "Reset User SFX Cooldown",
        description: "Reset Cooldown for User Sound Effects",
        icon: "fad fa-waveform",
        // @ts-ignore
        categories: ["twitch"]
    },
    optionsTemplate: "",
    optionsController: () => null,
    // @ts-ignore
    optionsValidator: () => [],
    onTriggerEvent: async (scope) => sfxManager.reset()
}

export default effect;
