import { Test, TestingModule } from '@nestjs/testing';
import { PaginationService } from './pagination.service';
import { ILike } from 'typeorm';

interface TestEntity {
  id: string;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

describe('PaginationService', () => {
  let service: PaginationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaginationService],
    }).compile();

    service = module.get<PaginationService>(PaginationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildOrderClause', () => {
    it('should build order clause from order strings', () => {
      const orderStrings = ['name:asc', 'createdAt:desc'];
      const result = service.buildOrderClause<TestEntity>(orderStrings);

      expect(result).toEqual({
        name: 'ASC',
        createdAt: 'DESC',
      });
    });

    it('should convert direction to uppercase', () => {
      const orderStrings = ['name:asc', 'email:DESC', 'age:AsC'];
      const result = service.buildOrderClause<TestEntity>(orderStrings);

      expect(result).toEqual({
        name: 'ASC',
        email: 'DESC',
        age: 'ASC',
      });
    });

    it('should return default order when no order strings provided', () => {
      const defaultOrder = { createdAt: 'DESC' as const };
      const result = service.buildOrderClause<TestEntity>(
        undefined,
        defaultOrder,
      );

      expect(result).toEqual(defaultOrder);
    });

    it('should return default order when empty array provided', () => {
      const defaultOrder = { createdAt: 'DESC' as const };
      const result = service.buildOrderClause<TestEntity>([], defaultOrder);

      expect(result).toEqual(defaultOrder);
    });

    it('should return empty object when no order strings and no default', () => {
      const result = service.buildOrderClause<TestEntity>(undefined);

      expect(result).toEqual({});
    });

    it('should skip invalid order strings', () => {
      const orderStrings = ['name:asc', 'invalid', ':asc', 'field:'];
      const result = service.buildOrderClause<TestEntity>(orderStrings);

      expect(result).toEqual({
        name: 'ASC',
      });
    });
  });

  describe('applyStringFilter', () => {
    it('should wrap value with ILike and wildcards', () => {
      const result = service.applyStringFilter('test');

      expect(result).toEqual(ILike('%test%'));
    });

    it('should handle special characters', () => {
      const result = service.applyStringFilter('test@example.com');

      expect(result).toEqual(ILike('%test@example.com%'));
    });
  });

  describe('buildWhereClause', () => {
    it('should apply string filters with ILike', () => {
      const filters = {
        name: 'john',
        email: 'test@example.com',
      };
      const stringFields: (keyof TestEntity)[] = ['name', 'email'];

      const result = service.buildWhereClause<TestEntity>(
        filters,
        stringFields,
      );

      expect(result).toEqual({
        name: ILike('%john%'),
        email: ILike('%test@example.com%'),
      });
    });

    it('should apply non-string filters directly', () => {
      const filters = {
        age: 25,
        isActive: true,
      };
      const stringFields: (keyof TestEntity)[] = ['name', 'email'];

      const result = service.buildWhereClause<TestEntity>(
        filters,
        stringFields,
      );

      expect(result).toEqual({
        age: 25,
        isActive: true,
      });
    });

    it('should combine string and non-string filters', () => {
      const filters = {
        name: 'john',
        email: 'test',
        age: 25,
        isActive: true,
      };
      const stringFields: (keyof TestEntity)[] = ['name', 'email'];

      const result = service.buildWhereClause<TestEntity>(
        filters,
        stringFields,
      );

      expect(result).toEqual({
        name: ILike('%john%'),
        email: ILike('%test%'),
        age: 25,
        isActive: true,
      });
    });

    it('should include base where clause', () => {
      const filters = {
        name: 'john',
      };
      const stringFields: (keyof TestEntity)[] = ['name'];
      const baseWhere = {
        isActive: true,
      };

      const result = service.buildWhereClause<TestEntity>(
        filters,
        stringFields,
        baseWhere,
      );

      expect(result).toEqual({
        isActive: true,
        name: ILike('%john%'),
      });
    });

    it('should skip undefined values', () => {
      const filters = {
        name: 'john',
        email: undefined,
        age: undefined,
      };
      const stringFields: (keyof TestEntity)[] = ['name', 'email'];

      const result = service.buildWhereClause<TestEntity>(
        filters,
        stringFields,
      );

      expect(result).toEqual({
        name: ILike('%john%'),
      });
    });

    it('should skip empty strings', () => {
      const filters = {
        name: 'john',
        email: '',
      };
      const stringFields: (keyof TestEntity)[] = ['name', 'email'];

      const result = service.buildWhereClause<TestEntity>(
        filters,
        stringFields,
      );

      expect(result).toEqual({
        name: ILike('%john%'),
      });
    });

    it('should handle empty filters object', () => {
      const filters = {};
      const stringFields: (keyof TestEntity)[] = ['name', 'email'];

      const result = service.buildWhereClause<TestEntity>(
        filters,
        stringFields,
      );

      expect(result).toEqual({});
    });

    it('should handle empty string fields array', () => {
      const filters = {
        age: 25,
        isActive: true,
      };
      const stringFields: (keyof TestEntity)[] = [];

      const result = service.buildWhereClause<TestEntity>(
        filters,
        stringFields,
      );

      expect(result).toEqual({
        age: 25,
        isActive: true,
      });
    });
  });

  describe('calculateSkip', () => {
    it('should calculate skip for first page', () => {
      const result = service.calculateSkip(1, 10);

      expect(result).toBe(0);
    });

    it('should calculate skip for second page', () => {
      const result = service.calculateSkip(2, 10);

      expect(result).toBe(10);
    });

    it('should calculate skip for arbitrary page', () => {
      const result = service.calculateSkip(5, 20);

      expect(result).toBe(80);
    });

    it('should handle different page sizes', () => {
      expect(service.calculateSkip(3, 5)).toBe(10);
      expect(service.calculateSkip(3, 25)).toBe(50);
      expect(service.calculateSkip(3, 100)).toBe(200);
    });
  });
});
