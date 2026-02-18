import * as Playroom from 'playroom';
import { CONFIG } from './config.js';

export class MultiplayerManager {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.players = new Map();
    }

    async init() {
        console.log("MultiplayerManager: Calling insertCoin...");
        // Start Playroom
        await Playroom.insertCoin({
            gameId: "game-dream-br",
            maxPlayersPerRoom: 8,
            skipLobby: false
        });

        Playroom.onPlayerJoin((state) => {
            console.log("Player joined:", state.id);
            const id = state.id;
            const playerInfo = state.getProfile();

            // Initial state for new players
            if (Playroom.isHost()) {
                state.setState('hp', CONFIG.PLAYER.HP);
                state.setState('armor', 0);
                state.setState('pos', {
                    x: Math.random() * CONFIG.MAP_SIZE,
                    y: Math.random() * CONFIG.MAP_SIZE
                });
            }

            this.players.set(id, state);
            if (this.callbacks.onJoin) this.callbacks.onJoin(state);

            state.onQuit(() => {
                this.players.delete(id);
                if (this.callbacks.onQuit) this.callbacks.onQuit(id);
            });
        });
    }

    updateMyState(pos, rotation) {
        const me = Playroom.myPlayer();
        if (me) {
            me.setState('pos', pos);
            me.setState('rotation', rotation);
        }
    }

    getMyPlayer() {
        return Playroom.myPlayer();
    }
}
