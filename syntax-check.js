// 简单的语法检查
try {
  // 测试LoginHistory模型
  const LoginHistory = require('./models/LoginHistory');
  console.log('✓ LoginHistory模型语法正确');
  
  // 测试用户控制器
  const userController = require('./controllers/user');
  console.log('✓ 用户控制器语法正确');
  
  console.log('所有文件语法检查通过');
} catch (error) {
  console.error('语法错误:', error.message);
  process.exit(1);
}