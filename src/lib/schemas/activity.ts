import { z } from "zod";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// 配置dayjs使用时区
dayjs.extend(utc);
dayjs.extend(timezone);

// 时区相关
const TIMEZONE = "Asia/Shanghai";
dayjs.tz.setDefault(TIMEZONE);

// 验证模式 - 表单提交时使用的schema
export const activityFormSchema = z
  .object({
    title: z
      .string()
      .min(1, "活动标题不能为空")
      .max(50, "标题不能超过50个字符")
      .trim(),
    content: z.string().min(1, "活动描述不能为空").trim(),
    deadline: z
      .string()
      .min(1, "截止时间不能为空")
      .refine((val) => {
        const date = dayjs(val).tz(TIMEZONE);
        const now = dayjs().tz(TIMEZONE);
        return date.isAfter(now);
      }, "截止时间必须是未来时间"),
    winnersCount: z
      .string()
      .min(1, "中签人数不能为空")
      .refine((val) => !isNaN(Number(val)), "中签人数必须是数字")
      .refine((val) => Number(val) >= 1, "中签人数不能小于1")
      .refine((val) => Number(val) <= 1000, "中签人数不能超过1000人"),
    maxRegistrants: z
      .string()
      .min(1, "最大报名人数不能为空")
      .refine((val) => !isNaN(Number(val)), "最大报名人数必须是数字")
      .refine((val) => Number(val) >= 1, "最大报名人数不能小于1")
      .refine((val) => Number(val) <= 10000, "最大报名人数不能超过10000人"),
    isPublished: z.boolean(),
    creatorId: z.string().min(1, "创建者ID不能为空"),
  })
  .superRefine((data, ctx) => {
    const maxRegistrants = Number(data.maxRegistrants);
    const winnersCount = Number(data.winnersCount);
    if (maxRegistrants < winnersCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "最大报名人数必须大于或等于中签人数",
        path: ["maxRegistrants"],
      });
    }
  });

// 验证模式 - 保存到数据库时使用的schema
export const activityDbSchema = z
  .object({
    title: z
      .string()
      .min(1, "活动标题不能为空")
      .max(50, "标题不能超过50个字符")
      .trim(),
    content: z.string().min(1, "活动描述不能为空").trim(),
    deadline: z
      .string()
      .min(1, "截止时间不能为空")
      .refine((val) => {
        const date = dayjs(val).tz(TIMEZONE);
        const now = dayjs().tz(TIMEZONE);
        return date.isAfter(now);
      }, "截止时间必须是未来时间"),
    winnersCount: z
      .number()
      .min(1, "中签人数不能小于1")
      .max(1000, "中签人数不能超过1000人"),
    maxRegistrants: z
      .number()
      .min(1, "最大报名人数不能小于1")
      .max(10000, "最大报名人数不能超过10000人"),
    isPublished: z.boolean(),
    creatorId: z.string().min(1, "创建者ID不能为空"),
  })
  .refine(
    (data) => {
      return data.maxRegistrants >= data.winnersCount;
    },
    {
      message: "最大报名人数必须大于或等于中签人数",
      path: ["maxRegistrants"],
    },
  );

export type ActivityFormData = z.infer<typeof activityFormSchema>;
export type ActivityDbData = z.infer<typeof activityDbSchema>;
