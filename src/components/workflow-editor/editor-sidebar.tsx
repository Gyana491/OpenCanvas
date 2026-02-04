"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Search,
  Layers,
  ArrowLeft,
  FileText,
  FolderOpen as FolderIcon,
  Copy,
  Edit3,
  ChevronRight,
  ChevronDown,
  Save,
  Workflow,
  Download,
  Trash2,
} from "lucide-react"
import { useNavigate } from "@tanstack/react-router"


interface EditorSidebarProps {
  onSearchClick?: () => void
  onLayersClick?: () => void
  onSave?: () => void
  onBackToDashboard?: () => void
  onDuplicate?: () => void
  onRename?: () => void
  onExport?: () => void
  onDelete?: () => void
  onNew?: () => void
  isLibraryOpen?: boolean
}

export function EditorSidebar({
  onSearchClick,
  onLayersClick,
  onSave,
  onBackToDashboard,
  onDuplicate,
  onRename,
  onExport,
  onDelete,
  onNew,
  isLibraryOpen
}: EditorSidebarProps) {
  const navigate = useNavigate()

  return (
    <div className="flex h-full w-14 flex-col border-r bg-background z-50">
      {/* Logo with Dropdown Menu */}
      <div className="flex h-14 items-center justify-center border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 gap-1 data-[state=open]:bg-accent px-0">
              <Workflow className="size-5" />
              <ChevronDown className="size-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={onBackToDashboard || (() => navigate({ to: '/' }))}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSave}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onNew}>
              <FileText className="mr-2 h-4 w-4" />
              New File
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRename}>
              <Edit3 className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive hover:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Only Search and Layers icons */}
      <div className="flex flex-col items-center gap-1 py-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onSearchClick}
            >
              <Search className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Search Nodes</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 ${isLibraryOpen ? 'bg-accent text-accent-foreground' : ''}`}
              onClick={onLayersClick}
            >
              <Layers className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Node Library</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onSave}
            >
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Save (Cmd+S)</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
