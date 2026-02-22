import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;

  if (!q) {
    return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'YOUTUBE_DATA_API_KEY is not configured',
        items: [],
      },
      { status: 503 }
    );
  }

  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('type', 'channel');
  searchUrl.searchParams.set('maxResults', '10');
  searchUrl.searchParams.set('q', q);
  searchUrl.searchParams.set('key', apiKey);

  const response = await fetch(searchUrl, { cache: 'no-store' });
  const json = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      {
        error: json?.error?.message || 'YouTube API request failed',
        raw: json,
      },
      { status: response.status }
    );
  }

  const items = Array.isArray(json.items)
    ? json.items.map((item: any) => ({
        channelId: item?.id?.channelId,
        title: item?.snippet?.title,
        thumbnailUrl:
          item?.snippet?.thumbnails?.default?.url ||
          item?.snippet?.thumbnails?.medium?.url ||
          item?.snippet?.thumbnails?.high?.url,
      })).filter((x: any) => x.channelId && x.title)
    : [];

  return NextResponse.json({ items });
}
