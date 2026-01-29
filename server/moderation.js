/**
 * Moderation Module
 * Handles blocking, reporting, and disciplinary actions
 */

const { v4: uuidv4 } = require('uuid');
const storage = require('./storage');

// Report categories
const REPORT_CATEGORIES = {
    HARASSMENT: 'harassment',
    HATE_SPEECH: 'hate_speech',
    CHEATING: 'cheating',
    SPAM: 'spam',
    INAPPROPRIATE_NAME: 'inappropriate_name',
    INAPPROPRIATE_CONTENT: 'inappropriate_content',
    THREATS: 'threats',
    OTHER: 'other'
};

// Discipline levels
const DISCIPLINE_LEVELS = {
    WARNING: 'warning',
    MUTE_1H: 'mute_1h',
    MUTE_24H: 'mute_24h',
    TEMP_BAN_1D: 'temp_ban_1d',
    TEMP_BAN_7D: 'temp_ban_7d',
    TEMP_BAN_30D: 'temp_ban_30d',
    PERMANENT_BAN: 'permanent_ban'
};

// Duration in milliseconds for each discipline type
const DISCIPLINE_DURATIONS = {
    [DISCIPLINE_LEVELS.WARNING]: 0,
    [DISCIPLINE_LEVELS.MUTE_1H]: 60 * 60 * 1000,
    [DISCIPLINE_LEVELS.MUTE_24H]: 24 * 60 * 60 * 1000,
    [DISCIPLINE_LEVELS.TEMP_BAN_1D]: 24 * 60 * 60 * 1000,
    [DISCIPLINE_LEVELS.TEMP_BAN_7D]: 7 * 24 * 60 * 60 * 1000,
    [DISCIPLINE_LEVELS.TEMP_BAN_30D]: 30 * 24 * 60 * 60 * 1000,
    [DISCIPLINE_LEVELS.PERMANENT_BAN]: -1 // Never expires
};

class Moderation {
    constructor() {
        this.reportCategories = REPORT_CATEGORIES;
        this.disciplineLevels = DISCIPLINE_LEVELS;
    }

    // ==========================================
    // BLOCKING SYSTEM
    // ==========================================

    // Block a user
    async blockUser(blockerUsername, blockedUsername) {
        if (blockerUsername === blockedUsername) {
            return { success: false, error: "You can't block yourself" };
        }

        const blockedUser = await storage.getUser(blockedUsername);
        if (!blockedUser) {
            return { success: false, error: 'User not found' };
        }

        await storage.blockUser(blockerUsername, blockedUsername);
        
        // Also unfollow if following
        await storage.unfollowUser(blockerUsername, blockedUsername);
        await storage.unfollowUser(blockedUsername, blockerUsername);

        return { success: true, message: `${blockedUsername} has been blocked` };
    }

    // Unblock a user
    async unblockUser(blockerUsername, blockedUsername) {
        await storage.unblockUser(blockerUsername, blockedUsername);
        return { success: true, message: `${blockedUsername} has been unblocked` };
    }

    // Check if user is blocked
    async isBlocked(username, targetUsername) {
        return await storage.isBlocked(username, targetUsername);
    }

    // Check if either user has blocked the other
    async areBlocked(username1, username2) {
        const blocked1 = await storage.isBlocked(username1, username2);
        const blocked2 = await storage.isBlocked(username2, username1);
        return blocked1 || blocked2;
    }

    // Get list of blocked users
    async getBlockedUsers(username) {
        return await storage.getBlockedUsers(username);
    }

    // ==========================================
    // REPORTING SYSTEM
    // ==========================================

