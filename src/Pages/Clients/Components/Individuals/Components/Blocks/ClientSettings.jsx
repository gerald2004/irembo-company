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
import DeleteAccountDialog from "./DeleteAccountDialog";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";
const ClientSettings = () => {
  const { id } = useParams();
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { auth } = useAuth();
  const roles = auth?.roles;
  // ✅ Fetch Client Settings
  const {
    data: clientSettings,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["clientSettings", id],
    queryFn: async () => {
      const controller = new AbortController();
      const response = await axiosPrivate.get(`/clients/individual/${id}`, {
        signal: controller.signal,
      });
      return response.data.data.client || {};
    },
  });

  // ✅ Update Settings Mutation
  const updateSettingMutation = useMutation({
    mutationFn: async (updates) => {
      setLoading(true);
      const controller = new AbortController();
      const response = await axiosPrivate.patch(
        `/clients/individual/${id}`,
        updates,
        { signal: controller.signal }
      );
      return response.data.data.client;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Settings updated successfully.",
      });
      queryClient.invalidateQueries(["clientSettings", id]);
    },
    onError: () => {
      toast({
        title: "Error",
        variant: "destructive",
        description: "Failed to update settings.",
      });
    },
    onSettled: () => setLoading(false),
  });

  // ✅ Reset PIN/Password Mutation (Updated to match backend API)
  const resetMutation = useMutation({
    mutationFn: async (type) => {
      setLoading(true);
      const payload =
        type === "client_password"
          ? { reset_password: true }
          : { reset_pin: true };
      const controller = new AbortController();
      await axiosPrivate.patch(`/clients/individual/${id}`, payload, {
        signal: controller.signal,
      });
      return type;
    },
    onSuccess: (type) => {
      const message =
        type === "client_password"
          ? "Password reset successfully. Check phone for new password."
          : "PIN reset successfully. Check phone for new PIN.";
      toast({ title: "Success", description: message });
    },
    onError: () => {
      toast({
        title: "Error",
        variant: "destructive",
        description: "Failed to reset.",
      });
    },
    onSettled: () => setLoading(false),
  });

  // ✅ Handle Switch Toggle
  const handleToggle = (key, value) => {
    updateSettingMutation.mutate({ [key]: value ? "yes" : "no" });
  };

  const handleToggleStatus = (key, value) => {
    updateSettingMutation.mutate({ [key]: value ? "active" : "inactive" });
  };
  const handelDelete = async () => {
    const controller = new AbortController();
    try {
      const response = await axiosPrivate.delete(`/clients/individual/${id}`, {
        signal: controller.signal,
      });
      toast({
        title: "Success",
        description: response.data.messages,
      });

      navigate("/clients");
    } catch (error) {
      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: errorMessage,
      });
    }
  };
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Client Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p>Loading...</p>
          ) : isError ? (
            <p className="text-red-500">Error loading settings.</p>
          ) : clientSettings ? (
            <>
              {/* ✅ Client Status */}
              <div className="flex text-sm justify-between items-center">
                <span>Client Status (Inactive/Active)</span>
                <Switch
                  checked={clientSettings.client_status === "active"}
                  onCheckedChange={(val) =>
                    handleToggleStatus("client_status", val)
                  }
                />
              </div>

              {/* ✅ Other Settings (Yes/No) */}
              {[
                "client_email_status",
                "client_sms_status",
                "client_mobile_banking_status",
                "client_can_login_portal_app",
              ].map((key) => (
                <div
                  key={key}
                  className="flex text-sm capitalize justify-between items-center"
                >
                  <span>{key.replace(/_/g, " ")}</span>
                  <Switch
                    checked={clientSettings[key] === "yes"}
                    onCheckedChange={(val) => handleToggle(key, val)}
                  />
                </div>
              ))}
            </>
          ) : (
            <p>No settings found.</p>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {hasPermission(roles, 100031) && (
            <Button
              variant="outline"
              onClick={() => resetMutation.mutate("client_password")}
              disabled={loading}
            >
              Reset Password
            </Button>
          )}
          {hasPermission(roles, 100032) && (
            <Button
              variant="default"
              onClick={() => resetMutation.mutate("client_pin")}
              disabled={loading}
            >
              Reset PIN
            </Button>
          )}
          {hasPermission(roles, 100010) && (
            <DeleteAccountDialog
              username={`${clientSettings?.client_firstname} ${clientSettings?.client_lastname}`}
              onDelete={handelDelete}
            />
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ClientSettings;
