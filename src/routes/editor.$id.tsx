import { createFileRoute } from "@tanstack/react-router"
import { WorkflowEditor } from "@/components/workflow-editor"

export const Route = createFileRoute("/editor/$id")({
  component: EditorPage,
})

function EditorPage() {
  const { id } = Route.useParams()

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-background">
      <WorkflowEditor />
    </main>
  )
}
