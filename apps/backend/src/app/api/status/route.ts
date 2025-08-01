import { NextRequest, NextResponse } from 'next/server';
import apiKeyManager from '../../../utils/apiKeyManager';

export async function GET(request: NextRequest) {
  try {
    const stats = apiKeyManager.getStats();

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        apiKeys: {
          total: stats.totalKeys,
          active: stats.activeKeys,
          totalRequests: stats.totalRequests,
          keys: stats.keyStats.map((key) => ({
            index: key.index,
            requests: key.requests,
            errors: key.errors,
            isActive: key.isActive,
            lastUsed: key.lastUsed
              ? new Date(key.lastUsed).toISOString()
              : null,
          })),
        },
      },
      {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'geolocation=()',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Status API error:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Service temporarily unavailable',
      },
      {
        status: 503,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'geolocation=()',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}
