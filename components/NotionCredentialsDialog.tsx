import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { Settings, Lock, ExternalLink, HelpCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface NotionCredentialsDialogProps {
  token: string
  database_id: string
  setToken: (token: string) => void
  setDatabase_id: (database_id: string) => void
  showCredentialsDialog: boolean
  setShowCredentialsDialog: (show: boolean) => void
}

export default function NotionCredentialsDialog({
  token,
  database_id,
  setToken,
  setDatabase_id,
  showCredentialsDialog,
  setShowCredentialsDialog,
}: NotionCredentialsDialogProps) {
  const [databaseUrl, setDatabaseUrl] = useState("")
  const [urlError, setUrlError] = useState("")

  const handleSaveCredentials = () => {
    localStorage.setItem("token", token)
    localStorage.setItem("database_id", database_id)
    setShowCredentialsDialog(false)
    toast.success("Connected to Notion!", {
      description: "Your receipts will now be synced to your Notion database.",
    })
  }

  const extractDatabaseId = useCallback((url: string) => {
    const regex = /https:\/\/www\.notion\.so\/(?:[^/]+\/)?([a-zA-Z0-9]+)/
    const match = url.match(regex)
    if (match && match[1]) {
      return match[1]
    }
    return null
  }, [])

  const handleDatabaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setDatabaseUrl(url)
    setUrlError("")

    const extractedId = extractDatabaseId(url)
    if (extractedId) {
      setDatabase_id(extractedId)
    } else if (url.trim() !== "") {
      setUrlError("Invalid Notion database URL. Please check and try again.")
    }
  }

  return (
    <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="text-gray-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Connect to Notion
            <Lock className="h-4 w-4 text-muted-foreground" />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Step 1: Get Integration Token</h3>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => window.open("https://developers.notion.com/docs/create-a-notion-integration#getting-started", "_blank")}
                >
                  Open Notion Integrations
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="secret_xxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create a new integration at Notion and copy the secret token</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-medium ${!token ? "text-muted-foreground" : ""}`}>
                  Step 2: Add Notion Database
                </h3>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() =>
                    window.open(
                      "https://www.notion.so/help/share-your-work#share-with-your-team",
                      "_blank"
                    )
                  }
                >
                  How to share database
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Paste your Notion database URL"
                    value={databaseUrl}
                    onChange={handleDatabaseUrlChange}
                    disabled={!token}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 bg-white"
                        >
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Open your Notion database and copy the URL from your browser&apos;s address bar</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {urlError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{urlError}</AlertDescription>
                  </Alert>
                )}
                {database_id && (
                  <Alert>
                    <AlertDescription>
                      Database ID: <code className="font-mono">{database_id}</code>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleSaveCredentials}
              className="w-full"
              disabled={!token || !database_id}
            >
              Connect to Notion
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Your credentials are only stored locally in your browser
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}