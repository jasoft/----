"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Phone, Send, AlertCircle } from "lucide-react";
import { Input } from "~/components/ui/input";
import { SubmitButton } from "~/components/ui/submit-button";
import { createRegistration } from "~/app/actions/registration";

// 验证模式
const registrationSchema = z.object({
  name: z
    .string()
    .min(2, "姓名长度不能小于2个字符")
    .max(20, "姓名长度不能超过20个字符")
    .trim()
    .refine((value) => value.trim().length > 0, "姓名不能为空"),
  phone: z
    .string()
    .min(11, "手机号码必须是11位")
    .max(11, "手机号码必须是11位")
    .regex(
      /^1[3-9]\d{9}$/,
      "手机号码格式无效。要求：1. 11位数字 2. 以1开头 3. 第二位在3-9之间 4. 后面是9位数字",
    ),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  activityId: string;
  error?: string | null;
}

export function RegistrationForm({ activityId, error }: RegistrationFormProps) {
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: "onSubmit",
  });

  const onSubmit = async (data: RegistrationFormData) => {
    const formData = new FormData();
    // 将表单数据添加到 FormData 中
    formData.append("name", data.name);
    formData.append("phone", data.phone);
    formData.append("activity", activityId);

    try {
      const result = await createRegistration(activityId, formData);
      if ("redirect" in result) {
        // 成功时客户端重定向
        window.location.href = result.redirect;
      } else if ("error" in result) {
        // 失败时添加错误参数并重载页面
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set("error", result.error);
        window.location.search = searchParams.toString();
      }
    } catch (e) {
      console.error("Registration failed:", e);
      // 发生未预期的错误时显示通用错误消息
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set("error", "报名失败，请稍后重试");
      window.location.search = searchParams.toString();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm"
      data-testid="registration-form"
    >
      {error && (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-4"
          data-testid="registration-error"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-base font-medium text-gray-700 sm:text-sm"
        >
          <div className="flex items-center space-x-2">
            <span>姓名</span>
          </div>
        </label>
        <div className="relative">
          <Input
            {...register("name")}
            id="name"
            name="name"
            data-testid="registration-name"
            aria-invalid={!!errors.name}
            aria-errormessage={errors.name?.message}
            placeholder="请输入您的姓名 (2-20字符)"
            className="pl-10"
          />
          <User className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400 sm:h-4 sm:w-4" />
        </div>
        {errors.name && (
          <div
            className="mt-1 flex items-center space-x-1"
            data-testid="name-error"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 sm:h-3 sm:w-3" />
            <p className="text-base text-red-500 sm:text-sm">
              {errors.name.message}
            </p>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="phone"
          className="mb-2 block text-base font-medium text-gray-700 sm:text-sm"
        >
          <div className="flex items-center space-x-2">
            <span>手机号码</span>
          </div>
        </label>
        <div className="relative">
          <Input
            {...register("phone")}
            id="phone"
            name="phone"
            type="tel"
            data-testid="registration-phone"
            aria-invalid={!!errors.phone}
            aria-errormessage={errors.phone?.message}
            placeholder="请输入您的手机号码"
            className="pl-10"
          />
          <Phone className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400 sm:h-4 sm:w-4" />
        </div>
        {errors.phone && (
          <div
            className="mt-1 flex items-center space-x-1"
            data-testid="phone-error"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 sm:h-3 sm:w-3" />
            <p className="text-base text-red-500 sm:text-sm">
              {errors.phone.message}
            </p>
          </div>
        )}
      </div>

      <SubmitButton
        data-testid="submit-registration"
        className="mt-6 w-full bg-blue-600 shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg focus:ring-blue-500"
        pendingText="⏳ 提交报名中..."
        pending={isSubmitting}
      >
        <div className="flex items-center justify-center space-x-2">
          <Send className="h-5 w-5 sm:h-4 sm:w-4" />
          <span>提交报名</span>
        </div>
      </SubmitButton>
    </form>
  );
}
