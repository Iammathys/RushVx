import { NextResponse } from 'next/server';
import validators from '@/config/validators.platforms.json';

export async function GET() {
  return NextResponse.json(validators);
}
