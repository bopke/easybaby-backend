import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { Roles, OptionalAuth } from '../../auth/decorators';
import { UserRole } from '../../users/entities/enums';
import { ArticlesService } from '../services';
import {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleResponseDto,
  ArticleQueryDto,
} from '../dtos';
import { Paginated } from '../../common/pagination';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

interface RequestWithUser {
  user?: JwtPayload;
}

@ApiTags('Articles')
@ApiExtraModels(ArticleResponseDto)
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new article (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Article created successfully',
    type: ArticleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT token required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async create(
    @Body() createArticleDto: CreateArticleDto,
  ): Promise<ArticleResponseDto> {
    const article = await this.articlesService.create(createArticleDto);
    return ArticleResponseDto.fromEntity(article);
  }

  @Get()
  @OptionalAuth()
  @ApiOperation({
    summary:
      'Get all articles with optional filtering, ordering, and pagination. ' +
      'Returns different fields based on authentication: ' +
      'public (unauthenticated) sees all public content, ' +
      'admins see all fields including timestamps.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Paginated list of articles matching the filters and ordering. ' +
      'Fields returned depend on user role.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ArticleResponseDto) },
        },
        total: {
          type: 'number',
          description: 'Total number of articles matching the filters',
          example: 100,
        },
        page: {
          type: 'number',
          description: 'Current page number',
          example: 1,
        },
        limit: {
          type: 'number',
          description: 'Number of items per page',
          example: 10,
        },
      },
    },
  })
  @ApiBearerAuth()
  async findAll(
    @Query() query: ArticleQueryDto,
    @Request() req: RequestWithUser,
  ): Promise<Paginated<any>> {
    const { page = 1, limit = 10, order, ...filters } = query;

    const articles = await this.articlesService.findAll(
      { page, limit },
      filters,
      { order },
    );

    const group = this.getSerializationGroup(req.user);

    return {
      ...articles,
      data: ArticleResponseDto.fromEntities(articles.data, [group]),
    };
  }

  private getSerializationGroup(user?: JwtPayload): string {
    if (!user) {
      return 'public';
    }
    if (user.role === UserRole.ADMIN) {
      return 'admin';
    }
    return 'user';
  }

  @Get(':idOrSlug')
  @OptionalAuth()
  @ApiOperation({
    summary:
      'Get an article by ID or slug. Returns different fields based on authentication. ' +
      'Automatically detects if the parameter is a UUID (ID) or a string (slug).',
  })
  @ApiParam({
    name: 'idOrSlug',
    description: 'Article UUID or slug',
    examples: {
      uuid: {
        value: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Search by UUID',
      },
      slug: {
        value: 'getting-started-with-baby-sign-language',
        description: 'Search by slug',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Article found. Fields returned depend on user role.',
    type: ArticleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found',
  })
  @ApiBearerAuth()
  async findOne(
    @Param('idOrSlug') idOrSlug: string,
    @Request() req: RequestWithUser,
  ): Promise<any> {
    const article = await this.articlesService.findOne(idOrSlug);
    const group = this.getSerializationGroup(req.user);
    return ArticleResponseDto.fromEntity(article, [group]);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an article (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Article UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Article updated successfully',
    type: ArticleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or UUID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT token required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleResponseDto> {
    const article = await this.articlesService.update(id, updateArticleDto);
    return ArticleResponseDto.fromEntity(article);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an article (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Article UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Article deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT token required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.articlesService.remove(id);
  }
}
