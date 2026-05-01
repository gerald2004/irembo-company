import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const DeleteJointDialog = ({ accountName, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [inputName, setInputName] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleDelete = () => {
    if (inputName !== accountName || confirm !== "delete this account") {
      toast({ title: "Error", variant: "destructive", description: "Verification failed." });
      return;
    }
    onDelete();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Joint Account</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Joint Account</DialogTitle>
          <DialogDescription>
            This will permanently remove the joint account and all associated data.
            This action is <span className="text-red-600 font-bold">not reversible</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm">
              Enter account name <span className="font-bold">{accountName}</span> to continue:
            </label>
            <Input
              placeholder={`Enter ${accountName}`}
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm">
              Type <span className="font-bold">delete this account</span> to confirm:
            </label>
            <Input
              placeholder="delete this account"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-2 mt-6">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const JointSettings = () => {
  const { id } = useParams();
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { auth } = useAuth();
  const roles = auth?.roles;

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ["joint-account-settings", id],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/clients/joint-account/${id}`);
      return res.data.data.client || {};
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      setLoading(true);
      const res = await axiosPrivate.patch(`/clients/joint-account/${id}`, updates);
      return res.data.data.client;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Settings updated successfully." });
      queryClient.invalidateQueries(["joint-account-settings", id]);
      queryClient.invalidateQueries(["joint-account-client", id]);
    },
    onError: () => {
      toast({ title: "Error", variant: "destructive", description: "Failed to update settings." });
    },
    onSettled: () => setLoading(false),
  });

  const handleToggle = (key, value) => updateMutation.mutate({ [key]: value ? "yes" : "no" });
  const handleToggleStatus = (key, value) => updateMutation.mutate({ [key]: value ? "active" : "inactive" });

  const handleDelete = async () => {
    try {
      const res = await axiosPrivate.delete(`/clients/joint-account/${id}`);
      toast({ title: "Success", description: res.data.messages });
      navigate("/clients");
    } catch (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: error?.response?.data?.messages || "Failed to delete.",
      });
    }
  };

  const primaryName = [
    settings?.client_firstname,
    settings?.client_lastname,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="max-w-4xl mx-auto p-5">
      <Card>
        <CardHeader>
          <CardTitle>Joint Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : isError ? (
            <p className="text-sm text-red-500">Error loading settings.</p>
          ) : settings ? (
            <>
              <div className="flex text-sm justify-between items-center py-1">
                <span>Account Status (Inactive / Active)</span>
                <Switch
                  checked={settings.client_status === "active"}
                  onCheckedChange={(val) => handleToggleStatus("client_status", val)}
                  disabled={loading}
                />
              </div>
              {[
                "client_email_status",
                "client_sms_status",
                "client_mobile_banking_status",
                "client_can_login_portal_app",
              ].map((key) => (
                <div key={key} className="flex text-sm capitalize justify-between items-center py-1">
                  <span>{key.replace(/_/g, " ")}</span>
                  <Switch
                    checked={settings[key] === "yes"}
                    onCheckedChange={(val) => handleToggle(key, val)}
                    disabled={loading}
                  />
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm">No settings found.</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {hasPermission(roles, 100031) && (
            <Button
              variant="outline"
              onClick={() => updateMutation.mutate({ reset_password: true })}
              disabled={loading}
            >
              Reset Password
            </Button>
          )}
          {hasPermission(roles, 100010) && (
            <DeleteJointDialog accountName={primaryName} onDelete={handleDelete} />
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default JointSettings;
