import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for server-side access
);

// MCP Server for NODDO
const server = new Server(
  {
    name: "noddo-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool: Search FAQs
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_faqs",
        description:
          "Busca en las preguntas frecuentes de NODDO. Usa esto cuando el usuario tiene una pregunta sobre cómo usar la plataforma.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "La pregunta o tema a buscar",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_project_info",
        description:
          "Obtiene información de un proyecto específico (nombre, ubicación, tipologías, estado)",
        inputSchema: {
          type: "object",
          properties: {
            project_slug: {
              type: "string",
              description: "El slug del proyecto (ejemplo: ciudadela-senderos)",
            },
          },
          required: ["project_slug"],
        },
      },
      {
        name: "check_unit_availability",
        description:
          "Consulta la disponibilidad de unidades en un proyecto. Retorna cuántas disponibles, reservadas, vendidas.",
        inputSchema: {
          type: "object",
          properties: {
            project_slug: {
              type: "string",
              description: "El slug del proyecto",
            },
          },
          required: ["project_slug"],
        },
      },
      {
        name: "create_lead",
        description:
          "Crea un lead cuando un usuario quiere ser contactado. Captura nombre, email, teléfono, mensaje.",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "UUID del proyecto",
            },
            nombre: {
              type: "string",
              description: "Nombre completo del prospecto",
            },
            email: {
              type: "string",
              description: "Email del prospecto",
            },
            telefono: {
              type: "string",
              description: "Teléfono del prospecto",
            },
            mensaje: {
              type: "string",
              description: "Mensaje o consulta del prospecto",
            },
          },
          required: ["project_id", "nombre", "email"],
        },
      },
      {
        name: "get_help_article",
        description:
          "Obtiene el contenido completo de un artículo de ayuda específico por categoría y slug",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description:
                "Categoría del artículo: dashboard, proyecto, contenido, ajustes, flujos",
            },
            slug: {
              type: "string",
              description:
                "Slug del artículo (ejemplo: crear-proyecto, subir-imagenes)",
            },
          },
          required: ["category", "slug"],
        },
      },
    ],
  };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_faqs": {
        const query = String(args.query).toLowerCase();

        // Search in FAQ data (you'd load from noddo-faq.md or DB)
        const faqResults = await searchFAQs(query);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(faqResults, null, 2),
            },
          ],
        };
      }

      case "get_project_info": {
        const { project_slug } = args as { project_slug: string };

        const { data: project, error } = await supabase
          .from("proyectos")
          .select(
            `
            id,
            nombre,
            slug,
            ubicacion_ciudad,
            ubicacion_pais,
            descripcion,
            estado,
            whatsapp_numero,
            created_at
          `
          )
          .eq("slug", project_slug)
          .single();

        if (error || !project) {
          return {
            content: [
              {
                type: "text",
                text: `No encontré el proyecto "${project_slug}". ¿Puedes verificar el nombre?`,
              },
            ],
          };
        }

        // Get tipologías
        const { data: tipologias } = await supabase
          .from("tipologias")
          .select("nombre, area, habitaciones, banos, precio_desde")
          .eq("proyecto_id", project.id);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  proyecto: project,
                  tipologias: tipologias || [],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "check_unit_availability": {
        const { project_slug } = args as { project_slug: string };

        const { data: project } = await supabase
          .from("proyectos")
          .select("id")
          .eq("slug", project_slug)
          .single();

        if (!project) {
          return {
            content: [
              {
                type: "text",
                text: `Proyecto "${project_slug}" no encontrado`,
              },
            ],
          };
        }

        const { data: unidades } = await supabase
          .from("unidades")
          .select("estado")
          .eq("proyecto_id", project.id);

        const stats = {
          disponibles: unidades?.filter((u) => u.estado === "disponible")
            .length,
          reservadas: unidades?.filter((u) => u.estado === "reservada").length,
          vendidas: unidades?.filter((u) => u.estado === "vendida").length,
          total: unidades?.length || 0,
        };

        return {
          content: [
            {
              type: "text",
              text: `📊 Disponibilidad actual:\n- Disponibles: ${stats.disponibles}\n- Reservadas: ${stats.reservadas}\n- Vendidas: ${stats.vendidas}\n- Total unidades: ${stats.total}`,
            },
          ],
        };
      }

      case "create_lead": {
        const { project_id, nombre, email, telefono, mensaje } = args as {
          project_id: string;
          nombre: string;
          email: string;
          telefono?: string;
          mensaje?: string;
        };

        const { data: lead, error } = await supabase
          .from("leads")
          .insert({
            proyecto_id: project_id,
            nombre,
            email,
            telefono: telefono || null,
            mensaje: mensaje || "Contacto desde Hugo AI",
            origen: "hugo-ai-chat",
            utm_source: "hugo-ai",
          })
          .select()
          .single();

        if (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error al crear el lead: ${error.message}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `✅ Lead creado exitosamente. Un asesor se contactará pronto con ${nombre} al ${email}`,
            },
          ],
        };
      }

      case "get_help_article": {
        const { category, slug } = args as { category: string; slug: string };

        // In production, you'd fetch from a DB or file system
        // For now, return a mock response
        return {
          content: [
            {
              type: "text",
              text: `Artículo de ayuda: ${category}/${slug}\n\n(Aquí iría el contenido completo del artículo)`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Simple FAQ search (in production, use embeddings or full-text search)
interface FAQResult {
  pregunta: string;
  respuesta: string;
  categoria?: string;
}

async function searchFAQs(query: string): Promise<FAQResult[]> {
  // Load FAQ data from noddo-faq.md
  // For now, return sample results
  const sampleFAQs = [
    {
      pregunta: "¿Cómo publico mi proyecto?",
      respuesta:
        "Para publicar: 1) Editor → Configuración, 2) Tab Publicación, 3) Verifica checklist, 4) Click Publicar Proyecto",
      categoria: "proyectos",
    },
    {
      pregunta: "¿Cómo subo imágenes?",
      respuesta:
        "Ve a Editor → Galería → Agregar Imágenes. Arrastra archivos JPG o PNG (max 10MB)",
      categoria: "contenido",
    },
  ];

  // Simple keyword matching
  return sampleFAQs.filter(
    (faq) =>
      faq.pregunta.toLowerCase().includes(query) ||
      faq.respuesta.toLowerCase().includes(query)
  );
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("NODDO MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
