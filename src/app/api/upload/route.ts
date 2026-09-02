import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const requestedBucket = (formData.get("bucket") as string) || "sops";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // مفاتيح الاتصال بـ Supabase
    const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseUrl = rawSupabaseUrl.startsWith("http") ? rawSupabaseUrl : `https://${rawSupabaseUrl}`;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // عمل اسم فريد للملف
    const uniqueName = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;

    // الرفع للمخزن المحدد (مثل result-drafts أو sops)
    const { error } = await supabase.storage
      .from(requestedBucket)
      .upload(uniqueName, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error(`Supabase storage upload error (bucket: ${requestedBucket}):`, error);
      throw error;
    }

    // استخراج الرابط المباشر للملف
    const { data: publicUrlData } = supabase.storage
      .from(requestedBucket)
      .getPublicUrl(uniqueName);

    return NextResponse.json({ 
      path: publicUrlData.publicUrl,
      url: publicUrlData.publicUrl,
      fileName: uniqueName
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error?.message || "Failed to upload file" }, { status: 500 });
  }
}