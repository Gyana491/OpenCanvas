import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Grid3x3, List, Trash2, FileText, Loader2 } from "lucide-react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-sidebar"
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
import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"

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
        // Reload workflows after deletion
        await loadWorkflows()
      } else {
        console.error('[Dashboard] Failed to delete workflow:', response.error)
        alert('Failed to delete workflow')
      }
    } catch (error) {
      console.error('[Dashboard] Error deleting workflow:', error)
      alert('Failed to delete workflow')
    }
  }

  // Filter workflows by search query
  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
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
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">My Workflows</h2>
              <Button onClick={handleCreateNewFile}>
                <Plus className="mr-2 h-4 w-4" /> Create New Workflow
              </Button>
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
                <Button variant="ghost" size="icon">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
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
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredWorkflows.map((workflow) => (
                  <Card
                    key={workflow.id}
                    className="group hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleOpenWorkflow(workflow.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-base line-clamp-1">{workflow.name}</CardTitle>
                      <CardDescription>
                        Updated {formatDistanceToNow(workflow.updatedAt, { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <span className="text-xs text-muted-foreground">
                        Created {formatDistanceToNow(workflow.createdAt, { addSuffix: true })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteWorkflow(workflow.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
