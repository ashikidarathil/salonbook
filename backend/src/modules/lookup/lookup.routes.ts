import { Router, type Request, type Response } from 'express';
import type { Model } from 'mongoose';
import { BranchModel } from '../../models/branch.model';
import { ServiceModel } from '../../models/service.model';
import { StylistModel } from '../../models/stylist.model';
import { looksLikeObjectId } from '../../common/utils/slug.util';
import { ApiResponse } from '../../common/response/apiResponse';
import { AppError } from '../../common/errors/appError';
import { HttpStatus } from '../../common/enums/httpStatus.enum';

/**
 * GET /api/resolve?branch=kochi&service=mens-haircut&stylist=arjun-menon
 *
 * Turns readable URL slugs (or old ids, for old links) into ids + canonical slugs,
 * so pages can keep calling the existing id-based endpoints.
 */
const router = Router();

type Found = { id: string; slug?: string; name?: string };

async function find<T>(model: Model<T>, value: string): Promise<Found | null> {
  const filter = looksLikeObjectId(value) ? { _id: value } : { slug: value.toLowerCase() };
  const doc = await model
    .findOne(filter as never)
    .select('_id slug name')
    .lean<{ _id: unknown; slug?: string; name?: string }>();
  return doc ? { id: String(doc._id), slug: doc.slug, name: doc.name } : null;
}

router.get('/resolve', async (req: Request, res: Response) => {
  const { branch, service, stylist } = req.query as Record<string, string | undefined>;
  if (!branch && !service && !stylist) {
    throw new AppError('Provide branch, service or stylist', HttpStatus.BAD_REQUEST);
  }

  const result: Record<string, Found | null> = {};
  if (branch) result.branch = await find(BranchModel, branch);
  if (service) result.service = await find(ServiceModel, service);
  if (stylist) result.stylist = await find(StylistModel, stylist);

  const missing = Object.entries(result)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    throw new AppError(`Not found: ${missing.join(', ')}`, HttpStatus.NOT_FOUND);
  }

  return ApiResponse.success(res, result, 'Resolved');
});

export default router;
