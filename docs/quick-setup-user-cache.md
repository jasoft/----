# 快速设置用户缓存表

## 方法一：通过应用界面（推荐）

1. 访问 `http://localhost:3001/admin/setup-cache`
2. 点击"检查状态"按钮
3. 如果显示集合不存在，点击"创建集合"按钮
4. 等待创建完成

## 方法二：手动在 PocketBase 管理界面创建

1. **访问 PocketBase 管理界面**
   - 打开 `http://192.168.1.138:8090/_/`
   - 使用以下凭据登录：
     - 邮箱：`1188540@qq.com`
     - 密码：`daSyc1uJ0Sl`

2. **创建新集合**
   - 点击左侧菜单的 "Collections"
   - 点击 "New collection" 按钮
   - 选择 "Base collection"

3. **设置集合基本信息**
   - **Name**: `user_cache`
   - **Type**: Base collection
   - 点击 "Create" 按钮

4. **添加字段**
   
   创建集合后，添加以下字段：

   **字段 1: clerkId**
   - 点击 "New field" 按钮
   - 选择 "Text" 类型
   - Name: `clerkId`
   - ✅ Required
   - ✅ Unique
   - 点击 "Save"

   **字段 2: email**
   - 点击 "New field" 按钮
   - 选择 "Email" 类型
   - Name: `email`
   - ✅ Required
   - 点击 "Save"

   **字段 3: firstName**
   - 点击 "New field" 按钮
   - 选择 "Text" 类型
   - Name: `firstName`
   - ❌ Required (不勾选)
   - 点击 "Save"

   **字段 4: lastName**
   - 点击 "New field" 按钮
   - 选择 "Text" 类型
   - Name: `lastName`
   - ❌ Required (不勾选)
   - 点击 "Save"

   **字段 5: imageUrl**
   - 点击 "New field" 按钮
   - 选择 "URL" 类型
   - Name: `imageUrl`
   - ❌ Required (不勾选)
   - 点击 "Save"

   **字段 6: lastUpdated**
   - 点击 "New field" 按钮
   - 选择 "Date" 类型
   - Name: `lastUpdated`
   - ✅ Required
   - 点击 "Save"

5. **设置权限（可选）**
   - 在集合页面，点击 "Settings" 标签
   - 将所有规则（List rule, View rule, Create rule, Update rule, Delete rule）留空
   - 点击 "Save changes"

## 验证设置

设置完成后：

1. 访问 `http://localhost:3001/admin/setup-cache`
2. 点击"检查状态"，应该显示"集合已存在"
3. 访问 `http://localhost:3001/admin/test-cache` 进行快速测试
4. 访问 `http://localhost:3001/admin/auth-performance` 进行详细性能测试

## 故障排除

如果遇到问题：

1. **权限错误**：确保使用正确的管理员邮箱和密码登录
2. **字段创建失败**：检查字段名称拼写是否正确
3. **连接问题**：确保 PocketBase 服务正在运行

## 完成后

一旦 `user_cache` 集合创建成功，您的认证缓存系统就可以正常工作了！

- 访问 `/admin/new` 页面时会自动使用缓存系统
- 查看浏览器控制台可以看到缓存相关的日志
- 性能应该有显著提升
