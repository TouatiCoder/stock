import { NextResponse } from "next/server"
import { materialService } from "@/lib/services/materialService"
import { checkAuth } from "@/lib/auth/auth-utils"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projectId = params.id
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const materials = await materialService.getProjectMaterials(projectId)
    
    return NextResponse.json(materials)
  } catch (error) {
    console.error("Error fetching project materials:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}
