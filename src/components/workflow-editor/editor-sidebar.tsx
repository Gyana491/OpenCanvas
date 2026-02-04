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
  Search,
  Layers,
  ArrowLeft,
  FileText,
  FolderOpen as FolderIcon,
  Copy,
  Edit3,
  Share2,
  Settings,
  ChevronRight,
  Save,
} from "lucide-react"
import { useNavigate } from "@tanstack/react-router"


interface EditorSidebarProps {
  onSearchClick?: () => void
  onLayersClick?: () => void
  onSave?: () => void
  onImport?: () => void
  isLibraryOpen?: boolean
}

export function EditorSidebar({ onSearchClick, onLayersClick, onSave, onImport, isLibraryOpen }: EditorSidebarProps) {
  const navigate = useNavigate()

  return (
    <div className="flex h-full w-14 flex-col border-r bg-background z-50">
      {/* Logo with Dropdown Menu */}
      <div className="flex h-14 items-center justify-center border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="h-1.5 w-1.5 bg-current" />
                  <div className="h-1.5 w-1.5 bg-current" />
                  <div className="h-1.5 w-1.5 bg-current" />
                  <div className="h-1.5 w-1.5 bg-current" />
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => navigate({ to: '/' })}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSave}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onImport}>
              <FolderIcon className="mr-2 h-4 w-4" />
              Import...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <FileText className="mr-2 h-4 w-4" />
              New File
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FolderIcon className="mr-2 h-4 w-4 shrink-0" />
              <span>Open Recent</span>
              <ChevronRight className="ml-auto h-4 w-4" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit3 className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4 shrink-0" />
              <span>Preferences</span>
              <ChevronRight className="ml-auto h-4 w-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Only Search and Layers icons */}
      <div className="flex flex-col items-center gap-1 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onSearchClick}
          title="Search Nodes"
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 ${isLibraryOpen ? 'bg-accent text-accent-foreground' : ''}`}
          onClick={onLayersClick}
          title="Node Library"
        >
          <Layers className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onImport}
          title="Import"
        >
          <FolderIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onSave}
          title="Save (Cmd+S)"
        >
          <Save className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
