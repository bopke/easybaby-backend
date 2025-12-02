import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { Article } from '../entities';
import { CreateArticleDto, UpdateArticleDto } from '../dtos';
import { mockArticle } from '../mocks';
import { PaginationService } from '../../common/services/pagination.service';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let repository: Repository<Article>;
  let findOneSpy: jest.SpyInstance;
  let findAndCountSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;
  let removeSpy: jest.SpyInstance;

  const mockDataSource = {
    getMetadata: jest.fn().mockReturnValue({
      columns: [
        { propertyName: 'id' },
        { propertyName: 'slug' },
        { propertyName: 'metaTitle' },
        { propertyName: 'metaDescription' },
        { propertyName: 'header' },
        { propertyName: 'subheader' },
        { propertyName: 'contents' },
        { propertyName: 'author' },
        { propertyName: 'publishedDate' },
        { propertyName: 'createdAt' },
        { propertyName: 'updatedAt' },
      ],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        PaginationService,
        {
          provide: getRepositoryToken(Article),
          useValue: {
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    repository = module.get<Repository<Article>>(getRepositoryToken(Article));

    findOneSpy = jest.spyOn(repository, 'findOne');
    findAndCountSpy = jest.spyOn(repository, 'findAndCount');
    saveSpy = jest.spyOn(repository, 'save');
    removeSpy = jest.spyOn(repository, 'remove');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return a paginated response of articles', async () => {
      const articles = [
        mockArticle,
        { ...mockArticle, id: '2', slug: 'another-article' },
      ];
      findAndCountSpy.mockResolvedValue([articles, 2]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: {},
        order: { publishedDate: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        data: articles,
        total: 2,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return an article by UUID id', async () => {
      findOneSpy.mockResolvedValue(mockArticle);

      const result = await service.findOne(mockArticle.id);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: mockArticle.id },
      });
      expect(result).toEqual(mockArticle);
    });

    it('should return an article by slug', async () => {
      findOneSpy.mockResolvedValue(mockArticle);

      const result = await service.findOne(mockArticle.slug);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { slug: mockArticle.slug },
      });
      expect(result).toEqual(mockArticle);
    });

    it('should throw NotFoundException if article not found by ID', async () => {
      const articleId = '123e4567-e89b-12d3-a456-426614174001';
      findOneSpy.mockResolvedValue(null);

      await expect(service.findOne(articleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(articleId)).rejects.toThrow(
        `Article with ID "${articleId}" not found`,
      );

      expect(findOneSpy).toHaveBeenCalledWith({ where: { id: articleId } });
    });

    it('should throw NotFoundException if article not found by slug', async () => {
      const slug = 'non-existent-slug';
      findOneSpy.mockResolvedValue(null);

      await expect(service.findOne(slug)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(slug)).rejects.toThrow(
        `Article with slug "${slug}" not found`,
      );

      expect(findOneSpy).toHaveBeenCalledWith({ where: { slug } });
    });
  });

  describe('create', () => {
    it('should create a new article', async () => {
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

      const createdArticle: Article = {
        id: 'new-article-id',
        ...createArticleDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createSpy = jest
        .spyOn(repository, 'create')
        .mockReturnValue(createdArticle);
      saveSpy.mockResolvedValue(createdArticle);

      const result = await service.create(createArticleDto);

      expect(createSpy).toHaveBeenCalledWith(createArticleDto);
      expect(saveSpy).toHaveBeenCalledWith(createdArticle);
      expect(result).toEqual(createdArticle);
    });
  });

  describe('update', () => {
    const updateArticleDto: UpdateArticleDto = {
      header: 'Updated Header',
    };

    it('should update an article', async () => {
      const updatedArticle = { ...mockArticle, ...updateArticleDto };
      findOneSpy.mockResolvedValue(mockArticle);
      saveSpy.mockResolvedValue(updatedArticle);

      const result = await service.update(mockArticle.id, updateArticleDto);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: mockArticle.id },
      });
      expect(saveSpy).toHaveBeenCalledWith({
        ...mockArticle,
        ...updateArticleDto,
      });
      expect(result).toEqual(updatedArticle);
    });

    it('should throw NotFoundException if article not found', async () => {
      const articleId = '123e4567-e89b-12d3-a456-426614174001';
      findOneSpy.mockResolvedValue(null);

      await expect(service.update(articleId, updateArticleDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(articleId, updateArticleDto)).rejects.toThrow(
        `Article with ID "${articleId}" not found`,
      );

      expect(saveSpy).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an article', async () => {
      findOneSpy.mockResolvedValue(mockArticle);
      removeSpy.mockResolvedValue(mockArticle);

      await service.remove(mockArticle.id);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: mockArticle.id },
      });
      expect(removeSpy).toHaveBeenCalledWith(mockArticle);
    });

    it('should throw NotFoundException if article not found', async () => {
      const articleId = '123e4567-e89b-12d3-a456-426614174001';
      findOneSpy.mockResolvedValue(null);

      await expect(service.remove(articleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove(articleId)).rejects.toThrow(
        `Article with ID "${articleId}" not found`,
      );

      expect(removeSpy).not.toHaveBeenCalled();
    });
  });
});
