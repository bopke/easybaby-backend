import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from '../services';
import {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleResponseDto,
  ArticleQueryDto,
} from '../dtos';
import { mockArticle } from '../mocks';

describe('ArticlesController', () => {
  let controller: ArticlesController;
  let articlesService: ArticlesService;

  const mockArticleResponse: ArticleResponseDto =
    ArticleResponseDto.fromEntity(mockArticle);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        {
          provide: ArticlesService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            findBySlug: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ArticlesController>(ArticlesController);
    articlesService = module.get<ArticlesService>(ArticlesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new article and return response DTO', async () => {
      const createArticleDto: CreateArticleDto = {
        slug: 'getting-started-with-baby-sign-language',
        metaTitle: 'Getting Started with Baby Sign Language - Complete Guide',
        metaDescription:
          'Learn how to introduce sign language to your baby with our comprehensive guide.',
        header: 'Getting Started with Baby Sign Language',
        subheader: 'A comprehensive guide for parents',
        contents:
          '<p>Baby sign language is a wonderful way to communicate...</p>',
        author: 'Dr. Jane Smith',
        publishedDate: new Date('2024-01-15T00:00:00.000Z'),
      };

      const createSpy = jest
        .spyOn(articlesService, 'create')
        .mockResolvedValue(mockArticle);

      const result = await controller.create(createArticleDto);

      expect(result).toEqual(mockArticleResponse);
      expect(createSpy).toHaveBeenCalledWith(createArticleDto);
      expect(createSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return a paginated response of article DTOs', async () => {
      const articles = [
        mockArticle,
        { ...mockArticle, id: '2', slug: 'another-article' },
      ];

      const paginatedResponse = {
        data: articles,
        total: 2,
        page: 1,
        limit: 10,
      };

      const findAllSpy = jest
        .spyOn(articlesService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const query: ArticleQueryDto = { page: 1, limit: 10 };
      const result = await controller.findAll(query, { user: undefined });

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('slug');
      expect(result.data[0]).not.toHaveProperty('createdAt');
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(findAllSpy).toHaveBeenCalledWith({ page: 1, limit: 10 }, {}, {});
      expect(findAllSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return an article response DTO by id', async () => {
      const findOneSpy = jest
        .spyOn(articlesService, 'findOne')
        .mockResolvedValue(mockArticle);

      const result = (await controller.findOne(mockArticle.id, {
        user: undefined,
      })) as Record<string, any>;

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('slug');
      expect(result).not.toHaveProperty('createdAt');
      expect(findOneSpy).toHaveBeenCalledWith(mockArticle.id);
      expect(findOneSpy).toHaveBeenCalledTimes(1);
    });

    it('should return an article response DTO by slug', async () => {
      const findOneSpy = jest
        .spyOn(articlesService, 'findOne')
        .mockResolvedValue(mockArticle);

      const result = (await controller.findOne(mockArticle.slug, {
        user: undefined,
      })) as Record<string, any>;

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('slug');
      expect(result).not.toHaveProperty('createdAt');
      expect(findOneSpy).toHaveBeenCalledWith(mockArticle.slug);
      expect(findOneSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when article not found', async () => {
      const articleId = '123e4567-e89b-12d3-a456-426614174001';
      jest
        .spyOn(articlesService, 'findOne')
        .mockRejectedValue(
          new NotFoundException(`Article with ID "${articleId}" not found`),
        );

      await expect(controller.findOne(articleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne(articleId)).rejects.toThrow(
        `Article with ID "${articleId}" not found`,
      );
    });
  });

  describe('update', () => {
    it('should update an article and return response DTO', async () => {
      const updateArticleDto: UpdateArticleDto = {
        header: 'Updated Header',
      };

      const updatedArticle = { ...mockArticle, header: 'Updated Header' };

      const updateSpy = jest
        .spyOn(articlesService, 'update')
        .mockResolvedValue(updatedArticle);

      const result = await controller.update(mockArticle.id, updateArticleDto);

      expect(result.header).toBe('Updated Header');
      expect(updateSpy).toHaveBeenCalledWith(mockArticle.id, updateArticleDto);
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when article not found', async () => {
      const articleId = '123e4567-e89b-12d3-a456-426614174001';
      const updateArticleDto: UpdateArticleDto = {
        header: 'Updated Header',
      };

      jest
        .spyOn(articlesService, 'update')
        .mockRejectedValue(
          new NotFoundException(`Article with ID "${articleId}" not found`),
        );

      await expect(
        controller.update(articleId, updateArticleDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.update(articleId, updateArticleDto),
      ).rejects.toThrow(`Article with ID "${articleId}" not found`);
    });
  });

  describe('remove', () => {
    it('should remove an article', async () => {
      const removeSpy = jest
        .spyOn(articlesService, 'remove')
        .mockResolvedValue(undefined);

      await controller.remove(mockArticle.id);

      expect(removeSpy).toHaveBeenCalledWith(mockArticle.id);
      expect(removeSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when article not found', async () => {
      const articleId = '123e4567-e89b-12d3-a456-426614174001';

      jest
        .spyOn(articlesService, 'remove')
        .mockRejectedValue(
          new NotFoundException(`Article with ID "${articleId}" not found`),
        );

      await expect(controller.remove(articleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.remove(articleId)).rejects.toThrow(
        `Article with ID "${articleId}" not found`,
      );
    });
  });
});
