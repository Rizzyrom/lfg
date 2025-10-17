/**
 * Compatibility layer for Supabase-style API using Prisma
 * This provides a Supabase-like interface while using Prisma underneath
 */

import { db } from '@/lib/db';
import { cookies } from 'next/headers';

interface SupabaseResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

export async function createClient() {
  // Get user from session cookie (assuming Lucia auth)
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('auth_session')?.value;

  // Return Supabase-compatible API
  return {
    auth: {
      getUser: async () => {
        if (!sessionId) {
          return { data: { user: null }, error: null };
        }

        try {
          const session = await db.session.findUnique({
            where: { id: sessionId },
            include: { user: true },
          });

          if (!session) {
            return { data: { user: null }, error: null };
          }

          return {
            data: {
              user: {
                id: session.user.id,
                email: session.user.email,
                user_metadata: {},
              },
            },
            error: null,
          };
        } catch (error: any) {
          return {
            data: { user: null },
            error: { message: error.message },
          };
        }
      },
    },

    from: (table: string) => {
      return {
        select: (columns?: string) => ({
          eq: (column: string, value: any) => ({
            single: async () => {
              try {
                const result = await (db as any)[table].findFirst({
                  where: { [column]: value },
                });
                return { data: result, error: null };
              } catch (error: any) {
                return { data: null, error: { message: error.message } };
              }
            },
          }),
        }),
        insert: async (data: any) => {
          try {
            const result = await (db as any)[table].create({ data });
            return { data: result, error: null };
          } catch (error: any) {
            return { data: null, error: { message: error.message } };
          }
        },
        upsert: async (data: any, options?: any) => {
          try {
            const where = options?.onConflict
              ? { [options.onConflict]: data[options.onConflict] }
              : { id: data.id };

            const result = await (db as any)[table].upsert({
              where,
              create: data,
              update: data,
            });

            return { data: result, error: null };
          } catch (error: any) {
            return { data: null, error: { message: error.message } };
          }
        },
      };
    },
  };
}
