"use client";

import { useState } from "react";
import type { Model, PocketBaseResponse } from "~/lib/pb";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Dialog } from "~/components/ui/dialog";

const registrationSchema = z.object({
  name: z
    .string()
    .min(2, "姓名至少需要2个字符")
    .max(20, "姓名不能超过20个字符")
    .trim(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号码"),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  activityId: string;
  onSubmit: (data: FormData) => Promise<void>;
}

export function RegistrationForm({
  activityId,
  onSubmit,
}: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  interface CheckPhoneRecord extends Model {
    phone: string;
  }

  type CheckPhoneResponse = PocketBaseResponse<CheckPhoneRecord>;

  const checkPhoneExists = async (phone: string): Promise<boolean> => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/registrations/records?filter=(activityId="${activityId}" && phone="${phone}")`,
      );
      if (!res.ok) return false;
      const data = (await res.json()) as CheckPhoneResponse;
      return data.totalItems > 0;
    } catch (error) {
      return false;
    }
  };

  const handleFormSubmit = async (data: RegistrationFormData) => {
    setError(null);
    try {
      setIsSubmitting(true);

      // 检查手机号是否已经报名
      const exists = await checkPhoneExists(data.phone);
      if (exists) {
        setError("该手机号码已报名，请勿重复报名");
        return;
      }

      const formData = new FormData();
      formData.append("activityId", activityId);
      formData.append("name", data.name);
      formData.append("phone", data.phone);
      await onSubmit(formData);

      // 显示成功提示
      await Dialog.success("报名成功", "您已成功报名参加活动");

      // 重置表单
      reset();
    } catch (err) {
      // 处理其他类型的错误
      if (err instanceof Error) {
        if (err.message.includes("Failed to create record")) {
          // 可能是并发导致的重复手机号
          const exists = await checkPhoneExists(getValues("phone"));
          if (exists) {
            setError("该手机号码已报名，请勿重复报名");
          } else {
            setError(err.message || "提交失败，请重试");
          }
        } else if (err.message.includes("Network")) {
          setError("网络连接错误，请检查您的网络连接后重试");
        } else if (err.message.includes("timeout")) {
          setError("请求超时，请稍后重试");
        } else if (err.message.includes("Permission")) {
          setError("您没有权限执行此操作");
        } else if (err.message.includes("500")) {
          setError("服务器错误，请联系管理员");
        } else {
          setError(err.message || "提交失败，请重试");
        }
      } else {
        setError("未知错误，请重试");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium">
          姓名
        </label>
        <Input
          id="name"
          {...register("name")}
          placeholder="请输入您的姓名 (2-20字符)"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="mb-2 block text-sm font-medium">
          手机号码
        </label>
        <Input
          id="phone"
          type="tel"
          {...register("phone")}
          placeholder="请输入您的手机号码"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "提交中..." : "提交报名"}
      </Button>
    </form>
  );
}
