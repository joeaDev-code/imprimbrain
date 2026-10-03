import {NextResponse} from 'next/server';import {db} from '@/lib/prisma';import {requireOrgUser} from '@/lib/security';import {apiError} from '@/lib/api-error';

function sanitizeMetadata(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sanitizeMetadata);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).filter(([key]) => !/(password|token|secret|authorization|encrypted|blind.?index)/i.test(key))
				.map(([key, entry]) => [key, sanitizeMetadata(entry)]),
		);
	}
	return value;
}

export async function GET(){try{const u=await requireOrgUser('AUDIT_VIEW');const rows=await db.auditLog.findMany({where:{organizationId:u.organizationId!},select:{id:true,action:true,entity:true,entityId:true,metadata:true,createdAt:true,user:{select:{name:true,email:true}}},orderBy:{createdAt:'desc'},take:500});return NextResponse.json(rows.map(({metadata,...row})=>({...row,metadata:sanitizeMetadata(metadata)})));}catch(error){return apiError(error);}}
