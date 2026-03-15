import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();

  try {
    // Query appointments con stats de emails
    const { data: appointments, error } = await admin
      .from("appointments")
      .select("id, confirmation_email_sent, reminder_24h_sent, reminder_2h_sent, created_at")
      .order("created_at", { ascending: false })
      .limit(1000); // Últimas 1000 citas

    if (error) throw error;

    const total = appointments?.length ?? 0;

    // Calcular tasas de envío
    const confirmationSent = appointments?.filter((a) => a.confirmation_email_sent).length ?? 0;
    const reminder24hSent = appointments?.filter((a) => a.reminder_24h_sent).length ?? 0;
    const reminder2hSent = appointments?.filter((a) => a.reminder_2h_sent).length ?? 0;

    const confirmationRate = total > 0 ? (confirmationSent / total) * 100 : 0;
    const reminder24hRate = total > 0 ? (reminder24hSent / total) * 100 : 0;
    const reminder2hRate = total > 0 ? (reminder2hSent / total) * 100 : 0;

    // Últimos emails enviados (últimas 50 citas con algún email)
    const recentEmails = appointments
      ?.filter(
        (a) => a.confirmation_email_sent || a.reminder_24h_sent || a.reminder_2h_sent,
      )
      .slice(0, 50)
      .map((a) => ({
        id: a.id,
        created_at: a.created_at,
        confirmation_sent: a.confirmation_email_sent,
        reminder_24h_sent: a.reminder_24h_sent,
        reminder_2h_sent: a.reminder_2h_sent,
      }));

    // Emails por día (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAppointments = appointments?.filter(
      (a) => new Date(a.created_at) >= thirtyDaysAgo,
    );

    // Agrupar por día
    const emailsByDay: Record<string, { confirmation: number; reminder_24h: number; reminder_2h: number }> = {};

    recentAppointments?.forEach((a) => {
      const day = new Date(a.created_at).toISOString().split("T")[0];
      if (!emailsByDay[day]) {
        emailsByDay[day] = { confirmation: 0, reminder_24h: 0, reminder_2h: 0 };
      }
      if (a.confirmation_email_sent) emailsByDay[day].confirmation++;
      if (a.reminder_24h_sent) emailsByDay[day].reminder_24h++;
      if (a.reminder_2h_sent) emailsByDay[day].reminder_2h++;
    });

    const emailsOverTime = Object.entries(emailsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, counts]) => ({
        day,
        ...counts,
        total: counts.confirmation + counts.reminder_24h + counts.reminder_2h,
      }));

    return NextResponse.json({
      total_appointments: total,
      confirmation_sent: confirmationSent,
      confirmation_rate: confirmationRate,
      reminder_24h_sent: reminder24hSent,
      reminder_24h_rate: reminder24hRate,
      reminder_2h_sent: reminder2hSent,
      reminder_2h_rate: reminder2hRate,
      recent_emails: recentEmails,
      emails_over_time: emailsOverTime,
    });
  } catch (error) {
    console.error("Email stats error:", error);
    return NextResponse.json({ error: "Error al obtener stats de emails" }, { status: 500 });
  }
}
