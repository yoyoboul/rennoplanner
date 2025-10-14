import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { ObjectId } from 'mongodb';
import { getProjectById, getPurchasesByProjectId } from '@/lib/db-mongo';
import { withErrorHandling } from '@/lib/errors';
import { ProjectReportPDF } from '@/lib/pdf-templates/project-report';
import { ShoppingListPDF } from '@/lib/pdf-templates/shopping-list';

// GET /api/projects/:id/export?type=report|shopping-list
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'report';

    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid project ID');
    }

    // Fetch project data
    const project = await getProjectById(id);
    if (!project) {
      throw new Error('Project not found');
    }

    const purchases = await getPurchasesByProjectId(id);

    // Prepare data based on export type
    if (type === 'shopping-list') {
      // Shopping list PDF
      const materiaux = purchases.filter((p) => p.item_type === 'materiaux');
      const meubles = purchases.filter((p) => p.item_type === 'meubles');

      const data = {
        project: {
          name: project.name,
        },
        materiaux: materiaux.map((p) => ({
          item_name: p.item_name,
          quantity: p.quantity,
          unit_price: p.unit_price,
          total_price: p.total_price,
          status: p.status,
          category: p.category,
        })),
        meubles: meubles.map((p) => ({
          item_name: p.item_name,
          quantity: p.quantity,
          unit_price: p.unit_price,
          total_price: p.total_price,
          status: p.status,
          category: p.category,
        })),
        stats: {
          total_items: purchases.length,
          purchased_items: purchases.filter((p) => p.status === 'purchased').length,
          total_cost: purchases.reduce((sum, p) => sum + p.total_price, 0),
          purchased_cost: purchases
            .filter((p) => p.status === 'purchased')
            .reduce((sum, p) => sum + p.total_price, 0),
        },
      };

      const pdfStream = await renderToStream(ShoppingListPDF({ data }));
      const chunks: Buffer[] = [];

      for await (const chunk of pdfStream) {
        chunks.push(Buffer.from(chunk));
      }

      const pdfBuffer = Buffer.concat(chunks);

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="liste-courses-${project.name.replace(/\s+/g, '-')}.pdf"`,
        },
      });
    } else {
      // Project report PDF
      const tasks = project.rooms.flatMap((room) =>
        room.tasks.map((task) => ({
          ...task,
          room_name: room.name,
        }))
      );

      const completedTasks = tasks.filter((t) => t.status === 'completed').length;
      const totalSpent =
        tasks.reduce((sum, t) => sum + (t.actual_cost || 0), 0) +
        purchases.filter((p) => p.status === 'purchased').reduce((sum, p) => sum + p.total_price, 0);

      const data = {
        project: {
          name: project.name,
          description: project.description,
          total_budget: project.total_budget || 0,
          created_at: project.created_at,
        },
        rooms: project.rooms.map((room) => ({
          id: room.id,
          name: room.name,
          surface_area: room.surface_area,
          allocated_budget: room.allocated_budget,
          task_count: room.tasks.length,
        })),
        tasks: tasks.map((task) => ({
          title: task.title,
          room_name: task.room_name,
          status: task.status,
          priority: task.priority,
          category: task.category,
          estimated_cost: task.estimated_cost,
          actual_cost: task.actual_cost,
        })),
        purchases: purchases.map((p) => ({
          item_name: p.item_name,
          quantity: p.quantity,
          unit_price: p.unit_price,
          total_price: p.total_price,
          status: p.status,
          item_type: p.item_type,
        })),
        stats: {
          total_tasks: tasks.length,
          completed_tasks: completedTasks,
          total_budget: project.total_budget || 0,
          total_spent: totalSpent,
          completion_rate: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0,
        },
      };

      const pdfStream = await renderToStream(ProjectReportPDF({ data }));
      const chunks: Buffer[] = [];

      for await (const chunk of pdfStream) {
        chunks.push(Buffer.from(chunk));
      }

      const pdfBuffer = Buffer.concat(chunks);

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="rapport-${project.name.replace(/\s+/g, '-')}.pdf"`,
        },
      });
    }
  });
}

