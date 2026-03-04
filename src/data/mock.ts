import type { ProyectoCompleto } from "@/types";

export const mockProyecto: ProyectoCompleto = {
  id: "mock-001",
  user_id: "user-001",
  slug: "alto-de-yeguas",
  nombre: "Alto de Yeguas",
  descripcion:
    "Un exclusivo proyecto residencial rodeado de naturaleza, diseñado para quienes buscan vivir con estilo y tranquilidad en Envigado.",
  logo_url: null,
  constructora_nombre: "PROA",
  color_primario: "#C9A96E",
  color_secundario: "#ffffff",
  color_fondo: "#0a0a0a",
  estado: "publicado",
  disclaimer:
    "Todas las imágenes son representaciones artísticas y no tienen ninguna relación con el producto final.",
  whatsapp_numero: "+573001234567",
  ubicacion_direccion: "Circasia, Quindío, Colombia",
  ubicacion_lat: 4.6181,
  ubicacion_lng: -75.6375,
  tour_360_url: "https://my.matterport.com/show/?m=example",
  brochure_url: "/brochure-sample.pdf",
  render_principal_url:
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&q=80",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  tipologias: [
    {
      id: "tipo-a",
      proyecto_id: "mock-001",
      nombre: "Tipo A",
      descripcion:
        "Apartamento de diseño contemporáneo con espacios amplios y luminosos. Ideal para parejas jóvenes.",
      area_m2: 85,
      habitaciones: 3,
      banos: 2,
      precio_desde: 450000000,
      plano_url:
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80",
      renders: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80",
      ],
      orden: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: "tipo-b",
      proyecto_id: "mock-001",
      nombre: "Tipo B",
      descripcion:
        "Apartamento premium con sala de estar amplia, cocina abierta y balcón panorámico. Perfecto para familias.",
      area_m2: 120,
      habitaciones: 3,
      banos: 3,
      precio_desde: 620000000,
      plano_url:
        "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80",
      renders: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=80",
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1920&q=80",
        "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1920&q=80",
      ],
      orden: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: "casa",
      proyecto_id: "mock-001",
      nombre: "Casa",
      descripcion:
        "Casa independiente con jardín privado, terraza y espacios de doble altura. La máxima expresión de confort.",
      area_m2: 180,
      habitaciones: 4,
      banos: 4,
      precio_desde: 980000000,
      plano_url:
        "https://images.unsplash.com/photo-1536895058696-a69a1f4a5274?w=800&q=80",
      renders: [
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1920&q=80",
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=80",
        "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1920&q=80",
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1920&q=80",
      ],
      orden: 2,
      created_at: new Date().toISOString(),
    },
  ],
  galeria_categorias: [
    {
      id: "cat-interiores",
      proyecto_id: "mock-001",
      nombre: "Renders Interiores",
      slug: "renders-interiores",
      orden: 0,
      imagenes: [
        {
          id: "img-int-1",
          categoria_id: "cat-interiores",
          url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&q=80",
          thumbnail_url:
            "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&q=80",
          alt_text: "Sala principal",
          orden: 0,
        },
        {
          id: "img-int-2",
          categoria_id: "cat-interiores",
          url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80",
          thumbnail_url:
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80",
          alt_text: "Cocina abierta",
          orden: 1,
        },
        {
          id: "img-int-3",
          categoria_id: "cat-interiores",
          url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1920&q=80",
          thumbnail_url:
            "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400&q=80",
          alt_text: "Habitación principal",
          orden: 2,
        },
        {
          id: "img-int-4",
          categoria_id: "cat-interiores",
          url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=80",
          thumbnail_url:
            "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&q=80",
          alt_text: "Baño principal",
          orden: 3,
        },
      ],
    },
    {
      id: "cat-exteriores",
      proyecto_id: "mock-001",
      nombre: "Renders Exteriores",
      slug: "renders-exteriores",
      orden: 1,
      imagenes: [
        {
          id: "img-ext-1",
          categoria_id: "cat-exteriores",
          url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80",
          thumbnail_url:
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
          alt_text: "Fachada principal",
          orden: 0,
        },
        {
          id: "img-ext-2",
          categoria_id: "cat-exteriores",
          url: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1920&q=80",
          thumbnail_url:
            "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=400&q=80",
          alt_text: "Entrada del proyecto",
          orden: 1,
        },
        {
          id: "img-ext-3",
          categoria_id: "cat-exteriores",
          url: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=1920&q=80",
          thumbnail_url:
            "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=400&q=80",
          alt_text: "Vista nocturna",
          orden: 2,
        },
      ],
    },
    {
      id: "cat-urbanismo",
      proyecto_id: "mock-001",
      nombre: "Urbanismo",
      slug: "urbanismo",
      orden: 2,
      imagenes: [
        {
          id: "img-urb-1",
          categoria_id: "cat-urbanismo",
          url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80",
          thumbnail_url:
            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80",
          alt_text: "Vista aérea",
          orden: 0,
        },
        {
          id: "img-urb-2",
          categoria_id: "cat-urbanismo",
          url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1920&q=80",
          thumbnail_url:
            "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&q=80",
          alt_text: "Jardines",
          orden: 1,
        },
        {
          id: "img-urb-3",
          categoria_id: "cat-urbanismo",
          url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80",
          thumbnail_url:
            "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80",
          alt_text: "Senderos peatonales",
          orden: 2,
        },
      ],
    },
    {
      id: "cat-social",
      proyecto_id: "mock-001",
      nombre: "Zona Social",
      slug: "zona-social",
      orden: 3,
      imagenes: [
        {
          id: "img-soc-1",
          categoria_id: "cat-social",
          url: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=1920&q=80",
          thumbnail_url:
            "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=400&q=80",
          alt_text: "Piscina",
          orden: 0,
        },
        {
          id: "img-soc-2",
          categoria_id: "cat-social",
          url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80",
          thumbnail_url:
            "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
          alt_text: "Gimnasio",
          orden: 1,
        },
        {
          id: "img-soc-3",
          categoria_id: "cat-social",
          url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920&q=80",
          thumbnail_url:
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
          alt_text: "Zona BBQ",
          orden: 2,
        },
      ],
    },
  ],
  videos: [
    {
      id: "vid-1",
      proyecto_id: "mock-001",
      titulo: "Recorrido Virtual",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnail_url:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=640&q=80",
      orden: 0,
    },
    {
      id: "vid-2",
      proyecto_id: "mock-001",
      titulo: "Avance de Obra",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnail_url:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=640&q=80",
      orden: 1,
    },
  ],
  puntos_interes: [
    {
      id: "poi-1",
      proyecto_id: "mock-001",
      nombre: "Plaza de Mercado y de Ferias Ganaderas",
      descripcion:
        "La plaza de mercado y de ferias ganaderas de Circasia es un centro vital para la economía local, donde tradición y comercio se encuentran.",
      categoria: "Comercio",
      imagen_url:
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
      ciudad: "Circasia",
      lat: 4.617,
      lng: -75.635,
      distancia_km: 2.7,
      tiempo_minutos: 4,
      orden: 0,
    },
    {
      id: "poi-2",
      proyecto_id: "mock-001",
      nombre: "Parque Principal de Circasia",
      descripcion:
        "El corazón del pueblo con su arquitectura colonial, cafés tradicionales y el emblemático cementerio libre.",
      categoria: "Recreación",
      imagen_url:
        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80",
      ciudad: "Circasia",
      lat: 4.6195,
      lng: -75.638,
      distancia_km: 1.2,
      tiempo_minutos: 3,
      orden: 1,
    },
    {
      id: "poi-3",
      proyecto_id: "mock-001",
      nombre: "Hospital San Vicente de Paul",
      descripcion:
        "Centro hospitalario de atención primaria y urgencias al servicio de la comunidad de Circasia y alrededores.",
      categoria: "Salud",
      imagen_url:
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
      ciudad: "Circasia",
      lat: 4.616,
      lng: -75.639,
      distancia_km: 1.8,
      tiempo_minutos: 5,
      orden: 2,
    },
    {
      id: "poi-4",
      proyecto_id: "mock-001",
      nombre: "Institución Educativa Libre",
      descripcion:
        "Institución educativa pública reconocida por su formación integral y su compromiso con la educación de calidad.",
      categoria: "Educación",
      imagen_url:
        "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
      ciudad: "Circasia",
      lat: 4.62,
      lng: -75.641,
      distancia_km: 2.1,
      tiempo_minutos: 6,
      orden: 3,
    },
    {
      id: "poi-5",
      proyecto_id: "mock-001",
      nombre: "Autopista del Café",
      descripcion:
        "Vía principal que conecta el Eje Cafetero, facilitando el acceso a Armenia, Pereira y Manizales.",
      categoria: "Transporte",
      imagen_url:
        "https://images.unsplash.com/photo-1515165562839-978bbcf18277?w=800&q=80",
      ciudad: "Quindío",
      lat: 4.61,
      lng: -75.63,
      distancia_km: 3.5,
      tiempo_minutos: 7,
      orden: 4,
    },
  ],
};