    // Submit a report
    async reportUser(reporterUsername, reportedUsername, category, description, evidence = null) {
        if (reporterUsername === reportedUsername) {
            return { success: false, error: "You can't report yourself" };
        }

        if (!Object.values(REPORT_CATEGORIES).includes(category)) {
            return { success: false, error: 'Invalid report category' };
        }

        const reportedUser = await storage.getUser(reportedUsername);
        if (!reportedUser) {
            return { success: false, error: 'User not found' };
        }

        // Check for duplicate reports (same reporter, same user, within 24 hours)
        const recentReports = await storage.getReportsByReporter(reporterUsername);
        const duplicateReport = recentReports.find(r => 
            r.reportedUsername === reportedUsername &&
            Date.now() - new Date(r.createdAt).getTime() < 24 * 60 * 60 * 1000
        );

        if (duplicateReport) {
            return { success: false, error: 'You have already reported this user recently' };
        }

        const report = {
            id: uuidv4(),
            reporterUsername,
            reportedUsername,
            category,
            description: description?.slice(0, 1000) || '',
            evidence,
            status: 'pending', // pending, reviewed, resolved, dismissed
            createdAt: new Date().toISOString(),
            reviewedAt: null,
            reviewedBy: null,
            action: null,
            notes: null
        };

        await storage.addReport(report);

        // Auto-moderation: Check if user has multiple recent reports
        await this.checkAutoModeration(reportedUsername);

        return { success: true, reportId: report.id, message: 'Report submitted successfully' };
    }

    // Auto-moderation based on report count
    async checkAutoModeration(username) {
        const reports = await storage.getReportsAgainstUser(username);
        const recentReports = reports.filter(r => 
            r.status === 'pending' &&
            Date.now() - new Date(r.createdAt).getTime() < 24 * 60 * 60 * 1000
        );

        // If 5+ unique reporters in 24 hours, auto-mute
        const uniqueReporters = new Set(recentReports.map(r => r.reporterUsername));
        
        if (uniqueReporters.size >= 5) {
            await this.applyDiscipline(
                username,
                DISCIPLINE_LEVELS.MUTE_24H,
                'Auto-moderation: Multiple reports received',
                'SYSTEM'
            );
        }
    }

    // Get reports against a user (for moderation)
    async getReportsAgainstUser(username) {
        return await storage.getReportsAgainstUser(username);
    }

    // Get reports submitted by a user
    async getReportsByReporter(username) {
        return await storage.getReportsByReporter(username);
    }

    // Review a report (moderator action)
    async reviewReport(reportId, moderatorUsername, action, notes) {
        const report = await storage.getReport(reportId);
        if (!report) {
            return { success: false, error: 'Report not found' };
        }

        report.status = 'reviewed';
        report.reviewedAt = new Date().toISOString();
        report.reviewedBy = moderatorUsername;
        report.action = action;
        report.notes = notes;

        await storage.updateReport(report);

        // Apply discipline if action specified
        if (action && action !== 'dismissed') {
            await this.applyDiscipline(
                report.reportedUsername,
                action,
                `Report #${reportId}: ${report.category}`,
                moderatorUsername
            );
        }

        return { success: true, report };
    }

    // ==========================================
    // DISCIPLINE SYSTEM
    // ==========================================

    // Apply discipline to a user
    async applyDiscipline(username, level, reason, moderatorUsername) {
        if (!Object.values(DISCIPLINE_LEVELS).includes(level)) {
            return { success: false, error: 'Invalid discipline level' };
        }

        const user = await storage.getUser(username);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        const duration = DISCIPLINE_DURATIONS[level];
        const expiresAt = duration === -1 ? null : 
                         duration === 0 ? null :
                         new Date(Date.now() + duration).toISOString();

        const discipline = {
            id: uuidv4(),
            username,
            level,
            reason,
            issuedBy: moderatorUsername,
            issuedAt: new Date().toISOString(),
            expiresAt,
            active: true
        };

        await storage.addDiscipline(discipline);

        // Update user status
        if (!user.moderation) {
            user.moderation = {
                warnings: 0,
                mutes: 0,
                bans: 0,
                currentRestrictions: []
            };
        }

        // Track discipline counts
        if (level === DISCIPLINE_LEVELS.WARNING) {
            user.moderation.warnings++;
        } else if (level.startsWith('mute')) {
            user.moderation.mutes++;
        } else if (level.includes('ban')) {
            user.moderation.bans++;
        }

        // Add to current restrictions
        user.moderation.currentRestrictions.push({
            type: level,
            expiresAt,
            disciplineId: discipline.id
        });

        await storage.setUser(username, user);

        return { success: true, discipline };
    }

