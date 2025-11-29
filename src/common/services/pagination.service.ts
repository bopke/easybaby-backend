import { Injectable } from '@nestjs/common';
import {
  FindOptionsOrder,
  FindOptionsWhere,
  ILike,
  DataSource,
  EntityTarget,
} from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

/**
 * Utility service for building TypeORM pagination, filtering, and ordering clauses
 */
@Injectable()
export class PaginationService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Get valid column names from entity metadata
   * @param entity The entity class to get columns from
   * @returns Array of valid column names
   */
  private getEntityColumns<T>(entity: EntityTarget<T>): string[] {
    const metadata = this.dataSource.getMetadata(entity);
    return metadata.columns.map((col) => col.propertyName);
  }

  /**
   * Build TypeORM order clause from array of order strings
   * @param orderStrings Array of strings in format "field:direction" (e.g., ["name:asc", "createdAt:desc"])
   * @param defaultOrder Default order if no order strings provided (e.g., { createdAt: 'DESC' })
   * @param entity Optional entity class to validate fields against
   * @returns TypeORM FindOptionsOrder object
   *
   * @example
   * const order = paginationService.buildOrderClause<Trainer>(
   *   ['name:asc', 'createdAt:desc'],
   *   { createdAt: 'DESC' },
   *   Trainer
   * );
   */
  buildOrderClause<T>(
    orderStrings: string[] | undefined,
    defaultOrder: FindOptionsOrder<T> = {},
    entity?: EntityTarget<T>,
  ): FindOptionsOrder<T> {
    const order: FindOptionsOrder<T> = {};

    if (orderStrings && orderStrings.length > 0) {
      // Get valid columns from entity metadata if entity is provided
      const validColumns = entity ? this.getEntityColumns(entity) : null;

      for (const orderStr of orderStrings) {
        const [field, direction] = orderStr.split(':');

        if (!field || !direction) {
          continue;
        }

        if (validColumns && !validColumns.includes(field)) {
          continue;
        }

        const normalizedDirection = direction.toUpperCase();
        if (normalizedDirection !== 'ASC' && normalizedDirection !== 'DESC') {
          continue;
        }

        (order as Record<string, 'ASC' | 'DESC'>)[field] = normalizedDirection;
      }

      if (Object.keys(order).length > 0) {
        return order;
      }
    }

    return defaultOrder;
  }

  /**
   * Apply case-insensitive partial string matching to a filter field
   * @param value The filter value
   * @returns ILike query with wildcards for partial matching
   *
   * @example
   * if (filters.name) {
   *   where.name = paginationService.applyStringFilter(filters.name);
   * }
   */
  applyStringFilter(value: string) {
    return ILike(`%${value}%`);
  }

  /**
   * Build where clause with string filters applied using ILike
   * @param filters Object with filter values
   * @param stringFields Array of field names that should use ILike (case-insensitive partial matching)
   * @param baseWhere Optional base where clause to start with
   * @returns TypeORM FindOptionsWhere object
   *
   * @example
   * const where = paginationService.buildWhereClause<Trainer>(
   *   filters,
   *   ['name', 'city', 'email'],
   *   { isActive: true }  // base where clause
   * );
   */
  buildWhereClause<T>(
    filters: Record<string, unknown>,
    stringFields: (keyof T)[],
    baseWhere: FindOptionsWhere<T> = {},
  ): FindOptionsWhere<T> {
    const where: FindOptionsWhere<T> = { ...baseWhere };

    // Apply string filters with ILike
    for (const field of stringFields) {
      const value = filters[field as string];
      if (typeof value === 'string' && value) {
        where[field] = this.applyStringFilter(
          value,
        ) as FindOptionsWhere<T>[keyof T];
      }
    }

    // Apply other filters (boolean, number, etc.) directly
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && !stringFields.includes(key as keyof T)) {
        where[key as keyof T] = value as FindOptionsWhere<T>[keyof T];
      }
    }

    return where;
  }

  /**
   * Calculate skip value for pagination
   * @param page Current page number (1-indexed)
   * @param limit Items per page
   * @returns Number of items to skip
   */
  calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}
