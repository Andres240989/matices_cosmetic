import { ZodError } from "zod";
import { runAnalysis } from "@/pipeline/run-analysis";

export async function POST(request: Request): Promise<Response> {
  try {
    return Response.json(runAnalysis(await request.json()));
  } catch (error) {
    const message =
      error instanceof ZodError
        ? "La solicitud de análisis no es válida: revisa la fecha de análisis y las reglas."
        : error instanceof Error
          ? error.message
          : "No se pudo analizar.";
    return Response.json({ message }, { status: 400 });
  }
}
