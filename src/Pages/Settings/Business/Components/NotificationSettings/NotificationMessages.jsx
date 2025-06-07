import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash, Check, X } from "lucide-react";

const NotificationMessages = () => {
  const axiosPrivate = useAxiosPrivate();
  const [editingField, setEditingField] = useState(null);
  const [editedMessages, setEditedMessages] = useState({});

  // ✅ Fetch Notification Messages
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
            const controller = new AbortController();

      const response = await axiosPrivate.get(`/settings/notifications`, {
        signal: controller.signal,
      });
      return response?.data?.data?.notification_messages ?? {};
    },
    keepPreviousData: true,
  });

  // ✅ Update Notification Message (PATCH)
  const updateMutation = useMutation({
    mutationFn: async (updatedData) => {
            const controller = new AbortController();

      return await axiosPrivate.patch(`/settings/notifications`, updatedData, {
        signal: controller.signal,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification updated successfully.",
      });
      refetch();
      setEditingField(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        variant: "destructive",
        description:
          error?.response?.data?.messages || "Failed to update message",
      });
    },
  });

  // ✅ Delete Notification Message (PATCH with null)
  const deleteMutation = useMutation({
    mutationFn: async (field) => {
            const controller = new AbortController();

      return await axiosPrivate.patch(
        `/settings/notifications`,
        {
          [field]: null,
        },
        { signal: controller.signal }
      );
    },
    onSuccess: () => {
      toast({
        title: "Deleted",
        description: "Notification removed successfully.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        variant: "destructive",
        description:
          error?.response?.data?.messages || "Failed to delete message",
      });
    },
  });

  // ✅ Handle Edit Button Click
  const handleEdit = (field, value) => {
    setEditingField(field);
    setEditedMessages({ ...editedMessages, [field]: value });
  };

  // ✅ Handle Save Button Click
  const handleSave = (field) => {
    updateMutation.mutate({ [field]: editedMessages[field] });
  };

  // ✅ Handle Delete Button Click
  const handleDelete = (field) => {
    deleteMutation.mutate(field);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-red-500">Failed to load notification messages.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {Object.entries(data)
        .filter(
          ([key]) =>
            key !== "id" &&
            key !== "sacco_id" &&
            key !== "created_at" &&
            key !== "updated_at"
        )
        .map(([key, value]) => (
          <Card key={key} className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm capitalize">
                {key.replace(/_/g, " ")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingField === key ? (
                <Input
                  value={editedMessages[key] || ""}
                  onChange={(e) =>
                    setEditedMessages({
                      ...editedMessages,
                      [key]: e.target.value,
                    })
                  }
                  className="w-full"
                />
              ) : (
                <p className="text-sm">
                  {value || "No message set"}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {editingField === key ? (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => handleSave(key)}
                    disabled={updateMutation.isLoading}
                  >
                    <Check className="w-4 h-4 mr-1" /> Save
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditingField(null)}
                  >
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(key, value)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(key)}
                    disabled={deleteMutation.isLoading}
                  >
                    <Trash className="w-4 h-4 mr-1" />
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
    </div>
  );
};

export default NotificationMessages;
