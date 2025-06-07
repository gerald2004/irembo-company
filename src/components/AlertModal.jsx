/* eslint-disable react/prop-types */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AlertModal = ({
  showDialog,
  setShowDialog,
  title,
  message,
  method,
  buttonName,
  modalSize = "425px",
}) => {
  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogTrigger asChild>
        <span></span>
      </AlertDialogTrigger>
      <AlertDialogContent style={{ maxWidth: modalSize }}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowDialog(false)}>
            Cancel
          </AlertDialogCancel>
          {buttonName && (
            <AlertDialogAction onClick={method}>{buttonName}</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AlertModal;
