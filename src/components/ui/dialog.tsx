"use client";

import Swal from "sweetalert2";
import type { SweetAlertResult } from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

type AlertIcon = "success" | "error" | "warning" | "info";
type ConfirmIcon = "warning" | "question";

// 创建支持React内容的Swal实例
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const ReactSwal = withReactContent(Swal);

// Alert 类型对话框
export const showAlert = (
  title: string,
  text?: string,
  icon: AlertIcon = "info",
): Promise<SweetAlertResult<unknown>> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  return ReactSwal.fire({
    title,
    text,
    icon,
  });
};

// Confirm 类型对话框
export const showConfirm = async (
  title: string,
  text: string,
  confirmButtonText = "确认",
  cancelButtonText = "取消",
  icon: ConfirmIcon = "warning",
): Promise<boolean> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const result = await ReactSwal.fire({
      title,
      text,
      icon,
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
      focusConfirm: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    return Boolean(result.isConfirmed);
  } catch {
    return false;
  }
};

// 自定义模态框
export const showModal = (
  title: string,
  html: string,
  confirmButtonText = "确认",
  showCancelButton = false,
): Promise<SweetAlertResult<unknown>> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  return ReactSwal.fire({
    title,
    html,
    confirmButtonText,
    showCancelButton,
  });
};

// 快捷方法
export const Dialog = {
  // 成功提示
  success(title: string, text?: string): Promise<SweetAlertResult<unknown>> {
    return showAlert(title, text, "success");
  },

  // 错误提示
  error(title: string, text?: string): Promise<SweetAlertResult<unknown>> {
    return showAlert(title, text, "error");
  },

  // 警告提示
  warning(title: string, text?: string): Promise<SweetAlertResult<unknown>> {
    return showAlert(title, text, "warning");
  },

  // 信息提示
  info(title: string, text?: string): Promise<SweetAlertResult<unknown>> {
    return showAlert(title, text, "info");
  },

  // 删除确认
  confirm(title: string, text: string): Promise<boolean> {
    return showConfirm(title, text, "确认", "取消", "warning");
  },

  // 自定义确认
  customConfirm(
    title: string,
    text: string,
    confirmText = "确认",
    cancelText = "取消",
  ): Promise<boolean> {
    return showConfirm(title, text, confirmText, cancelText, "question");
  },

  // 自定义模态框
  modal(title: string, content: string): Promise<SweetAlertResult<unknown>> {
    return showModal(title, content);
  },
};

export default Dialog;
