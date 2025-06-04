"use server";

import { currentUser } from "@clerk/nextjs/server";
import {
  getPocketBaseClientInstance,
  executeAuthenticatedOperation,
  Collections,
} from "~/lib/pb";
import type { User } from "@clerk/nextjs/server";

// 缓存用户信息的接口
interface CachedUser {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  lastUpdated: string;
}

// 内存缓存
const userCache = new Map<string, { user: User; timestamp: number }>();
const MEMORY_CACHE_DURATION = 5 * 60 * 1000; // 5分钟内存缓存
const DB_CACHE_DURATION = 30 * 60 * 1000; // 30分钟数据库缓存

/**
 * 获取缓存的当前用户信息
 * 优先级：内存缓存 -> PocketBase缓存 -> Clerk API
 */
export async function getCachedCurrentUser(): Promise<User | null> {
  try {
    // 1. 检查内存缓存
    const memoryUser = getFromMemoryCache();
    if (memoryUser) {
      console.log("从内存缓存获取用户信息");
      return memoryUser;
    }

    // 2. 检查 PocketBase 缓存
    const dbUser = await getFromDatabaseCache();
    if (dbUser) {
      console.log("从数据库缓存获取用户信息");
      // 更新内存缓存
      setMemoryCache(dbUser);
      return dbUser;
    }

    // 3. 从 Clerk API 获取并缓存
    console.log("从 Clerk API 获取用户信息");
    const startTime = performance.now();
    const user = await currentUser();
    const endTime = performance.now();

    console.log(`Clerk API 调用耗时: ${(endTime - startTime).toFixed(2)}ms`);

    if (user) {
      // 异步更新缓存，不阻塞响应
      void updateCaches(user);
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
 * 从数据库缓存获取用户
 */
async function getFromDatabaseCache(): Promise<User | null> {
  try {
    return await executeAuthenticatedOperation(async () => {
      const pb = getPocketBaseClientInstance();

      // 查找最近更新的用户缓存
      const records = await pb
        .collection(Collections.USER_CACHE)
        .getList(1, 1, {
          sort: "-lastUpdated",
          filter: `lastUpdated >= "${new Date(Date.now() - DB_CACHE_DURATION).toISOString()}"`,
        });

      if (records.items.length > 0) {
        const cached = records.items[0] as unknown as CachedUser;
        return convertCachedUserToClerkUser(cached);
      }

      return null;
    });
  } catch (error) {
    console.log("从数据库缓存获取用户失败:", error);
    return null;
  }
}

/**
 * 更新所有缓存
 */
async function updateCaches(user: User): Promise<void> {
  try {
    // 更新内存缓存
    setMemoryCache(user);

    // 更新数据库缓存
    await executeAuthenticatedOperation(async () => {
      const pb = getPocketBaseClientInstance();

      const cachedUser: Omit<CachedUser, "id"> = {
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? "",
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        imageUrl: user.imageUrl ?? undefined,
        lastUpdated: new Date().toISOString(),
      };

      // 尝试更新现有记录，如果不存在则创建
      try {
        const existingRecords = await pb
          .collection(Collections.USER_CACHE)
          .getList(1, 1, {
            filter: `clerkId="${user.id}"`,
          });

        if (existingRecords.items.length > 0) {
          await pb
            .collection(Collections.USER_CACHE)
            .update(existingRecords.items[0]!.id, cachedUser);
        } else {
          await pb.collection(Collections.USER_CACHE).create(cachedUser);
        }
      } catch (error) {
        console.error("更新数据库缓存失败:", error);
      }
    });
  } catch (error) {
    console.error("更新缓存失败:", error);
  }
}

/**
 * 将缓存的用户数据转换为 Clerk User 对象
 */
function convertCachedUserToClerkUser(cached: CachedUser): User {
  // 这里需要构造一个符合 Clerk User 接口的对象
  // 注意：这是一个简化版本，可能需要根据实际使用的字段进行调整
  return {
    id: cached.clerkId,
    firstName: cached.firstName ?? null,
    lastName: cached.lastName ?? null,
    imageUrl: cached.imageUrl ?? "",
    emailAddresses: [
      {
        id: "cached",
        emailAddress: cached.email,
        verification: { status: "verified" as const },
      },
    ],
    // 添加其他必要的字段，使用合理的默认值
    username: null,
    phoneNumbers: [],
    web3Wallets: [],
    externalAccounts: [],
    externalId: null,
    samlAccounts: [],
    organizationMemberships: [],
    passwordEnabled: true,
    totpEnabled: false,
    backupCodeEnabled: false,
    twoFactorEnabled: false,
    banned: false,
    locked: false,
    createdAt: new Date(cached.lastUpdated),
    updatedAt: new Date(cached.lastUpdated),
    lastSignInAt: null,
    lastActiveAt: null,
    publicMetadata: {},
    privateMetadata: {},
    unsafeMetadata: {},
    hasImage: !!cached.imageUrl,
    primaryEmailAddressId: "cached",
    primaryPhoneNumberId: null,
    primaryWeb3WalletId: null,
    createOrganizationEnabled: true,
    deleteSelfEnabled: true,
    fullName:
      `${cached.firstName ?? ""} ${cached.lastName ?? ""}`.trim() || null,
  } as unknown as User;
}

/**
 * 清除用户缓存
 */
export async function clearUserCache(clerkId?: string): Promise<void> {
  try {
    // 清除内存缓存
    if (clerkId) {
      userCache.delete(clerkId);
    } else {
      userCache.clear();
    }

    // 清除数据库缓存
    await executeAuthenticatedOperation(async () => {
      const pb = getPocketBaseClientInstance();

      if (clerkId) {
        const records = await pb
          .collection(Collections.USER_CACHE)
          .getList(1, 10, {
            filter: `clerkId="${clerkId}"`,
          });

        for (const record of records.items) {
          await pb.collection(Collections.USER_CACHE).delete(record.id);
        }
      } else {
        // 清除所有缓存（谨慎使用）
        const records = await pb
          .collection(Collections.USER_CACHE)
          .getList(1, 100);
        for (const record of records.items) {
          await pb.collection(Collections.USER_CACHE).delete(record.id);
        }
      }
    });
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
