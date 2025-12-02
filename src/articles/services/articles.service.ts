import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities';
import {
  CreateArticleDto,
  UpdateArticleDto,
  FilterArticleDto,
  OrderArticleDto,
} from '../dtos';
import { Paginated, Pagination } from '../../common/pagination';
import { PaginationService } from '../../common/services/pagination.service';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articlesRepository: Repository<Article>,
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(
    pagination: Pagination = { page: 1, limit: 10 },
    filters: FilterArticleDto = {},
    ordering: OrderArticleDto = {},
  ): Promise<Paginated<Article>> {
    const { page, limit } = pagination;

    const stringFields: (keyof Article)[] = [
      'slug',
      'metaTitle',
      'metaDescription',
      'header',
      'subheader',
      'contents',
      'author',
    ];

    const where = this.paginationService.buildWhereClause<Article>(
      filters as Record<string, unknown>,
      stringFields,
    );
    const order = this.paginationService.buildOrderClause<Article>(
      ordering.order,
      { publishedDate: 'DESC' },
      Article,
    );

    const [articles, total] = await this.articlesRepository.findAndCount({
      where,
      order,
      skip: this.paginationService.calculateSkip(page, limit),
      take: limit,
    });

    return { data: articles, total, page, limit };
  }

  async findOne(idOrSlug: string): Promise<Article> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const article = await this.articlesRepository.findOne({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
    });

    if (!article) {
      throw new NotFoundException(
        `Article with ${isUuid ? 'ID' : 'slug'} "${idOrSlug}" not found`,
      );
    }

    return article;
  }

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    const article = this.articlesRepository.create(createArticleDto);
    return this.articlesRepository.save(article);
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    const article = await this.findOne(id);
    Object.assign(article, updateArticleDto);
    return this.articlesRepository.save(article);
  }

  async remove(id: string): Promise<void> {
    const article = await this.findOne(id);
    await this.articlesRepository.remove(article);
  }
}
