/* eslint-disable react/prop-types */
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const DeleteAccountDialog = ({ username, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputUsername, setInputUsername] = useState("");
  const [confirmationText, setConfirmationText] = useState("");

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      setInputUsername("");
      setConfirmationText("");
    }
  };

  const handleDelete = () => {
    if (
      inputUsername.trim() !== (username || "").trim() ||
      confirmationText.trim().toLowerCase() !== "delete this account"
    ) {
      toast({
        title: "Verification Failed",
        variant: "destructive",
        description: "Please enter the correct group name and confirmation text.",
      });
      return;
    }

    onDelete();
    setIsOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive" onClick={() => setIsOpen(true)}>
          Delete Member Account
        </Button>
      </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Permanently remove this group account and all associated data. This
              action is{" "}
              <span className="text-red-600 font-bold">not reversible</span>.
              Please proceed with caution.
            </DialogDescription>
          </DialogHeader>

          {/* Instructions */}
          <div className="mt-4">
            <p className="text-red-500 font-semibold">
              This action will permanently delete the group and all their records
              including loans, savings, and transactions.
            </p>
          </div>

          {/* Input Fields */}
          <div className="space-y-4 mt-4">
            <div>
              <label htmlFor="username" className="text-sm">
                Enter your member account name{" "}
                <span className="font-bold">{username}</span> to continue:
              </label>
              <Input
                id="username"
                placeholder={`Enter ${username} to continue delete`} 
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmation" className="text-sm">
                To verify, type{" "}
                <span className="font-bold">delete this account</span>{" "}
                below:
              </label>
              <Input
                id="confirmation"
                placeholder="Enter command to continue"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <DialogFooter className="flex justify-end space-x-4 mt-6">
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeleteAccountDialog;
