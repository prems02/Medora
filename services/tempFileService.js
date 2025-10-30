const fs = require('fs').promises;
const path = require('path');

class TempFileService {
    constructor() {
        // Create temp directory if it doesn't exist
        this.tempDir = path.join(__dirname, '..', 'temp', 'ai_conversations');
        this.backupDir = path.join(__dirname, '..', 'temp', 'ai_conversations_backup');
        this.initDirectories();
    }

    async initDirectories() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
            await fs.mkdir(this.backupDir, { recursive: true });
            console.log('✅ Temp directories initialized');
        } catch (error) {
            console.error('❌ Error creating temp directories:', error);
        }
    }

    /**
     * Save conversation data to temporary JSON file
     * @param {Object} conversationData - The conversation data to save
     * @param {string} reportId - Unique report identifier
     * @returns {Object} File paths and metadata
     */
    async saveConversationToTempFile(conversationData, reportId) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `ai_conversation_${reportId}_${timestamp}.json`;
            const backupFileName = `backup_${fileName}`;

            const filePath = path.join(this.tempDir, fileName);
            const backupPath = path.join(this.backupDir, backupFileName);

            // Prepare data structure for JSON file
            const fileData = {
                metadata: {
                    reportId: reportId,
                    timestamp: new Date().toISOString(),
                    source: 'ElevenLabs_Webhook',
                    version: '1.0'
                },
                conversationData: conversationData,
                processingInfo: {
                    status: 'saved_to_temp',
                    savedAt: new Date().toISOString(),
                    filePath: filePath,
                    backupPath: backupPath
                }
            };

            // Save main file
            await fs.writeFile(filePath, JSON.stringify(fileData, null, 2), 'utf8');
            console.log(`✅ Conversation saved to temp file: ${fileName}`);

            // Save backup file
            await fs.writeFile(backupPath, JSON.stringify(fileData, null, 2), 'utf8');
            console.log(`✅ Backup saved: ${backupFileName}`);

            return {
                success: true,
                filePath: filePath,
                backupPath: backupPath,
                fileName: fileName,
                fileSize: (await fs.stat(filePath)).size,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error saving conversation to temp file:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Read conversation data from temporary file
     * @param {string} filePath - Path to the temp file
     * @returns {Object} Conversation data
     */
    async readConversationFromTempFile(filePath) {
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(fileContent);

            console.log(`✅ Successfully read temp file: ${path.basename(filePath)}`);
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('❌ Error reading temp file:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * List all temporary conversation files
     * @returns {Array} List of temp files
     */
    async listTempFiles() {
        try {
            const files = await fs.readdir(this.tempDir);
            const jsonFiles = files.filter(file => file.endsWith('.json'));

            const fileDetails = await Promise.all(
                jsonFiles.map(async (file) => {
                    const filePath = path.join(this.tempDir, file);
                    const stats = await fs.stat(filePath);
                    return {
                        fileName: file,
                        filePath: filePath,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    };
                })
            );

            return {
                success: true,
                files: fileDetails,
                count: fileDetails.length
            };
        } catch (error) {
            console.error('❌ Error listing temp files:', error);
            return {
                success: false,
                error: error.message,
                files: [],
                count: 0
            };
        }
    }

    /**
     * Clean up old temporary files
     * @param {number} maxAgeHours - Maximum age in hours before cleanup
     */
    async cleanupOldFiles(maxAgeHours = 24) {
        try {
            const files = await fs.readdir(this.tempDir);
            const now = new Date();
            let cleanedCount = 0;

            for (const file of files) {
                const filePath = path.join(this.tempDir, file);
                const stats = await fs.stat(filePath);
                const ageHours = (now - stats.birthtime) / (1000 * 60 * 60);

                if (ageHours > maxAgeHours) {
                    await fs.unlink(filePath);
                    cleanedCount++;
                    console.log(`🗑️ Cleaned up old temp file: ${file}`);
                }
            }

            console.log(`✅ Cleanup completed. Removed ${cleanedCount} old files.`);
            return {
                success: true,
                cleanedCount: cleanedCount
            };
        } catch (error) {
            console.error('❌ Error during cleanup:', error);
            return {
                success: false,
                error: error.message,
                cleanedCount: 0
            };
        }
    }

    /**
     * Get temp directory path
     */
    getTempDirectory() {
        return this.tempDir;
    }

    /**
     * Get backup directory path
     */
    getBackupDirectory() {
        return this.backupDir;
    }
}

module.exports = new TempFileService();
