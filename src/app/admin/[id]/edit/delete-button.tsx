"use client";

import { useFormStatus } from "react-dom";
import { deleteActivity } from "~/app/actions/activity";
import { Dialog } from "~/components/ui/dialog";

interface DeleteButtonProps {
  id: string;
}

function DeleteButton({ id }: DeleteButtonProps) {
  const { pending } = useFormStatus();

  const handleClick = async () => {
    const confirmed = await Dialog.confirm(
      "确认删除活动",
      "此操作将永久删除该活动及其所有相关数据，确定要继续吗？",
    );

    if (!confirmed) {
      return;
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/admin/activity/delete";

    const idInput = document.createElement("input");
    idInput.type = "hidden";
    idInput.name = "id";
    idInput.value = id;

    form.appendChild(idInput);
    form.action = deleteActivity.name;
    form.requestSubmit();
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
