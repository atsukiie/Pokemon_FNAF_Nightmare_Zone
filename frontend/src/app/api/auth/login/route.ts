import { login } from '../../../../lib/server-api';

export const runtime = 'nodejs';
export async function POST(request: Request) { return login(request); }
