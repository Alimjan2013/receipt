import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Settings } from "lucide-react";

interface NotionCredentialsDialogProps {
  token: string;
  database_id: string;
  setToken: (token: string) => void;
  setDatabase_id: (database_id: string) => void;
  showCredentialsDialog: boolean;
  setShowCredentialsDialog: (show: boolean) => void;
}

export default function NotionCredentialsDialog({
  token,
  database_id,
  setToken,
  setDatabase_id,
  showCredentialsDialog,
  setShowCredentialsDialog,
}: NotionCredentialsDialogProps) {
  const handleSaveCredentials = () => {
    localStorage.setItem("token", token);
    localStorage.setItem("database_id", database_id);
    setShowCredentialsDialog(false);
    toast.success("Credentials saved", {
      description: "Your Notion credentials have been saved.",
    });
  };

  return (
    <Dialog
      open={showCredentialsDialog}
      onOpenChange={setShowCredentialsDialog}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="text-gray-600" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notion Credentials</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Input
            type="text"
            placeholder="Enter Notion Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Enter Database ID"
            value={database_id}
            onChange={(e) => setDatabase_id(e.target.value)}
          />
          <Button onClick={handleSaveCredentials} className="w-full">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
