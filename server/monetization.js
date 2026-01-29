/**
 * Monetization Module
 * Handles ad rewards, battle pass, and premium features
 * Philosophy: Ad-free base experience, rewards for optional ad viewing
 */

const storage = require('./storage');

// Reward types for watching ads
const AD_REWARDS = {
    AD_FREE_HOUR: 'ad_free_hour',      // 1 hour ad-free experience
    BONUS_COSMETIC: 'bonus_cosmetic',   // Random cosmetic item
    XP_BOOST: 'xp_boost',               // 2x XP for next game
    THEME_UNLOCK: 'theme_unlock'        // Unlock a board theme temporarily
};

// Battle Pass tiers
const BATTLE_PASS_TIERS = {
    FREE: 'free',           // Default - base experience
    PREMIUM: 'premium',     // $4.99 - Ad-free + exclusive cosmetics
    ULTIMATE: 'ultimate'    // $9.99 - Premium + all current themes
};

// Available cosmetic items
const COSMETICS = {
    avatarFrames: [
        { id: 'frame_gold', name: 'Gold Frame', rarity: 'rare' },
        { id: 'frame_neon', name: 'Neon Frame', rarity: 'uncommon' },
        { id: 'frame_fire', name: 'Fire Frame', rarity: 'epic' },
        { id: 'frame_ice', name: 'Ice Frame', rarity: 'rare' },
        { id: 'frame_galaxy', name: 'Galaxy Frame', rarity: 'legendary' }
    ],
    boardThemes: [
        { id: 'theme_classic', name: 'Classic', rarity: 'common', free: true },
        { id: 'theme_dark', name: 'Dark Mode', rarity: 'common', free: true },
        { id: 'theme_neon', name: 'Neon Glow', rarity: 'uncommon' },
        { id: 'theme_retro', name: 'Retro Arcade', rarity: 'rare' },
        { id: 'theme_nature', name: 'Nature', rarity: 'uncommon' },
        { id: 'theme_space', name: 'Space', rarity: 'epic' },
        { id: 'theme_pixel', name: 'Pixel Art', rarity: 'rare' }
    ],
    playerIcons: [
        { id: 'icon_star', name: 'Star', rarity: 'common', free: true },
        { id: 'icon_crown', name: 'Crown', rarity: 'rare' },
        { id: 'icon_lightning', name: 'Lightning', rarity: 'uncommon' },
        { id: 'icon_diamond', name: 'Diamond', rarity: 'epic' },
        { id: 'icon_flame', name: 'Flame', rarity: 'legendary' }
    ]
};

class Monetization {
    constructor() {
        // Track ad views for rate limiting (prevent abuse)
        this.adViewCooldowns = new Map();
    }

    // Initialize user monetization data
    getDefaultMonetizationData() {
        return {
            battlePass: BATTLE_PASS_TIERS.FREE,
            adFreeUntil: null,  // Timestamp when ad-free period expires
            totalAdsWatched: 0,
            lastAdWatched: null,
            unlockedCosmetics: ['theme_classic', 'theme_dark', 'icon_star'], // Free items
            equippedCosmetics: {
                avatarFrame: null,
                boardTheme: 'theme_classic',
                playerIcon: 'icon_star'
            },
            xpBoostUntil: null,
            lifetimeAdFreeHours: 0 // Track total ad-free time earned
        };
    }

    // Check if user can watch another ad (rate limiting)
    canWatchAd(username) {
        const cooldown = this.adViewCooldowns.get(username);
        if (!cooldown) return true;
        
        // 30 second cooldown between ads
        const cooldownMs = 30 * 1000;
        return Date.now() - cooldown > cooldownMs;
    }

