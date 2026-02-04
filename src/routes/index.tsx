import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Search, Grid3x3, List, Trash2, FileText, Loader2, Package, MoreHorizontal, MoreVertical, Pencil, Copy, Download } from "lucide-react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { ImportDialog } from "@/components/workflow-editor/import-dialog"
import { DashboardExportDialog } from "@/components/workflow-editor/export-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

export const Route = createFileRoute("/")({
  component: DashboardPage,
})

interface WorkflowCardData {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

function DashboardPage() {
  const navigate = useNavigate()
  const [workflows, setWorkflows] = useState<WorkflowCardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [workflowToRename, setWorkflowToRename] = useState<{ id: string, name: string } | null>(null)
  const [newName, setNewName] = useState("")

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [workflowToExport, setWorkflowToExport] = useState<{ id: string, name: string } | null>(null)

  // Load workflows on mount
  useEffect(() => {
    loadWorkflows()
  }, [])

  async function loadWorkflows() {
    if (!window.electron) {
      console.error('[Dashboard] window.electron not available')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await window.electron.listWorkflows()

      if (response.success && response.data) {
        setWorkflows(response.data.map(w => ({
          id: w.id,
          name: w.name,
          createdAt: new Date(w.createdAt),
          updatedAt: new Date(w.updatedAt),
        })))
      } else {
        console.error('[Dashboard] Failed to load workflows:', response.error)
      }
    } catch (error) {
      console.error('[Dashboard] Error loading workflows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNewFile = () => {
    navigate({ to: "/editor/$id", params: { id: 'new' } })
  }

  const handleOpenWorkflow = (id: string) => {
    navigate({ to: "/editor/$id", params: { id } })
  }

  const handleDeleteWorkflow = async (id: string) => {
    if (!window.electron) return

    if (!confirm('Are you sure you want to delete this workflow?')) return

    try {
      const response = await window.electron.deleteWorkflow(id)
      if (response.success) {
        toast.success("Workflow deleted successfully")
        // Reload workflows after deletion
        await loadWorkflows()
      } else {
        console.error('[Dashboard] Failed to delete workflow:', response.error)
        toast.error('Failed to delete workflow')
      }
    } catch (error) {
      console.error('[Dashboard] Error deleting workflow:', error)
      toast.error('Failed to delete workflow')
    }
  }

  const handleDuplicateWorkflow = async (id: string) => {
    if (!window.electron) return
    try {
      const response = await window.electron.duplicateWorkflow(id)
      if (response.success) {
        toast.success("Workflow duplicated successfully")
        await loadWorkflows()
      } else {
        console.error('[Dashboard] Failed to duplicate:', response.error)
        toast.error('Failed to duplicate workflow')
      }
    } catch (error) {
      console.error('[Dashboard] Error duplicating workflow:', error)
      toast.error('Failed to duplicate workflow')
    }
  }

  const handleExportWorkflow = (id: string, name: string) => {
    setWorkflowToExport({ id, name })
    setIsExportDialogOpen(true)
  }

  const openRenameDialog = (workflow: WorkflowCardData) => {
    setWorkflowToRename({ id: workflow.id, name: workflow.name })
    setNewName(workflow.name)
    setIsRenameDialogOpen(true)
  }

  const handleRenameSubmit = async () => {
    if (!window.electron || !workflowToRename) return

    if (!newName.trim()) {
      toast.error("Name cannot be empty")
      return
    }

    try {
      const response = await window.electron.renameWorkflow(workflowToRename.id, newName)
      if (response.success) {
        toast.success("Workflow renamed successfully")
        await loadWorkflows()
        setIsRenameDialogOpen(false)
      } else {
        console.error('[Dashboard] Failed to rename:', response.error)
        toast.error('Failed to rename workflow')
      }
    } catch (error) {
      console.error('[Dashboard] Error renaming workflow:', error)
      toast.error('Failed to rename workflow')
    }
  }

  // Filter workflows by search query
  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    OpenCanvas
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto">
              <ModeToggle />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">My Workflows</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                  <Package className="mr-2 h-4 w-4" /> Import Workflow
                </Button>
                <Button onClick={handleCreateNewFile}>
                  <Plus className="mr-2 h-4 w-4" /> Create New Workflow
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search workflows..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredWorkflows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No workflows found' : 'No workflows yet'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Get started by creating your first workflow'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleCreateNewFile}>
                    <Plus className="mr-2 h-4 w-4" /> Create New Workflow
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {viewMode === 'grid' ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pr-4">
                    {filteredWorkflows.map((workflow) => (
                      <Card
                        key={workflow.id}
                        className="group hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:scale-[1.02]"
                        onClick={() => handleOpenWorkflow(workflow.id)}
                      >
                        {/* Image on top */}
                        <div className="aspect-video bg-muted overflow-hidden relative">
                          <img
                            src={`opencanvas://${workflow.id}/thumbnail`}
                            alt={workflow.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center hidden bg-gradient-to-br from-muted to-muted/80">
                            <FileText className="h-12 w-12 text-muted-foreground/50" />
                          </div>
                          {/* Menu button overlay */}
                          <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 bg-background/80 hover:bg-background backdrop-blur-sm shadow-xs rounded-full"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenWorkflow(workflow.id)}>
                                  <FileText className="mr-2 h-4 w-4" /> Open
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openRenameDialog(workflow)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateWorkflow(workflow.id)}>
                                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportWorkflow(workflow.id, workflow.name)}>
                                  <Download className="mr-2 h-4 w-4" /> Export
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteWorkflow(workflow.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {/* Card content below image */}
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-semibold line-clamp-1">{workflow.name}</CardTitle>
                        </CardHeader>
                        <CardFooter className="pt-0 pb-3 text-xs text-muted-foreground">
                          <div className="flex flex-col gap-0.5">
                            <span>Updated {formatDistanceToNow(workflow.updatedAt, { addSuffix: true })}</span>
                            <span className="text-muted-foreground/60">Created {formatDistanceToNow(workflow.createdAt, { addSuffix: true })}</span>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="pr-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Updated</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWorkflows.map((workflow) => (
                          <TableRow
                            key={workflow.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleOpenWorkflow(workflow.id)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-16 overflow-hidden rounded bg-muted relative flex-shrink-0">
                                  <img
                                    src={`opencanvas://${workflow.id}/thumbnail`}
                                    alt={workflow.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center hidden bg-muted">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                </div>
                                <span>{workflow.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{formatDistanceToNow(workflow.updatedAt, { addSuffix: true })}</TableCell>
                            <TableCell>{formatDistanceToNow(workflow.createdAt, { addSuffix: true })}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenWorkflow(workflow.id) }}>
                                    <FileText className="mr-2 h-4 w-4" /> Open
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openRenameDialog(workflow) }}>
                                    <Pencil className="mr-2 h-4 w-4" /> Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicateWorkflow(workflow.id) }}>
                                    <Copy className="mr-2 h-4 w-4" /> Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleExportWorkflow(workflow.id, workflow.name) }}>
                                    <Download className="mr-2 h-4 w-4" /> Export
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteWorkflow(workflow.id) }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </ScrollArea>
            )}
          </div>
        </div>
      </SidebarInset>
      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
      />
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Workflow</DialogTitle>
            <DialogDescription>
              Enter a new name for your workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameSubmit()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleRenameSubmit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {workflowToExport && (
        <DashboardExportDialog
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          workflowId={workflowToExport.id}
          workflowName={workflowToExport.name}
        />
      )}
    </SidebarProvider>
  )
}
