import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { ObjectLiteral } from 'typeorm';

type MockRepo<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('UsersService', () => {
  let service: UsersService;
  let repo: MockRepo<User>;
  let cache: Partial<Cache>;

  beforeEach(async () => {
    const repoMock = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      merge: jest.fn(), // Adicionado mock para merge
    } as MockRepo<User>;

    const cacheMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as Partial<Cache>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repoMock,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(User));
    cache = module.get<Cache>(CACHE_MANAGER);
  });

  describe('create', () => {
    it('should throw ConflictException if email exists', async () => {
      (repo.findOneBy as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'a@a.com',
      } as User);
      await expect(
        service.create({ name: 'Test', email: 'a@a.com' } as CreateUserDto),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.findOneBy).toHaveBeenCalledWith({ email: 'a@a.com' });
    });

    it('should save and clear cache on success', async () => {
      const dto = { name: 'Jjoao ', email: 'jv@t.com' } as CreateUserDto;
      (repo.findOneBy as jest.Mock).mockResolvedValue(null);
      const saved = { id: 1, ...dto } as User;
      (repo.create as jest.Mock).mockReturnValue(dto);
      (repo.save as jest.Mock).mockResolvedValue(saved);

      const result = await service.create(dto);
      expect(result).toEqual(saved);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(dto);
      expect(cache.del).toHaveBeenCalledWith('users');
    });
  });

  describe('findAll', () => {
    it('should return from cache if present', async () => {
      const cached = [{ id: 1, name: 'C', email: 'c@c.com' }] as User[];
      (cache.get as jest.Mock).mockResolvedValue(cached);

      const result = await service.findAll();
      expect(result).toEqual(cached);
      expect(cache.get).toHaveBeenCalledWith('users');
      expect(repo.find).not.toHaveBeenCalled();
    });

    it('should fetch from repo and set cache if not cached', async () => {
      (cache.get as jest.Mock).mockResolvedValue(null);
      const list = [{ id: 2, name: 'L', email: 'l@l.com' }] as User[];
      (repo.find as jest.Mock).mockResolvedValue(list);

      const result = await service.findAll();
      expect(result).toEqual(list);
      expect(repo.find).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith('users', list, 60);
    });
  });

  describe('findOne', () => {
    it('should return from cache if present', async () => {
      const cached = { id: 3, name: 'X', email: 'x@x.com' } as User;
      (cache.get as jest.Mock).mockResolvedValue(cached);

      const result = await service.findOne(3);
      expect(result).toEqual(cached);
      expect(cache.get).toHaveBeenCalledWith('users:3');
      expect(repo.findOneBy).not.toHaveBeenCalled();
    });

    it('should fetch from repo and set cache if not cached', async () => {
      (cache.get as jest.Mock).mockResolvedValue(null);
      const user = { id: 4, name: 'Y', email: 'y@y.com' } as User;
      (repo.findOneBy as jest.Mock).mockResolvedValue(user);

      const result = await service.findOne(4);
      expect(result).toEqual(user);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 4 });
      expect(cache.set).toHaveBeenCalledWith('users:4', user, 60);
    });
  });

  describe('update', () => {
    it('should throw if user not found', async () => {
      (repo.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(
        service.update(5, { name: 'N' } as UpdateUserDto),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 5 });
    });

    it('should merge, save and clear cache if found', async () => {
      const orig = { id: 6, name: 'O', email: 'o@o.com' } as User;
      const dto = { name: 'O2' } as UpdateUserDto;
      const updated = { ...orig, ...dto } as User;

      (repo.findOneBy as jest.Mock).mockResolvedValue(orig);
      (repo.merge as jest.Mock).mockImplementation(
        (user: User, changes: Partial<User>): User => ({
          ...user,
          ...changes,
        }),
      );
      (repo.save as jest.Mock).mockResolvedValue(updated);

      const result = await service.update(6, dto);
      expect(repo.merge).toHaveBeenCalledWith(orig, dto);
      expect(result).toEqual(updated);
      expect(cache.del).toHaveBeenCalledWith('users');
    });
  });

  describe('remove', () => {
    it('should throw if user not found', async () => {
      (repo.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(service.remove(7)).rejects.toBeInstanceOf(ConflictException);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 7 });
    });

    it('should delete and clear cache if found', async () => {
      const orig = { id: 8, name: 'Z', email: 'z@z.com' } as User;
      (repo.findOneBy as jest.Mock).mockResolvedValue(orig);
      (repo.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      const result = await service.remove(8);
      expect(result).toEqual({ affected: 1 });
      expect(cache.del).toHaveBeenCalledWith('users');
    });
  });
});
