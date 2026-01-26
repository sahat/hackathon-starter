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

// 复合索引，按用户ID和登录时间排序
loginHistorySchema.index({ userId: 1, loginTime: -1 });

// 静态方法：记录登录历史并限制记录数量
loginHistorySchema.statics.recordLogin = async function(userId, loginMethod, ipAddress, userAgent) {
  try {
    // 创建新的登录记录
    await this.create({
      userId,
      loginMethod,
      ipAddress,
      userAgent
    });

    // 获取该用户的所有登录记录并按时间排序
    const allRecords = await this.find({ userId }).sort({ loginTime: -1 });
    
    // 如果记录超过20条，删除最旧的记录
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

// 静态方法：获取用户的登录历史
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

module.exports = LoginHistory;