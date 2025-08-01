import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const secret = searchParams.get('secret');

    // Verify secret (in production, use environment variable)
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    if (tag) {
      // Revalidate specific tag
      revalidateTag(tag);
      console.log(`Revalidated cache tag: ${tag}`);
    } else {
      // Revalidate all weather data
      revalidateTag('weather-data');
      console.log('Revalidated all weather data cache');
    }

    return NextResponse.json(
      {
        revalidated: true,
        tag: tag || 'weather-data',
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Cache-Source': 'manual-revalidation',
        },
      }
    );
  } catch (error) {
    console.error('Cache revalidation error:', error);
    return NextResponse.json(
      { error: 'Cache revalidation failed' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      message: 'Cache revalidation endpoint',
      usage: 'POST /api/cache/revalidate?tag=weather-london&secret=your-secret',
      availableTags: ['weather-data', 'weather-london', 'weather-newyork'],
    },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
