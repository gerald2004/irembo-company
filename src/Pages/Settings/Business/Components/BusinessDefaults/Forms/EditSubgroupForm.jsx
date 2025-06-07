/* eslint-disable react/prop-types */
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";

const EditSubgroupForm = ({ subgroup, refetch }) => {
  const axiosPrivate = useAxiosPrivate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      subgroup_name: subgroup?.title || "",
    },
  });


  const onSubmit = async (data) => {
          const controller = new AbortController();

    const submissionData = {
      title: data?.subgroup_name,
    };

    try {
      const response = await axiosPrivate.patch(
        `/settings/accounts/sub/groups/${subgroup.id}`,
        submissionData,
        { signal: controller.signal }
      );
      toast({ title: "Success", description: response?.data?.messages });
      refetch();
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
    <Card className="max-w-lg mx-auto shadow-sm">
      <CardHeader>
        <CardTitle>Edit {subgroup?.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Subgroup Name Input */}
          <div>
            <Label htmlFor="subgroup_name">Subgroup Name</Label>
            <Input
              id="subgroup_name"
              {...register("subgroup_name", {
                required: "Subgroup name is required",
                minLength: {
                  value: 3,
                  message: "Subgroup name must be at least 3 characters",
                },
              })}
            />
            {errors.subgroup_name && (
              <p className="text-sm text-red-500">
                {errors.subgroup_name.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="mt-4">
            {isSubmitting ? "Saving, Please Wait..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditSubgroupForm;
