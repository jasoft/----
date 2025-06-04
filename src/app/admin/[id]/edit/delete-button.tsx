"use client";

import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { deleteActivity } from "~/app/actions/activity";
import { Dialog } from "~/components/ui/dialog";

interface DeleteButtonProps {
  id: string;
}

function DeleteButton({ id }: DeleteButtonProps) {
  const { pending } = useFormStatus();
  const router = useRouter();

  const handleClick = async () => {
    try {
      const confirmed = await Dialog.confirm(
        "确认删除活动",
        "此操作将永久删除该活动及其所有相关数据，确定要继续吗？",
      );

      if (!confirmed) {
        return;
      }

      // 使用FormData调用Server Action
      const formData = new FormData();
      formData.set("id", id);
      await deleteActivity(formData);

      // 使用replace而不是push，避免浏览器历史记录中保留已删除的页面
      router.replace("/admin");
    } catch (err) {
      // 具体化错误类型
      const message =
        err instanceof Error ? err.message : "删除活动失败，请重试";
      await Dialog.error("删除失败", message);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="btn btn-error"
      disabled={pending}
      data-testid="delete-activity"
    >
      {pending ? "删除中..." : "删除活动"}
    </button>
  );
}

export { DeleteButton };
