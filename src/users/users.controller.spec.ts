import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

/* eslint-disable @typescript-eslint/unbound-method */

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(usersController).toBeDefined();
  });

  describe('create', () => {
    it('should call UsersService.create and return its result', async () => {
      const dto: CreateUserDto = {
        name: 'Alice',
        email: 'alice@example.com',
      };
      const resultUser: User = {
        id: 1,
        name: dto.name,
        email: dto.email,
      };
      mockUsersService.create.mockResolvedValue(resultUser);

      const result = await usersController.create(dto);
      expect(usersService.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(resultUser);
    });
  });

  describe('findAll', () => {
    it('should call UsersService.findAll and return its result', async () => {
      const users: User[] = [];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await usersController.findAll();
      expect(usersService.findAll).toHaveBeenCalled();
      expect(result).toBe(users);
    });
  });

  describe('findOne', () => {
    it('should call UsersService.findOne with numeric id and return its result', async () => {
      const user: User = {
        id: 5,
        name: 'Bob',
        email: 'bob@example.com',
      };
      mockUsersService.findOne.mockResolvedValue(user);

      const result = await usersController.findOne('5');
      expect(usersService.findOne).toHaveBeenCalledWith(5);
      expect(result).toBe(user);
    });
  });

  describe('update', () => {
    it('should call UsersService.update with numeric id and dto, then return its result', async () => {
      const dto: UpdateUserDto = {
        name: 'Charlie',
        email: 'charlie@example.com',
      };

      const updatedUser: Partial<User> = {
        id: 7,
        name: dto.name,
        email: dto.email,
      };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await usersController.update('7', dto);
      expect(usersService.update).toHaveBeenCalledWith(7, dto);
      expect(result).toEqual(
        expect.objectContaining({
          id: 7,
          ...dto,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should call UsersService.remove with numeric id', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await usersController.remove('9');
      expect(usersService.remove).toHaveBeenCalledWith(9);
      expect(result).toBeUndefined();
    });
  });
});
