"use server";

import { currentUser } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";

// 内存缓存
const userCache = new Map<string, { user: User; timestamp: number }>();
const MEMORY_CACHE_DURATION = 5 * 60 * 1000; // 5分钟内存缓存

/**
 * 获取缓存的当前用户信息
 * 使用内存缓存优化性能
 */
export async function getCachedCurrentUser(): Promise<User | null> {
  try {
    // 1. 检查内存缓存
    const memoryUser = getFromMemoryCache();
    if (memoryUser) {
      console.log("从内存缓存获取用户信息");
      return memoryUser;
    }

    // 2. 从 Clerk API 获取并缓存
    console.log("从 Clerk API 获取用户信息");
    const startTime = performance.now();
    const user = await currentUser();
    const endTime = performance.now();

    console.log(`Clerk API 调用耗时: ${(endTime - startTime).toFixed(2)}ms`);

    if (user) {
      // 更新内存缓存
      setMemoryCache(user);
    }

    return user;
  } catch (error) {
    console.error("获取用户信息失败:", error);
    // 如果缓存系统失败，回退到直接调用 Clerk
    return await currentUser();
  }
}

/**
 * 从内存缓存获取用户
 */
function getFromMemoryCache(): User | null {
  for (const [clerkId, cached] of userCache.entries()) {
    if (Date.now() - cached.timestamp < MEMORY_CACHE_DURATION) {
      return cached.user;
    } else {
      // 清理过期缓存
      userCache.delete(clerkId);
    }
  }
  return null;
}

/**
 * 设置内存缓存
 */
function setMemoryCache(user: User): void {
  userCache.set(user.id, {
    user,
    timestamp: Date.now(),
  });
}

/**
 * 清除用户缓存
 */
export async function clearUserCache(clerkId?: string): Promise<void> {
  try {
    if (clerkId) {
      userCache.delete(clerkId);
      console.log(`已清除用户 ${clerkId} 的内存缓存`);
    } else {
      userCache.clear();
      console.log("已清除所有内存缓存");
    }
  } catch (error) {
    console.error("清除用户缓存失败:", error);
  }
}

/**
 * 强制刷新用户缓存
 */
export async function refreshUserCache(): Promise<User | null> {
  try {
    // 清除现有缓存
    await clearUserCache();

    // 重新获取用户信息
    return await getCachedCurrentUser();
  } catch (error) {
    console.error("刷新用户缓存失败:", error);
    return null;
  }
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats() {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  for (const [clerkId, cached] of userCache.entries()) {
    if (now - cached.timestamp < MEMORY_CACHE_DURATION) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }

  return {
    totalEntries: userCache.size,
    validEntries,
    expiredEntries,
    cacheDurationMs: MEMORY_CACHE_DURATION,
    cacheDurationMinutes: MEMORY_CACHE_DURATION / (60 * 1000),
  };
}
