import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Grid3x3, List } from "lucide-react"
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

export const Route = createFileRoute("/")({
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()

  const handleCreateNewFile = () => {
    const newId = `workflow-${Date.now()}`
    navigate({ to: "/editor/$id", params: { id: newId } })
  }

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
              <h2 className="text-2xl font-semibold tracking-tight">My files</h2>
              <Button onClick={handleCreateNewFile}>
                <Plus className="mr-2 h-4 w-4" /> Create New File
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search"
                  className="pl-8"
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

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* Empty state - no workflows yet */}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