    // Record an ad view and grant reward
    async recordAdView(username, rewardType = AD_REWARDS.AD_FREE_HOUR) {
        if (!this.canWatchAd(username)) {
            return { success: false, error: 'Please wait before watching another ad' };
        }

        const user = await storage.getUser(username);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Initialize monetization data if not present
        if (!user.monetization) {
            user.monetization = this.getDefaultMonetizationData();
        }

        // Update ad view tracking
        user.monetization.totalAdsWatched++;
        user.monetization.lastAdWatched = new Date().toISOString();
        this.adViewCooldowns.set(username, Date.now());

        // Grant reward based on type
        let rewardDescription = '';
        switch (rewardType) {
            case AD_REWARDS.AD_FREE_HOUR:
                // Add 1 hour of ad-free time
                const now = Date.now();
                const currentAdFree = user.monetization.adFreeUntil ? 
                    new Date(user.monetization.adFreeUntil).getTime() : now;
                const newExpiry = Math.max(currentAdFree, now) + (60 * 60 * 1000); // +1 hour
                user.monetization.adFreeUntil = new Date(newExpiry).toISOString();
                user.monetization.lifetimeAdFreeHours++;
                rewardDescription = '1 hour of ad-free gaming!';
                break;

            case AD_REWARDS.XP_BOOST:
                // 2x XP for next 30 minutes
                user.monetization.xpBoostUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
                rewardDescription = '2x XP boost for 30 minutes!';
                break;

            case AD_REWARDS.BONUS_COSMETIC:
                // Random cosmetic unlock
                const cosmetic = this.getRandomUnlockedCosmetic(user);
                if (cosmetic) {
                    user.monetization.unlockedCosmetics.push(cosmetic.id);
                    rewardDescription = `Unlocked: ${cosmetic.name}!`;
                } else {
                    // All cosmetics unlocked, give ad-free time instead
                    const fallbackExpiry = Date.now() + (60 * 60 * 1000);
                    user.monetization.adFreeUntil = new Date(fallbackExpiry).toISOString();
                    rewardDescription = '1 hour of ad-free gaming! (All cosmetics owned)';
                }
                break;

            case AD_REWARDS.THEME_UNLOCK:
                // Temporary theme unlock (24 hours)
                const theme = this.getRandomTheme(user);
                if (theme && !user.monetization.unlockedCosmetics.includes(theme.id)) {
                    if (!user.monetization.tempUnlocks) user.monetization.tempUnlocks = {};
                    user.monetization.tempUnlocks[theme.id] = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                    rewardDescription = `${theme.name} theme unlocked for 24 hours!`;
                } else {
                    rewardDescription = '1 hour of ad-free gaming!';
                    user.monetization.adFreeUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
                }
                break;

            default:
                rewardDescription = 'Thanks for watching!';
        }

        await storage.setUser(username, user);

        return {
            success: true,
            reward: rewardType,
            description: rewardDescription,
            monetization: this.sanitizeMonetization(user.monetization)
        };
    }

    // Get a random cosmetic the user doesn't own
    getRandomUnlockedCosmetic(user) {
        const allCosmetics = [
            ...COSMETICS.avatarFrames,
            ...COSMETICS.boardThemes.filter(t => !t.free),
            ...COSMETICS.playerIcons.filter(i => !i.free)
        ];
        
        const locked = allCosmetics.filter(c => !user.monetization.unlockedCosmetics.includes(c.id));
        if (locked.length === 0) return null;
        
        return locked[Math.floor(Math.random() * locked.length)];
    }

    // Get a random theme
    getRandomTheme(user) {
        return COSMETICS.boardThemes[Math.floor(Math.random() * COSMETICS.boardThemes.length)];
    }

    // Check if user is currently ad-free
    isAdFree(user) {
        if (!user.monetization) return false;
        
        // Premium/Ultimate battle pass is always ad-free
        if (user.monetization.battlePass !== BATTLE_PASS_TIERS.FREE) {
            return true;
        }
        
        // Check temporary ad-free from watching ads
        if (user.monetization.adFreeUntil) {
            return new Date(user.monetization.adFreeUntil) > new Date();
        }
        
        return false;
    }

