import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // مفاتيح الاتصال بـ Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // عمل اسم فريد للملف
    const uniqueName = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;

    // الرفع لمخزن sops
    const { error } = await supabase.storage
      .from("sops")
      .upload(uniqueName, buffer, {
        contentType: file.type,
      });

    if (error) {
      throw error;
    }

    // استخراج الرابط المباشر للملف
    const { data: publicUrlData } = supabase.storage
      .from("sops")
      .getPublicUrl(uniqueName);

    return NextResponse.json({ path: publicUrlData.publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}