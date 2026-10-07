import type { NextApiRequest, NextApiResponse } from 'next';
import { corsAllMethods, runMiddleware } from '@/utils/cors';
import { createSupabaseAdminClient } from '@/utils/supabase';
import { validateUserAndToken } from '@/utils/access';
import { deleteObject } from '@/utils/object';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, corsAllMethods);

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, token } = await validateUserAndToken(req.headers['authorization']);
    if (!user || !token) {
      return res.status(403).json({ error: 'Not authenticated' });
    }

    const { fileKey } = req.query;

    if (!fileKey || typeof fileKey !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid fileKey' });
    }

    try {
      // 1. Delete object from R2/S3 (and alias if present)
      await deleteObject(fileKey);
      let aliasKey: string | null = null;
      if (fileKey.includes('/Yomi/Books/')) {
        aliasKey = fileKey.replace('/Yomi/Books/', '/Readest/Books/');
      } else if (fileKey.includes('/Readest/Books/')) {
        aliasKey = fileKey.replace('/Readest/Books/', '/Yomi/Books/');
      }
      if (aliasKey) {
        await deleteObject(aliasKey).catch(() => {});
      }

      // 2. Soft delete in Supabase
      const supabase = createSupabaseAdminClient();
      const keysToSoftDelete = [fileKey, ...(aliasKey ? [aliasKey] : [])];
      const { error: supabaseError } = await supabase
        .from('files')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .in('file_key', keysToSoftDelete);

      if (supabaseError) {
        console.error('Error soft-deleting file metadata in Supabase:', supabaseError);
        return res.status(500).json({ error: supabaseError.message });
      }

      res.status(200).json({ message: 'File deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting file metadata or object:', error);
      res.status(500).json({ error: 'Could not delete file' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
