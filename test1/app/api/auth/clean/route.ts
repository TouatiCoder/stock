// app/api/auth/clean/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ 
    message: 'Cookies cleaned',
    timestamp: new Date().toISOString()
  });
  
  // Supprimer TOUS les cookies Supabase
  const cookies = request.cookies.getAll();
  
  cookies.forEach(cookie => {
    if (cookie.name.includes('sb-') || cookie.name.includes('supabase')) {
      response.cookies.delete(cookie.name);
      console.log('Deleted cookie:', cookie.name);
    }
  });
  
  // Supprimer aussi les cookies communs
  response.cookies.delete('sb-gpeucfuxwguoimgmenie-auth-token');
  response.cookies.delete('sb-auth-token');
  
  return response;
}