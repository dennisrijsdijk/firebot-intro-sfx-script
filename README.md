# Firebot User SFX Script

## A Firebot script that simplifies user-specific stream sounds (eg. entry SFX)

### Installation:

Download the `user-sfx.js` file from the latest release and move it to the following directory:

Windows: `%appdata%\Firebot\v5\profiles\PROFILE\scripts`

MacOS: `~/Library/Application Support/Firebot/v5/profiles/PROFILE/scripts`

Linux: `~/.config/Firebot/v5/profiles/PROFILE/scripts`

In Firebot, go to Settings > Scripts. Enable startup scripts, then Add New Startup Script.
pick user-sfx.js and save.

### Usage:

Before proceeding, make sure Firebot is logged into the Streamer Account on Twitch.

Create a command (eg. !hello) and add the "Play User SFX" effect. This is where the user SFX will play, and where you'll add new ones

Create an event (eg. OBS Stream Started) and add the "Reset User SFX Cooldown" effect. The plugin tracks usage of user SFX and allows one per user, until the cooldown is reset.

### Development (building)
Dev:
1. `npm run build:dev`
- Automatically copies the compiled .js to Firebot's scripts folder.

Release:
1. `npm run build`
- Copy .js from `/dist`
