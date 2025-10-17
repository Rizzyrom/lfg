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
      const buildQuery = (options: {
        where?: any;
        orderBy?: any;
        take?: number;
      } = {}) => ({
        select: (columns?: string) => buildQuery(options),
        eq: (column: string, value: any) =>
          buildQuery({
            ...options,
            where: { ...options.where, [column]: value },
          }),
        order: (column: string, opts?: { ascending?: boolean }) =>
          buildQuery({
            ...options,
            orderBy: { [column]: opts?.ascending ? 'asc' : 'desc' },
          }),
        limit: (count: number) =>
          buildQuery({ ...options, take: count }),
        single: async () => {
          try {
            const result = await (db as any)[table].findFirst({
              where: options.where,
              orderBy: options.orderBy,
            });
            return { data: result, error: null };
          } catch (error: any) {
            return { data: null, error: { message: error.message } };
          }
        },
        execute: async () => {
          try {
            const result = await (db as any)[table].findMany({
              where: options.where,
              orderBy: options.orderBy,
              take: options.take,
            });
            return { data: result, error: null };
          } catch (error: any) {
            return { data: null, error: { message: error.message } };
          }
        },
      });

      return {
        ...buildQuery(),
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
