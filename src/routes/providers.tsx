import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createFileRoute } from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { ModeToggle } from "@/components/mode-toggle"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { getGoogleApiKey, saveGoogleApiKey, removeGoogleApiKey } from "@/lib/utils/api-keys"
import { toast } from "sonner"

export const Route = createFileRoute("/providers")({
    component: ProvidersPage,
})

function ProvidersPage() {
    const [apiKey, setApiKey] = useState(getGoogleApiKey() || "")

    const handleSave = () => {
        try {
            if (apiKey.trim()) {
                saveGoogleApiKey(apiKey.trim())
                toast.success("Google API key saved successfully!")
            } else {
                removeGoogleApiKey()
                toast.success("Google API key removed")
            }
        } catch (error) {
            toast.error("Failed to save API key")
        }
    }

    const handleRemove = () => {
        removeGoogleApiKey()
        setApiKey("")
        toast.success("Google API key removed")
    }

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
                                    <BreadcrumbPage>Providers</BreadcrumbPage>
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
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">API Providers</h2>
                            <p className="text-sm text-muted-foreground">
                                Configure your API keys to enable AI features
                            </p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Google AI</CardTitle>
                                <CardDescription>
                                    Configure your Google AI API key to use Imagen, Gemini, and Veo models
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="google-api-key">API Key</Label>
                                    <Input
                                        id="google-api-key"
                                        type="password"
                                        placeholder="Enter your Google AI API key"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Get your API key from{" "}
                                        <a
                                            href="https://aistudio.google.com/apikey"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            Google AI Studio
                                        </a>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleSave}>Save API Key</Button>
                                    {getGoogleApiKey() && (
                                        <Button variant="destructive" onClick={handleRemove}>
                                            Remove API Key
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
