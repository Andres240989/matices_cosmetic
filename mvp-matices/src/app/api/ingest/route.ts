import { InputLimitError, loadInventory } from "@/pipeline/load-inventory";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const uploads = form.getAll("files").filter((value): value is File => value instanceof File);
  const files = await Promise.all(
    uploads.map(async (file) => ({
      fileName: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
    })),
  );
  try {
    return Response.json(await loadInventory(files));
  } catch (error) {
    if (error instanceof InputLimitError) {
      return Response.json({ message: error.message }, { status: 400 });
    }
    throw error;
  }
}
