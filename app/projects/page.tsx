import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import ProjectsPageClient from './page.client';

export default async function ProjectsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string; search?: string; status?: string; type?: string }> 
}) {
  const user = await checkAuth();
  if (!user) redirect("/login");

  const searchParamsObj = await searchParams;
  const page = parseInt(searchParamsObj.page || '1') || 1;
  const searchTerm = searchParamsObj.search || '';
  const filterStatus = searchParamsObj.status || 'all';
  const filterType = searchParamsObj.type || 'all';
  const pageSize = 20;


  const whereClause: any = { companyId: user.companyId };
  if (searchTerm) {
    whereClause.OR = [
      { name: { contains: searchTerm } },
      { clientName: { contains: searchTerm } },
      { projectType: { contains: searchTerm } },
      { address: { contains: searchTerm } },
      { city: { contains: searchTerm } },
      { postalCode: { contains: searchTerm } },
    ];
  }
  if (filterStatus !== 'all') {
    whereClause.status = filterStatus;
  }
  if (filterType !== 'all') {
    if (filterType === 'Other') {
      whereClause.projectType = {
        notIn: ['R+2', 'Villa', 'Immeuble', 'Commercial', 'Industrial']
      };
    } else {
      whereClause.projectType = filterType;
    }
  }

  // Fetch projects with filtering and pagination
  const [projects, totalProjects, projectTypes] = await Promise.all([
    db.project.findMany({
      where: whereClause,
      include: {
        siteManager: true,
        structuralEngineer: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.project.count({ where: whereClause }),
    db.project.findMany({
      where: {
        companyId: user.companyId,
        projectType: {
          not: null,
        },
      },
      select: {
        projectType: true,
      },
      distinct: ["projectType"],
      orderBy: {
        projectType: "asc",
      },
    }),
  ]);

  // Convert Prisma Decimal types to numbers
  const convertedProjects = projects.map(project => ({
    ...project,
    totalBudget: project.totalBudget ? Number(project.totalBudget) : null,
    currentCost: project.currentCost ? Number(project.currentCost) : null,
  }));

  const totalPages = Math.ceil(totalProjects / pageSize);

  // Calculate stats
  const [stats, aggregations] = await Promise.all([
    db.project.groupBy({
      by: ['status'],
      where: { companyId: user.companyId },
      _count: true,
    }),
    db.project.aggregate({
      where: { companyId: user.companyId },
      _sum: {
        totalBudget: true,
        currentCost: true,
      },
    })
  ]);

  const statsMap: Record<string, number> = {};
  stats.forEach(stat => {
    statsMap[stat.status] = stat._count;
  });

  const totalBudget = Number(aggregations._sum.totalBudget) || 0;
  const totalCost = Number(aggregations._sum.currentCost) || 0;
  const budgetUsage = totalBudget > 0 ? (totalCost / totalBudget) * 100 : 0;

  // For overBudgetCount, we would need to check individual projects
  // For now setting to 0 to avoid fetching all projects
  const overBudgetCount = 0;

  const initialStats = {
    total: totalProjects,
    active: statsMap.active || 0,
    planning: statsMap.planning || 0,
    completed: statsMap.completed || 0,
    paused: statsMap.paused || 0,
    cancelled: statsMap.cancelled || 0,
    totalBudget,
    totalCost,
    overBudgetCount,
    budgetUsage: Math.round(budgetUsage),
  };

  return (
    <ProjectsPageClient
      initialProjects={convertedProjects}
      initialStats={initialStats}
      projectTypes={projectTypes.map((item) => item.projectType).filter(Boolean) as string[]}
      totalProjects={totalProjects}
      currentPage={page}
      totalPages={totalPages}
      initialSearch={searchTerm}
      initialStatus={filterStatus}
      initialType={filterType}
    />
  );
}