    // Get user's monetization status
    async getStatus(username) {
        const user = await storage.getUser(username);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        if (!user.monetization) {
            user.monetization = this.getDefaultMonetizationData();
            await storage.setUser(username, user);
        }

        return {
            success: true,
            isAdFree: this.isAdFree(user),
            adFreeTimeRemaining: this.getAdFreeTimeRemaining(user),
            ...this.sanitizeMonetization(user.monetization)
        };
    }

    // Get remaining ad-free time in minutes
    getAdFreeTimeRemaining(user) {
        if (!user.monetization?.adFreeUntil) return 0;
        if (user.monetization.battlePass !== BATTLE_PASS_TIERS.FREE) return Infinity;
        
        const remaining = new Date(user.monetization.adFreeUntil) - new Date();
        return Math.max(0, Math.floor(remaining / (60 * 1000)));
    }

    // Equip a cosmetic
    async equipCosmetic(username, cosmeticType, cosmeticId) {
        const user = await storage.getUser(username);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        if (!user.monetization) {
            user.monetization = this.getDefaultMonetizationData();
        }

        // Check if user owns the cosmetic
        const owned = user.monetization.unlockedCosmetics.includes(cosmeticId);
        const tempUnlocked = user.monetization.tempUnlocks?.[cosmeticId] && 
            new Date(user.monetization.tempUnlocks[cosmeticId]) > new Date();
        
        if (!owned && !tempUnlocked) {
            return { success: false, error: 'You do not own this cosmetic' };
        }

        // Validate cosmetic type
        const validTypes = ['avatarFrame', 'boardTheme', 'playerIcon'];
        if (!validTypes.includes(cosmeticType)) {
            return { success: false, error: 'Invalid cosmetic type' };
        }

        user.monetization.equippedCosmetics[cosmeticType] = cosmeticId;
        await storage.setUser(username, user);

        return {
            success: true,
            equipped: user.monetization.equippedCosmetics
        };
    }

    // Get available cosmetics
    getAvailableCosmetics() {
        return COSMETICS;
    }

    // Grant ad-free time bonus (for account creation, linking socials, etc.)
    async grantAdFreeTime(username, minutes, reason = 'bonus') {
        const user = await storage.getUser(username);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Initialize monetization data if not present
        if (!user.monetization) {
            user.monetization = this.getDefaultMonetizationData();
        }

        // Add ad-free time
        const now = Date.now();
        const currentAdFree = user.monetization.adFreeUntil ? 
            new Date(user.monetization.adFreeUntil).getTime() : now;
        const newExpiry = Math.max(currentAdFree, now) + (minutes * 60 * 1000);
        user.monetization.adFreeUntil = new Date(newExpiry).toISOString();
        
        // Track lifetime hours (consistent with recordAdView - count full hours)
        const hoursGranted = Math.ceil(minutes / 60);
        user.monetization.lifetimeAdFreeHours += hoursGranted;

        await storage.setUser(username, user);

        return {
            success: true,
            reason,
            minutesGranted: minutes,
            adFreeUntil: user.monetization.adFreeUntil,
            description: `+${minutes} minutes of ad-free gaming!`
        };
    }

    // Remove sensitive data
    sanitizeMonetization(monetization) {
        return {
            battlePass: monetization.battlePass,
            adFreeUntil: monetization.adFreeUntil,
            totalAdsWatched: monetization.totalAdsWatched,
            unlockedCosmetics: monetization.unlockedCosmetics,
            equippedCosmetics: monetization.equippedCosmetics,
            lifetimeAdFreeHours: monetization.lifetimeAdFreeHours,
            xpBoostUntil: monetization.xpBoostUntil,
            tempUnlocks: monetization.tempUnlocks || {}
        };
    }
}

module.exports = new Monetization();
module.exports.AD_REWARDS = AD_REWARDS;
module.exports.BATTLE_PASS_TIERS = BATTLE_PASS_TIERS;
module.exports.COSMETICS = COSMETICS;
