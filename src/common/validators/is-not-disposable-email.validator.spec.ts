import { validate } from 'class-validator';
import { IsNotDisposableEmail } from './is-not-disposable-email.validator';

class TestDto {
  @IsNotDisposableEmail()
  email: string;
}

describe('IsNotDisposableEmail', () => {
  it('should allow legitimate email domains', async () => {
    const dto = new TestDto();
    dto.email = 'user@gmail.com';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should allow business email domains', async () => {
    const dto = new TestDto();
    dto.email = 'contact@company.com';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should block known disposable email domains', async () => {
    const dto = new TestDto();
    dto.email = 'test@guerrillamail.com';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty(
      'IsNotDisposableEmailConstraint',
    );
    expect(errors[0].constraints?.IsNotDisposableEmailConstraint).toBe(
      'Disposable email addresses are not allowed',
    );
  });

  it('should return false for email without @ symbol', async () => {
    const dto = new TestDto();
    dto.email = 'invalidemail';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should return false for empty email', async () => {
    const dto = new TestDto();
    dto.email = '';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should be case-insensitive for domains', async () => {
    const dto = new TestDto();
    dto.email = 'test@GUERRILLAMAIL.COM';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });
});
