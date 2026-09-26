import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('export_jobs').select('id').limit(1);
  return NextResponse.json({ exists: !error || !error.message.includes('does not exist'), error });
}