    // Check if user has active restrictions
    async checkRestrictions(username) {
        const user = await storage.getUser(username);
        if (!user || !user.moderation) {
            return { restricted: false, restrictions: [] };
        }

        const now = new Date();
        const activeRestrictions = [];
        const expiredRestrictions = [];

        for (const restriction of user.moderation.currentRestrictions) {
            if (restriction.expiresAt === null && restriction.type === DISCIPLINE_LEVELS.PERMANENT_BAN) {
                activeRestrictions.push(restriction);
            } else if (restriction.expiresAt && new Date(restriction.expiresAt) > now) {
                activeRestrictions.push(restriction);
            } else if (restriction.expiresAt) {
                expiredRestrictions.push(restriction);
            }
        }

        // Clean up expired restrictions
        if (expiredRestrictions.length > 0) {
            user.moderation.currentRestrictions = activeRestrictions;
            await storage.setUser(username, user);

            // Mark disciplines as inactive
            for (const restriction of expiredRestrictions) {
                await storage.deactivateDiscipline(restriction.disciplineId);
            }
        }

        return {
            restricted: activeRestrictions.length > 0,
            restrictions: activeRestrictions,
            isBanned: activeRestrictions.some(r => r.type.includes('ban')),
            isMuted: activeRestrictions.some(r => r.type.includes('mute')),
            isPermanentlyBanned: activeRestrictions.some(r => r.type === DISCIPLINE_LEVELS.PERMANENT_BAN)
        };
    }

    // Remove a discipline (moderator pardon)
    async removeDiscipline(disciplineId, moderatorUsername) {
        const discipline = await storage.getDiscipline(disciplineId);
        if (!discipline) {
            return { success: false, error: 'Discipline record not found' };
        }

        discipline.active = false;
        discipline.removedBy = moderatorUsername;
        discipline.removedAt = new Date().toISOString();

        await storage.updateDiscipline(discipline);

        // Update user restrictions
        const user = await storage.getUser(discipline.username);
        if (user && user.moderation) {
            user.moderation.currentRestrictions = user.moderation.currentRestrictions
                .filter(r => r.disciplineId !== disciplineId);
            await storage.setUser(discipline.username, user);
        }

        return { success: true, message: 'Discipline removed' };
    }

    // Get discipline history for a user
    async getDisciplineHistory(username) {
        return await storage.getDisciplineHistory(username);
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    // Check if user can interact with another user
    async canInteract(username, targetUsername) {
        // Check if blocked
        const blocked = await this.areBlocked(username, targetUsername);
        if (blocked) {
            return { allowed: false, reason: 'blocked' };
        }

        // Check if either user is banned
        const userRestrictions = await this.checkRestrictions(username);
        if (userRestrictions.isBanned) {
            return { allowed: false, reason: 'you_are_banned' };
        }

        const targetRestrictions = await this.checkRestrictions(targetUsername);
        if (targetRestrictions.isBanned) {
            return { allowed: false, reason: 'target_banned' };
        }

        return { allowed: true };
    }

    // Check if user can send messages
    async canSendMessage(username) {
        const restrictions = await this.checkRestrictions(username);
        if (restrictions.isMuted) {
            const muteRestriction = restrictions.restrictions.find(r => r.type.includes('mute'));
            return { 
                allowed: false, 
                reason: 'muted',
                expiresAt: muteRestriction?.expiresAt 
            };
        }
        if (restrictions.isBanned) {
            return { allowed: false, reason: 'banned' };
        }
        return { allowed: true };
    }

    // Get moderation summary for a user
    async getModerationSummary(username) {
        const user = await storage.getUser(username);
        const reports = await storage.getReportsAgainstUser(username);
        const disciplines = await storage.getDisciplineHistory(username);
        const restrictions = await this.checkRestrictions(username);

        return {
            totalReports: reports.length,
            pendingReports: reports.filter(r => r.status === 'pending').length,
            totalDisciplines: disciplines.length,
            warnings: user?.moderation?.warnings || 0,
            mutes: user?.moderation?.mutes || 0,
            bans: user?.moderation?.bans || 0,
            currentRestrictions: restrictions.restrictions,
            isBanned: restrictions.isBanned,
            isMuted: restrictions.isMuted
        };
    }
}

module.exports = new Moderation();
module.exports.REPORT_CATEGORIES = REPORT_CATEGORIES;
module.exports.DISCIPLINE_LEVELS = DISCIPLINE_LEVELS;
