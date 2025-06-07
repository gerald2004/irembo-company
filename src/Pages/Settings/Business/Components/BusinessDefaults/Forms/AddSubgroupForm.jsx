/* eslint-disable react/prop-types */
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
const AddSubgroupForm = ({ parentGroup, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm();

  const onSubmit = async (data) => {
          const controller = new AbortController();

    const subgroupData = {
      title: data.subgroupName,
      code: data.code,
      groupid: parentGroup.id, 
    };

    try {
      const response = await axiosPrivate.post(
        `/settings/accounts/sub/groups`,
        subgroupData,
        { signal: controller.signal }
      );
      toast({ title: "Success", description: response?.data?.messages });
      reset();
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
        <CardTitle>Add Sub-group to {parentGroup.account_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Subgroup Name */}
          <div>
            <Label htmlFor="subgroupName">Subgroup Name</Label>
            <Input
              id="subgroupName"
              placeholder="Enter subgroup name"
              {...register("subgroupName", {
                required: "Subgroup Name is required",
              })}
            />
            {errors.subgroupName && (
              <p className="text-red-500 text-sm">
                {errors.subgroupName.message}
              </p>
            )}
          </div>

          {/* Subgroup Code */}
          <div>
            <Label htmlFor="code">Subgroup Code</Label>
            <Input
              id="code"
              // value={subgroupCode}
              {...register("code")}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="mt-4">
            {isSubmitting ? "Saving Please Wait..." : "Save Subgroup"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddSubgroupForm;
