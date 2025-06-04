# 手动设置用户缓存表

由于自动脚本可能遇到权限问题，这里提供手动设置 `user_cache` 集合的步骤。

## 方法一：通过 PocketBase 管理界面

1. **启动 PocketBase**
   ```bash
   # 确保 PocketBase 正在运行
   # 通常在 http://127.0.0.1:8090
   ```

2. **访问管理界面**
   - 打开浏览器访问 `http://127.0.0.1:8090/_/`
   - 使用管理员账号登录

3. **创建新集合**
   - 点击 "Collections" 菜单
   - 点击 "New collection" 按钮
   - 选择 "Base collection"

4. **设置集合信息**
   - **Name**: `user_cache`
   - **Type**: Base collection

5. **添加字段**
   
   按顺序添加以下字段：

   | 字段名 | 类型 | 必需 | 唯一 | 其他设置 |
   |--------|------|------|------|----------|
   | `clerkId` | Text | ✓ | ✓ | - |
   | `email` | Email | ✓ | - | - |
   | `firstName` | Text | - | - | - |
   | `lastName` | Text | - | - | - |
   | `imageUrl` | URL | - | - | - |
   | `lastUpdated` | Date | ✓ | - | - |

6. **设置权限**
   - **List rule**: 留空（无限制）
   - **View rule**: 留空（无限制）
   - **Create rule**: 留空（无限制）
   - **Update rule**: 留空（无限制）
   - **Delete rule**: 留空（无限制）

7. **保存集合**
   - 点击 "Create" 按钮完成创建

## 方法二：通过 SQL（如果支持）

如果您的 PocketBase 支持直接执行 SQL，可以使用以下语句：

```sql
-- 创建 user_cache 表
CREATE TABLE user_cache (
    id TEXT PRIMARY KEY,
    clerkId TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    firstName TEXT,
    lastName TEXT,
    imageUrl TEXT,
    lastUpdated DATETIME NOT NULL,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE UNIQUE INDEX idx_user_cache_clerk_id ON user_cache (clerkId);
CREATE INDEX idx_user_cache_last_updated ON user_cache (lastUpdated);
```

## 验证设置

设置完成后，您可以通过以下方式验证：

1. **检查集合是否存在**
   - 在 PocketBase 管理界面的 Collections 页面查看
   - 应该能看到 `user_cache` 集合

2. **测试缓存系统**
   - 访问 `/admin/test-cache` 页面
   - 查看是否能正常工作

3. **查看日志**
   - 检查浏览器控制台
   - 应该能看到缓存相关的日志信息

## 故障排除

### 常见问题

1. **权限错误**
   - 确保使用管理员账号登录 PocketBase
   - 检查集合的权限设置

2. **字段类型错误**
   - 确保字段类型设置正确
   - 特别注意 `clerkId` 必须设置为唯一

3. **连接问题**
   - 确保 PocketBase 服务正在运行
   - 检查 `NEXT_PUBLIC_POCKETBASE_URL` 环境变量

### 测试步骤

1. **基本连接测试**
   ```bash
   curl http://127.0.0.1:8090/api/health
   ```

2. **集合访问测试**
   ```bash
   curl http://127.0.0.1:8090/api/collections/user_cache/records
   ```

3. **应用测试**
   - 访问 `/admin/new` 页面
   - 查看控制台日志
   - 确认缓存系统工作正常

## 下一步

设置完成后，您可以：

1. 测试认证缓存性能：访问 `/admin/auth-performance`
2. 验证缓存功能：访问 `/admin/test-cache`
3. 查看详细文档：`docs/auth-cache-system.md`

如果遇到问题，请检查：
- PocketBase 服务状态
- 环境变量配置
- 网络连接
- 权限设置
