import {NextResponse} from 'next/server';import {currentUser} from '@/lib/security';
export async function GET(){const u=await currentUser();return NextResponse.json({user:u?{id:u.id,name:u.name,email:u.email,role:u.role,organizationId:u.organizationId,permissions:u.permissions.map(p=>({permission:p.permission,allowed:p.allowed}))}:null});}
