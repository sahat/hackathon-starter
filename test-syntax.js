// 测试LoginHistory模型语法
const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  loginTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  loginMethod: {
    type: String,
    required: true,
    enum: ['local', 'github', 'google', 'facebook', 'discord', 'microsoft', 'linkedin', 'steam', 'twitch', 'tumblr', 'trakt', 'quickbooks', 'x']
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

loginHistorySchema.index({ userId: 1, loginTime: -1 });

loginHistorySchema.statics.recordLogin = async function(userId, loginMethod, ipAddress, userAgent) {
  try {
    await this.create({
      userId,
      loginMethod,
      ipAddress,
      userAgent
    });

    const allRecords = await this.find({ userId }).sort({ loginTime: -1 });
    
    if (allRecords.length > 20) {
      const recordsToDelete = allRecords.slice(20);
      const idsToDelete = recordsToDelete.map(record => record._id);
      await this.deleteMany({ _id: { $in: idsToDelete } });
    }
    
    return true;
  } catch (error) {
    console.error('Error recording login history:', error);
    return false;
  }
};

loginHistorySchema.statics.getUserLoginHistory = async function(userId, limit = 20) {
  try {
    return await this.find({ userId })
      .sort({ loginTime: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error('Error getting login history:', error);
    return [];
  }
};

const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);

console.log('LoginHistory model syntax is valid');