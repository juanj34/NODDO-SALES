# Feedback Triage — 2026-07-08/09 (Master + equipo BTO)

Fuente: dump de feedback de Master + mensajes de "Manana" (asesora). 20 puntos, 4 frentes.
Decisiones de Master (2026-07-09): (1) TODOS los que editan pueden publicar; (2) Catalina es colaboradora → destrabar creación por rol; (3) visión cotizador 2-modos confirmada.

## Frente 1 — Publicación (causa raíz sistémica) — EN CURSO HOY
| # | Item | Causa confirmada | Estado |
|---|---|---|---|
| 1 | "Los cambios nunca se publican / no sé si se publican" | Micrositio lee snapshot publicado; editor toca tablas vivas; falta señal clara | Fix: banner omnipresente "Cambios sin publicar" + CTA |
| 2 | "El botón publicar no está en todos lados / modo asesora no da opción" | `project.publish` gate = director → asesoras NUNCA ven el botón | Fix: gate → asesor |
| 3 | Precio cambiado a 800M sigue en 670M | (a) sin publicar; (b) precio multi-tipo ambiguo (manda tipología, unidad quedó NULL) | (a) F1; (b) F2b modelo por-tipología-por-casa |
| 4 | "Página de avances no está saliendo" | probable: sin publicar (verificar tras F1) | verificar |
| 5 | "Nada queda live / video ni con URL" | mezcla: publicar + posible bug real de agregar video | F1 + F2 |
| 6 | Catalina no puede crear proyecto | `project.create` gate = administrador; ella es colaboradora | Fix: gate → director (+ Master sube su rol si es asesora) |

## Frente 2 — Bugs editor (batch, investigación lanzada)
| # | Item | Nota |
|---|---|---|
| 7 | Hotspots/puntos de interés: imagen se desplaza al agregar + delay de click + grid de implantación se mueve | probable bug de offset/coordenadas al cargar imagen |
| 8 | Error de scroll en editor del proyecto | reproducir |
| 9 | "Errores a la derecha" al entrar/cargar tipologías | toasts de error — identificar cuáles |
| 10 | Agregar video no permite (archivo ni URL) | error_logs vacío → client-side o 403 silencioso |
| 11 | Avances de obra no se dejaron subir | idem |
| 12 | Disponibilidad de casa y cambios de precios "no funcionan" | verificar tras F1 (publicar) |
| 13 | PDF de cotización abre sacando de NODDO | fix chico: abrir en pestaña nueva (target _blank) — VA EN F1 HOY |

## Frente 2b — Precio multi-tipología (diseño chico)
| 14 | Con 2 tipologías no se puede poner precio por casa | Modelo: `unidad_tipologias.precio_override` (precio de ESA casa en ESA tipología) + UI en inventario. Cubre "casa 15 en M2 = $800M". |

## Frente 3 — Rediseño cotizador (spec propio — visión confirmada)
| 15 | Módulo "recargado, enloquece al asesor" | Simplicidad radical |
| 16 | Modo Estándar: plantillas 1-clic (50-50/40-60/30-70), sin config al cotizar | |
| 17 | Modo Personalizada: fechas año/mes fáciles + cuotas de montos libres (ej. 50% en 5 pagos: 100M marzo, 150M junio…) | |
| 18 | Guardar personalizada como plantilla reutilizable | |
| 19 | Nombre del cliente GRANDE arriba del PDF + restyle completo (frontend-design) | |
| — | Nota: la Calculadora de entrega (etapas) queda como un modo/plantilla más — no se pierde | |

## Frente 4 — Features/límites
| 20 | Límite de creación de proyectos (revisar) | plan Básico max_projects=1 — revisar con Master |
| 21 | Boletín de correos de avances | feature nueva — diseñar |
| 22 | Subir ARCHIVO de video en avances | feature — hoy solo URL? verificar |

## Pendientes previos
- 6 casas contradictorias Índigo (14, 26, 27, 33, 34, 50) esperan lista de esquineras de Master.
- Vistazo de Master al cotizador (casas 3/17) + primera cotización real → primer PDF del worker.
