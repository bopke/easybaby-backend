import { ApiProperty } from '@nestjs/swagger';

export class Paginated<T> {
  @ApiProperty({ description: 'Array of items', isArray: true })
  data: T[];

  @ApiProperty({ description: 'Total number of items', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 10 })
  limit: number;
}

export interface Pagination {
  page: number;
  limit: number;
}
