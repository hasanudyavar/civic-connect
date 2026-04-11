import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Only JPG, PNG, WebP allowed.' }, { status: 400 });
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large. Max 5MB.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isDemoMode = !supabaseUrl || supabaseUrl === 'your_supabase_project_url';

    if (isDemoMode) {
      return NextResponse.json({
        success: true,
        data: { path: `demo/uploads/${file.name}` },
      });
    }

    // Upload to Supabase Storage
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `complaints/${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('complaint-images')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { path: data.path },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
