import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleTag } from '../entities';
import {
  CreateArticleDto,
  UpdateArticleDto,
  FilterArticleDto,
  OrderArticleDto,
} from '../dtos';
import { Paginated, Pagination } from '../../common/pagination';
import { PaginationService } from '../../common/services/pagination.service';
import { isUuid } from '../../common/utils';

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
    const isUuidValue = isUuid(idOrSlug);

    const article = await this.articlesRepository.findOne({
      where: isUuidValue ? { id: idOrSlug } : { slug: idOrSlug },
    });

    if (!article) {
      throw new NotFoundException(
        `Article with ${isUuidValue ? 'ID' : 'slug'} "${idOrSlug}" not found`,
      );
    }

    return article;
  }

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    const { tags, ...articleData } = createArticleDto;
    const article = this.articlesRepository.create(articleData);

    if (tags && tags.length > 0) {
      article.tags = tags.map((tag) => {
        const articleTag = new ArticleTag();
        articleTag.tag = tag;
        return articleTag;
      });
    }

    return this.articlesRepository.save(article);
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    const article = await this.findOne(id);
    const { tags, ...articleData } = updateArticleDto;

    Object.assign(article, articleData);

    if (tags) {
      article.tags = tags.map((tag) => {
        const articleTag = new ArticleTag();
        articleTag.tag = tag;
        return articleTag;
      });
    }

    return this.articlesRepository.save(article);
  }

  async remove(id: string): Promise<void> {
    const article = await this.findOne(id);
    await this.articlesRepository.remove(article);
  }
}
