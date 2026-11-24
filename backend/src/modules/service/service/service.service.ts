import { assertSlugAvailable } from '../../../common/utils/slug.util';
import { ServiceModel, type ServiceImageField } from '../../../models/service.model';
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../../common/di/tokens';
import { AppError } from '../../../common/errors/appError';
import { HttpStatus } from '../../../common/enums/httpStatus.enum';
import { MESSAGES } from '../constants/service.messages';

import type { IServiceService } from './IServiceService';
import type { IServiceRepository } from '../repository/IServiceRepository';
import type {
  CreateServiceDto,
  UpdateServiceDto,
  SoftDeleteServiceDto,
  RestoreServiceDto,
  ServicePaginationQueryDto,
} from '../dto/service.request.dto';
import { ServiceMapper } from '../mapper/service.mapper';
import { CategoryModel, PopulatedCategory } from '../../../models/category.model';
import { ServiceUpdatePayload } from '../type/serviceUpdate.type';
import type { IImageService } from '../../../common/service/image/IImageService';
import { ServiceResponseDto } from '../dto/service.response.dto';
import type { ServicePaginatedResponse } from '../dto/service.response.dto';

@injectable()
export class ServiceService implements IServiceService {
  constructor(
    @inject(TOKENS.ServiceRepository) private readonly _repo: IServiceRepository,
    @inject(TOKENS.ImageService) private readonly _imageService: IImageService,
  ) {}

  async create(dto: CreateServiceDto) {
    if (!dto.name?.trim()) {
      throw new AppError(MESSAGES.SERVICE.NAME_REQUIRED, HttpStatus.BAD_REQUEST);
    }

    const category = await CategoryModel.findById(dto.categoryId);
    if (!category || category.isDeleted) {
      throw new AppError(MESSAGES.SERVICE.INVALID_CATEGORY, HttpStatus.BAD_REQUEST);
    }

    const exists = await this._repo.findByNameAndCategory(dto.name, dto.categoryId);
    if (exists) {
      throw new AppError(MESSAGES.SERVICE.ALREADY_EXISTS, HttpStatus.BAD_REQUEST);
    }

    if (dto.slug) await assertSlugAvailable(ServiceModel, dto.slug);
    const doc = await this._repo.create(dto);
    return ServiceMapper.toDto(doc);
  }

  async update(id: string, dto: UpdateServiceDto) {
    const update: ServiceUpdatePayload = {};

    if (dto.name?.trim()) update.name = dto.name.trim();
    if (dto.description !== undefined) update.description = dto.description?.trim();
    if (dto.status) update.status = dto.status;
    if (dto.imageUrl) update.imageUrl = dto.imageUrl;
    if (dto.categoryId) update.categoryId = dto.categoryId;
    if (dto.whatIncluded) update.whatIncluded = dto.whatIncluded;
    if (dto.slug) {
      await assertSlugAvailable(ServiceModel, dto.slug, id);
      update.slug = dto.slug;
    }

    const doc = await this._repo.updateById(id, update);
    if (!doc) throw new AppError(MESSAGES.SERVICE.NOT_FOUND, HttpStatus.NOT_FOUND);

    return ServiceMapper.toDto(doc);
  }

  async list(includeDeleted = false) {
    const docs = await this._repo.listAll(includeDeleted);
    const filtered = includeDeleted
      ? docs
      : docs.filter((d) => {
          const cat = d.categoryId as unknown as PopulatedCategory;
          return cat && cat.status === 'ACTIVE' && !cat.isDeleted;
        });
    return filtered.map(ServiceMapper.toDto);
  }

  async softDelete(dto: SoftDeleteServiceDto) {
    const doc = await this._repo.softDelete(dto.id);
    if (!doc) throw new AppError(MESSAGES.SERVICE.NOT_FOUND, HttpStatus.NOT_FOUND);
    return ServiceMapper.toDto(doc);
  }

  async restore(dto: RestoreServiceDto) {
    const doc = await this._repo.restore(dto.id);
    if (!doc) throw new AppError(MESSAGES.SERVICE.NOT_FOUND, HttpStatus.NOT_FOUND);
    return ServiceMapper.toDto(doc);
  }

  async getPaginatedServices(query: ServicePaginationQueryDto): Promise<ServicePaginatedResponse> {
    return this._repo.getPaginatedServices(query);
  }

  async uploadServiceImage(
    serviceId: string,
    file: Express.Multer.File,
    field: ServiceImageField = 'imageUrl',
  ): Promise<ServiceResponseDto> {
    const service = await this._repo.findById(serviceId);
    if (!service) {
      throw new AppError(MESSAGES.SERVICE.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const imageUrl = await this._imageService.uploadServiceImage({
      file,
      userId: serviceId,
      role: 'service',
      serviceId,
    });

    const oldUrl = service[field];
    // The card and page pictures may share one upload, so only remove it when unused
    const otherUrl = service[field === 'imageUrl' ? 'detailImageUrl' : 'imageUrl'];
    if (oldUrl && oldUrl !== otherUrl) {
      try {
        await this._imageService.deleteServiceImage(oldUrl);
      } catch (error) {
        console.error('Failed to delete old image:', error);
      }
    }

    const updatedService = await this._repo.updateImageUrl(serviceId, imageUrl, field);
    if (!updatedService) {
      throw new AppError(MESSAGES.SERVICE.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return ServiceMapper.toDto(updatedService);
  }

  async deleteServiceImage(
    serviceId: string,
    field: ServiceImageField = 'imageUrl',
  ): Promise<ServiceResponseDto> {
    const service = await this._repo.findById(serviceId);
    if (!service) {
      throw new AppError(MESSAGES.SERVICE.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const url = service[field];
    if (!url) {
      throw new AppError(MESSAGES.SERVICE.NO_IMAGE_FOUND, HttpStatus.BAD_REQUEST);
    }

    const otherUrl = service[field === 'imageUrl' ? 'detailImageUrl' : 'imageUrl'];
    if (url !== otherUrl) await this._imageService.deleteServiceImage(url);

    const updatedService = await this._repo.updateImageUrl(serviceId, '', field);
    if (!updatedService) {
      throw new AppError(MESSAGES.SERVICE.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return ServiceMapper.toDto(updatedService);
  }
}
